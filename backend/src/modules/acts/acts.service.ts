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

  /**
   * Источник биллинга — ИСП (OutgoingDelivery), а не архивная PartnerRequest
   * (см. схему из Документ5.docx): акт выставляется по факту отгрузки.
   * Разбивка строится из фактического (возможно переопределённого, п.8
   * ИСП-блока ТЗ) состава операций каждой позиции — OutgoingDeliveryItem.
   * operations — а не пересчитывается заново из дефолтов справочника SKU,
   * как было раньше: так акт всегда отражает реально выполненные операции.
   */
  async generate(dto: GenerateActDto, createdBy = 'system') {
    const partner = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
    if (!partner) throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);

    let deliveries: Awaited<ReturnType<typeof this.loadDeliveries>>;

    if (dto.type === 'MONTHLY') {
      if (!dto.periodLabel) {
        throw new BadRequestException('Для типа MONTHLY укажите periodLabel (ГГГГ-ММ)');
      }
      const [year, month] = dto.periodLabel.split('-').map(Number);
      const periodStart = new Date(Date.UTC(year, month - 1, 1));
      const periodEnd = new Date(Date.UTC(year, month, 1));
      deliveries = await this.prisma.outgoingDelivery.findMany({
        where: {
          partnerId: dto.partnerId,
          status: 'Выполнено',
          actualDate: { gte: periodStart, lt: periodEnd },
        },
        include: deliveryInclude,
      });
    } else {
      if (!dto.requestIds || dto.requestIds.length === 0) {
        throw new BadRequestException('Укажите requestIds для этого типа акта');
      }
      deliveries = await this.loadDeliveries(dto.partnerId, dto.requestIds);
      if (deliveries.length !== dto.requestIds.length) {
        throw new NotFoundException('Одна или несколько ИСП не найдены у этого партнёра');
      }
    }

    const tariffByOp = await this.buildTariffIndex(dto.partnerId);

    const breakdown: ActBreakdownRequest[] = deliveries.map((d) => {
      const items: ActBreakdownItem[] = d.items.map((i) => {
        const operations: ActOperationLine[] = i.operations.map((io) => {
          const base =
            tariffByOp.get(io.operationId) ??
            (io.operation.tariff != null ? Number(io.operation.tariff) : 0);
          const qty = parseQty(io.value);
          return {
            operationName: io.operation.name,
            unit: io.operation.unit,
            tariff: round2(base),
            qty,
            amount: round2(base * qty),
          };
        });
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
      return { requestId: d.id, requestNumber: d.number, items, requestTotal };
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
            docType: 'OUTGOING',
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

  private async loadDeliveries(partnerId: number, ids: number[]) {
    return this.prisma.outgoingDelivery.findMany({
      where: { id: { in: ids }, partnerId },
      include: deliveryInclude,
    });
  }

  private async buildTariffIndex(partnerId: number): Promise<Map<number, number>> {
    const tariffs = await this.prisma.partnerTariff.findMany({ where: { partnerId } });
    return new Map(tariffs.map((t) => [t.operationId, Number(t.tariff)]));
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

const deliveryInclude = {
  items: { include: { operations: { include: { operation: true } } } },
} as const;

function parseQty(value: string | null): number {
  if (!value) return 1;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
