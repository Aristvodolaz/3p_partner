import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateActDto } from './dto/generate-act.dto';

interface ActOperationLine {
  operationName: string;
  unit: string | null;
  tariff: number;
  qty: number;
  amount: number;
}

interface ActBreakdownItem {
  article: string;
  name: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  operations: ActOperationLine[];
}

interface ActBreakdownRequest {
  requestId: number;
  requestNumber: string;
  items: ActBreakdownItem[];
  requestTotal: number;
}

@Injectable()
export class ActsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dto: GenerateActDto, createdBy = 'system') {
    const partner = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
    if (!partner) throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);

    let requests: Awaited<ReturnType<typeof this.loadRequests>>;

    if (dto.type === 'MONTHLY') {
      if (!dto.periodLabel) {
        throw new BadRequestException('Для типа MONTHLY укажите periodLabel (ГГГГ-ММ)');
      }
      const [year, month] = dto.periodLabel.split('-').map(Number);
      const periodStart = new Date(Date.UTC(year, month - 1, 1));
      const periodEnd = new Date(Date.UTC(year, month, 1));
      requests = await this.prisma.partnerRequest.findMany({
        where: {
          partnerId: dto.partnerId,
          status: { in: ['Отгружено', 'Закрыто'] },
          requestDate: { gte: periodStart, lt: periodEnd },
        },
        include: { items: true },
      });
    } else {
      if (!dto.requestIds || dto.requestIds.length === 0) {
        throw new BadRequestException('Укажите requestIds для этого типа акта');
      }
      requests = await this.loadRequests(dto.partnerId, dto.requestIds);
      if (requests.length !== dto.requestIds.length) {
        throw new NotFoundException('Одна или несколько заявок не найдены у этого партнёра');
      }
    }

    const operationsByArticle = await this.buildOperationBreakdown(dto.partnerId);

    const breakdown: ActBreakdownRequest[] = requests.map((r) => {
      const items: ActBreakdownItem[] = r.items.map((i) => {
        const opTemplate = operationsByArticle.get(normalizeArticle(i.article)) ?? [];
        const operations: ActOperationLine[] = opTemplate.map((op) => ({
          ...op,
          amount: round2(op.tariff * op.qty * i.quantity),
        }));
        return {
          article: i.article,
          name: i.name,
          quantity: i.quantity,
          unitCost: i.unitCost != null ? Number(i.unitCost) : 0,
          totalCost: i.totalCost != null ? Number(i.totalCost) : 0,
          operations,
        };
      });
      const requestTotal = items.reduce((sum, i) => sum + i.totalCost, 0);
      return { requestId: r.id, requestNumber: r.number, items, requestTotal };
    });

    const totalAmount = breakdown.reduce((sum, r) => sum + r.requestTotal, 0);

    const act = await this.prisma.act.create({
      data: {
        partnerId: dto.partnerId,
        type: dto.type,
        periodLabel: dto.periodLabel ?? null,
        totalAmount,
        data: JSON.stringify({ partnerName: partner.name, requests: breakdown }),
        createdBy,
        requests: {
          create: breakdown.map((r) => ({
            requestId: r.requestId,
            requestNumber: r.requestNumber,
            amount: r.requestTotal,
          })),
        },
      },
      include: { requests: true },
    });

    return this.toResponse(act);
  }

  async findAll(partnerId?: number) {
    const acts = await this.prisma.act.findMany({
      where: partnerId ? { partnerId } : undefined,
      include: { requests: true, partner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return acts.map((a) => this.toResponse(a));
  }

  async findOne(id: number) {
    const act = await this.prisma.act.findUnique({
      where: { id },
      include: { requests: true, partner: { select: { id: true, name: true } } },
    });
    if (!act) throw new NotFoundException(`Акт #${id} не найден`);
    return this.toResponse(act);
  }

  private async loadRequests(partnerId: number, requestIds: number[]) {
    return this.prisma.partnerRequest.findMany({
      where: { id: { in: requestIds }, partnerId },
      include: { items: true },
    });
  }

  /**
   * Построчная разбивка по операциям для каждого артикула партнёра:
   * операция × тариф (с учётом коэффициента по ШДВ) × кол-во из карточки SKU.
   * Используется для детализации акта («операции × кол-во × тариф = сумма» — ТЗ 2.10).
   */
  private async buildOperationBreakdown(
    partnerId: number,
  ): Promise<Map<string, Omit<ActOperationLine, 'amount'>[]>> {
    const [skus, tariffs, coefficients] = await this.prisma.$transaction([
      this.prisma.sku.findMany({
        where: { partnerId },
        include: { operations: { include: { operation: true } } },
      }),
      this.prisma.partnerTariff.findMany({ where: { partnerId } }),
      this.prisma.tariffCoefficient.findMany(),
    ]);

    const tariffByOp = new Map(tariffs.map((t) => [t.operationId, Number(t.tariff)]));

    const byArticle = new Map<string, Omit<ActOperationLine, 'amount'>[]>();
    for (const sku of skus) {
      const sum = sku.sumOfSides != null ? Number(sku.sumOfSides) : undefined;
      const lines: Omit<ActOperationLine, 'amount'>[] = sku.operations.map((so) => {
        const base =
          tariffByOp.get(so.operationId) ??
          (so.operation.tariff != null ? Number(so.operation.tariff) : 0);

        let multiplier = 1;
        if (so.operation.applySizeCoef && sum !== undefined) {
          const coef = coefficients.find((c) => {
            const min = Number(c.minSum);
            const max = c.maxSum != null ? Number(c.maxSum) : Infinity;
            return sum >= min && sum <= max;
          });
          if (coef) multiplier = Number(coef.multiplier);
        }

        return {
          operationName: so.operation.name,
          unit: so.operation.unit,
          tariff: round2(base * multiplier),
          qty: parseQty(so.value),
        };
      });
      byArticle.set(normalizeArticle(sku.article), lines);
    }

    return byArticle;
  }

  private toResponse(act: {
    id: number;
    partnerId: number;
    type: string;
    periodLabel: string | null;
    totalAmount: unknown;
    data: string;
    createdBy: string;
    createdAt: Date;
    requests: { requestId: number; requestNumber: string; amount: unknown }[];
    partner?: { id: number; name: string };
  }) {
    return {
      id: act.id,
      partnerId: act.partnerId,
      partner: act.partner,
      type: act.type,
      periodLabel: act.periodLabel,
      totalAmount: Number(act.totalAmount),
      createdBy: act.createdBy,
      createdAt: act.createdAt,
      requests: act.requests.map((r) => ({
        requestId: r.requestId,
        requestNumber: r.requestNumber,
        amount: Number(r.amount),
      })),
      breakdown: JSON.parse(act.data),
    };
  }
}

function normalizeArticle(s: string): string {
  return s.trim().toLowerCase();
}

function parseQty(value: string | null): number {
  if (!value) return 1;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
