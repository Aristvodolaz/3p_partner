import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { advanceStatus } from '../../common/request-status';
import {
  CreateRequestDto,
  RequestItemDto,
  UpdateRequestDto,
} from './dto/create-request.dto';

const requestInclude = {
  partner: { select: { id: true, name: true } },
  items: { include: { sku: { select: { id: true, article: true, name: true } } } },
} satisfies Prisma.PartnerRequestInclude;

const requestDetailInclude = {
  partner: { select: { id: true, name: true } },
  items: {
    include: {
      sku: {
        select: {
          id: true,
          article: true,
          name: true,
          sumOfSides: true,
          specialMarks: true,
          allowMixedBox: true,
          operations: { include: { operation: true } },
        },
      },
      executions: { include: { operation: true } },
    },
  },
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

  /** Заявка с операциями SKU и их выполнением (для ТСД и детализации) */
  async findOneDetailed(id: number) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id },
      include: requestDetailInclude,
    });
    if (!request) throw new NotFoundException(`Заявка #${id} не найдена`);

    // Процент готовности: выполненные операции / все операции позиций
    let totalOps = 0;
    let doneOps = 0;
    for (const item of request.items) {
      const ops = item.sku?.operations.length ?? 0;
      totalOps += ops;
      const doneSet = new Set(
        item.executions.filter((e) => e.done).map((e) => e.operationId),
      );
      doneOps += item.sku
        ? item.sku.operations.filter((so) => doneSet.has(so.operationId)).length
        : 0;
    }
    const progress = totalOps > 0 ? Math.round((doneOps / totalOps) * 100) : 0;

    return { ...request, progress, totalOps, doneOps };
  }

  /**
   * Фиксация выполнения операции по позиции (ТСД).
   * Ограничение: операция должна входить в справочник SKU этой позиции.
   */
  async executeOperation(
    itemId: number,
    operationId: number,
    data: {
      done?: boolean;
      factQty?: number | null;
      isDefect?: boolean;
      comment?: string | null;
    },
    executedBy = 'tsd',
  ) {
    const item = await this.prisma.requestItem.findUnique({
      where: { id: itemId },
      include: { sku: { include: { operations: true } } },
    });
    if (!item) throw new NotFoundException(`Позиция #${itemId} не найдена`);
    if (!item.sku) {
      throw new ConflictException(
        `Артикул «${item.article}» не найден в справочнике SKU — операции недоступны`,
      );
    }
    const allowed = item.sku.operations.some(
      (so) => so.operationId === operationId,
    );
    if (!allowed) {
      throw new ConflictException(
        'Операция не входит в утверждённый список операций этого SKU',
      );
    }

    const execData = {
      done: data.done ?? undefined,
      factQty: data.factQty === undefined ? undefined : data.factQty,
      isDefect: data.isDefect ?? undefined,
      comment: data.comment === undefined ? undefined : data.comment,
      executedBy,
      executedAt: new Date(),
    };

    const execution = await this.prisma.itemOperationExecution.upsert({
      where: {
        requestItemId_operationId: { requestItemId: itemId, operationId },
      },
      update: execData,
      create: {
        requestItemId: itemId,
        operationId,
        done: data.done ?? false,
        factQty: data.factQty ?? null,
        isDefect: data.isDefect ?? false,
        comment: data.comment ?? null,
        executedBy,
        executedAt: new Date(),
      },
      include: { operation: true },
    });

    await this.advanceStatusAfterExecution(item.requestId);

    return execution;
  }

  /**
   * Как только по заявке отмечена хотя бы одна операция — статус двигается
   * в «В работе»; когда все операции по всем позициям выполнены — в «Готово».
   */
  private async advanceStatusAfterExecution(requestId: number) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return;

    const { progress } = await this.findOneDetailed(requestId);
    const target = progress >= 100 ? 'Готово' : 'В работе';
    const nextStatus = advanceStatus(request.status, target);
    if (nextStatus !== request.status) {
      await this.prisma.partnerRequest.update({
        where: { id: requestId },
        data: { status: nextStatus },
      });
    }
  }

  /** Факт. количество и пересорт на уровне позиции */
  async updateItemFact(
    itemId: number,
    data: { factQuantity?: number | null; actualArticle?: string | null },
  ) {
    const item = await this.prisma.requestItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException(`Позиция #${itemId} не найдена`);
    return this.prisma.requestItem.update({
      where: { id: itemId },
      data: {
        factQuantity:
          data.factQuantity === undefined ? undefined : data.factQuantity,
        actualArticle:
          data.actualArticle === undefined ? undefined : data.actualArticle,
      },
    });
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

    if (dto.items !== undefined) {
      await this.replaceItems(id, partnerId, request.items, dto.items);
    }

    return this.prisma.partnerRequest.update({
      where: { id },
      data,
      include: requestInclude,
    });
  }

  /**
   * Позиции сопоставляются по id, а не удаляются-и-пересоздаются целиком:
   * у позиции может уже быть история приёмки/размещения (ReceiptItem,
   * PackingUnitItem — там FK на requestItemId стоит NoAction, не Cascade),
   * и слепой deleteMany+create ронял запрос 500-й из-за нарушения FK,
   * плюс терял историю выполнения операций (ItemOperationExecution) даже
   * для позиций, которые пользователь не менял.
   */
  private async replaceItems(
    requestId: number,
    partnerId: number,
    existing: { id: number; article: string }[],
    incoming: RequestItemDto[],
  ) {
    const ctx = await this.buildCostContext(partnerId);
    const incomingIds = new Set(incoming.filter((i) => i.id != null).map((i) => i.id));
    const toRemove = existing.filter((item) => !incomingIds.has(item.id));

    for (const item of toRemove) {
      const [receipts, packingRefs] = await Promise.all([
        this.prisma.receiptItem.count({ where: { requestItemId: item.id } }),
        this.prisma.packingUnitItem.count({ where: { requestItemId: item.id } }),
      ]);
      if (receipts > 0 || packingRefs > 0) {
        throw new ConflictException(
          `Нельзя убрать позицию «${item.article}» — по ней уже есть история приёмки или упаковки`,
        );
      }
    }

    await this.prisma.$transaction([
      ...toRemove.map((item) =>
        this.prisma.requestItem.delete({ where: { id: item.id } }),
      ),
      ...incoming
        .filter((item): item is RequestItemDto & { id: number } => item.id != null)
        .map((item) =>
          this.prisma.requestItem.update({
            where: { id: item.id },
            data: this.buildItem(item, ctx),
          }),
        ),
      ...incoming
        .filter((item) => item.id == null)
        .map((item) =>
          this.prisma.requestItem.create({
            data: {
              ...this.buildItem(item, ctx),
              request: { connect: { id: requestId } },
            },
          }),
        ),
    ]);
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
