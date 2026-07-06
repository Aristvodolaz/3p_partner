import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRequestDto,
  RequestItemDto,
  UpdateRequestDto,
} from './dto/create-request.dto';

const requestInclude = {
  partner: { select: { id: true, name: true } },
  items: { include: { sku: { select: { id: true, article: true, name: true } } } },
} satisfies Prisma.PartnerRequestInclude;

interface CostContext {
  /** артикул → { skuId, unitCost } */
  byArticle: Map<string, { skuId: number; unitCost: number }>;
}

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { partnerId?: number; search?: string; status?: string }) {
    const where: Prisma.PartnerRequestWhereInput = {};
    if (query.partnerId) where.partnerId = query.partnerId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search } },
        { comment: { contains: query.search } },
        { items: { some: { article: { contains: query.search } } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.partnerRequest.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.partnerRequest.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: number) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    if (!request) throw new NotFoundException(`Заявка #${id} не найдена`);
    return request;
  }

  async create(dto: CreateRequestDto) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: dto.partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);
    }

    const dup = await this.prisma.partnerRequest.findUnique({
      where: { number: dto.number },
    });
    if (dup) {
      throw new ConflictException(`Заявка с номером «${dto.number}» уже существует`);
    }

    const ctx = await this.buildCostContext(dto.partnerId);

    const request = await this.prisma.partnerRequest.create({
      data: {
        partnerId: dto.partnerId,
        number: dto.number,
        requestDate: dto.requestDate ? new Date(dto.requestDate) : null,
        comment: dto.comment ?? null,
        items: { create: dto.items.map((item) => this.buildItem(item, ctx)) },
      },
      include: requestInclude,
    });
    return request;
  }

  async update(id: number, dto: UpdateRequestDto) {
    const request = await this.findOne(id);

    if (dto.number && dto.number !== request.number) {
      const dup = await this.prisma.partnerRequest.findUnique({
        where: { number: dto.number },
      });
      if (dup) {
        throw new ConflictException(`Заявка с номером «${dto.number}» уже существует`);
      }
    }

    const partnerId = dto.partnerId ?? request.partnerId;
    const data: Prisma.PartnerRequestUpdateInput = {};
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.comment !== undefined) data.comment = dto.comment;
    if (dto.requestDate !== undefined) {
      data.requestDate = dto.requestDate ? new Date(dto.requestDate) : null;
    }
    if (dto.partnerId !== undefined) {
      data.partner = { connect: { id: dto.partnerId } };
    }

    // Позиции заменяются целиком, если переданы
    if (dto.items !== undefined) {
      const ctx = await this.buildCostContext(partnerId);
      await this.prisma.requestItem.deleteMany({ where: { requestId: id } });
      data.items = { create: dto.items.map((item) => this.buildItem(item, ctx)) };
    }

    return this.prisma.partnerRequest.update({
      where: { id },
      data,
      include: requestInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.partnerRequest.delete({ where: { id } });
    return { deleted: true };
  }

  /** Пересчёт предварительной стоимости по актуальным тарифам и справочнику */
  async recalculate(id: number) {
    const request = await this.findOne(id);
    const ctx = await this.buildCostContext(request.partnerId);

    for (const item of request.items) {
      const found = ctx.byArticle.get(normalizeArticle(item.article));
      await this.prisma.requestItem.update({
        where: { id: item.id },
        data: {
          skuId: found?.skuId ?? null,
          unitCost: found ? found.unitCost : null,
          totalCost: found ? round2(found.unitCost * item.quantity) : null,
        },
      });
    }
    return this.findOne(id);
  }

  private buildItem(
    item: RequestItemDto,
    ctx: CostContext,
  ): Prisma.RequestItemCreateWithoutRequestInput {
    const found = ctx.byArticle.get(normalizeArticle(item.article));
    return {
      article: item.article,
      name: item.name ?? null,
      quantity: item.quantity,
      arrivalDate: item.arrivalDate ? new Date(item.arrivalDate) : null,
      shipmentDate: item.shipmentDate ? new Date(item.shipmentDate) : null,
      sku: found ? { connect: { id: found.skuId } } : undefined,
      unitCost: found ? found.unitCost : null,
      totalCost: found ? round2(found.unitCost * item.quantity) : null,
    };
  }

  /**
   * Предварительная стоимость обработки 1 ед. по каждому SKU партнёра:
   * сумма по операциям SKU (тариф партнёра или базовый) × коэффициент К
   * по ШДВ (для операций с applySizeCoef) × количество из справочника.
   */
  private async buildCostContext(partnerId: number): Promise<CostContext> {
    const [skus, tariffs, coefficients] = await this.prisma.$transaction([
      this.prisma.sku.findMany({
        where: { partnerId },
        include: { operations: { include: { operation: true } } },
      }),
      this.prisma.partnerTariff.findMany({ where: { partnerId } }),
      this.prisma.tariffCoefficient.findMany(),
    ]);

    const tariffByOp = new Map(
      tariffs.map((t) => [t.operationId, Number(t.tariff)]),
    );

    const byArticle = new Map<string, { skuId: number; unitCost: number }>();
    for (const sku of skus) {
      let unitCost = 0;
      const sum = sku.sumOfSides != null ? Number(sku.sumOfSides) : undefined;

      for (const so of sku.operations) {
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

        const qty = parseQty(so.value);
        unitCost += base * multiplier * qty;
      }

      byArticle.set(normalizeArticle(sku.article), {
        skuId: sku.id,
        unitCost: round2(unitCost),
      });
    }

    return { byArticle };
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
