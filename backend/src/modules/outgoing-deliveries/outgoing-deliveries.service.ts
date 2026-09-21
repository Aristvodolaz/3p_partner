import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentNumberingService } from '../../common/document-numbering/document-numbering.service';
import {
  CreateOutgoingDeliveryDto,
  OutgoingDeliveryItemDto,
  ShipOutgoingDeliveryDto,
  UpdateItemOperationsDto,
  UpdateOutgoingDeliveryDto,
} from './dto/create-outgoing-delivery.dto';
import type { IncomingDelivery } from '@prisma/client';

const include = {
  partner: { select: { id: true, name: true } },
  items: {
    include: {
      sku: { select: { id: true, article: true, name: true } },
      operations: { include: { operation: true } },
    },
  },
} satisfies Prisma.OutgoingDeliveryInclude;

function normalizeArticle(s: string): string {
  return s.trim().toLowerCase();
}
function parseQty(value: string | null | undefined): number {
  if (!value) return 1;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface TariffContext {
  tariffByOp: Map<number, number>;
}

@Injectable()
export class OutgoingDeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: DocumentNumberingService,
  ) {}

  async findAll(partnerId?: number, status?: string) {
    const where: Prisma.OutgoingDeliveryWhereInput = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.outgoingDelivery.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
      this.prisma.outgoingDelivery.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: number) {
    const delivery = await this.prisma.outgoingDelivery.findUnique({ where: { id }, include });
    if (!delivery) throw new NotFoundException(`ИСП #${id} не найдена`);
    return delivery;
  }

  getHistory(id: number) {
    return this.numbering.getHistory('OUTGOING', id);
  }

  async create(dto: CreateOutgoingDeliveryDto, createdBy: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
    if (!partner) throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);

    const skuByArticle = await this.buildSkuIndex(dto.partnerId);
    const number = await this.numbering.nextNumber('OUTGOING');

    const delivery = await this.prisma.outgoingDelivery.create({
      data: {
        number,
        partnerId: dto.partnerId,
        warehouseCode: dto.warehouseCode ?? null,
        isCrossDock: dto.isCrossDock ?? false,
        shipDate: dto.shipDate ? new Date(dto.shipDate) : null,
        comment: dto.comment ?? null,
        createdBy,
        items: {
          create: await Promise.all(
            dto.items.map((item) => this.buildItemWithDefaultOps(item, skuByArticle)),
          ),
        },
      },
      include,
    });

    await this.numbering.logStatus('OUTGOING', delivery.id, 'Создана', createdBy);
    return this.recalculate(delivery.id);
  }

  /** Авто-создание ИСП по ВХП с признаком КД (п.2.3 ТЗ) — те же позиции, без пересортицы. */
  async createFromIncoming(incoming: IncomingDelivery & { items: { article: string; name: string | null; quantity: number; weight: unknown; volume: unknown }[] }, createdBy: string) {
    return this.create(
      {
        partnerId: incoming.partnerId,
        warehouseCode: incoming.warehouseCode ?? undefined,
        isCrossDock: true,
        comment: `Авто-создана из ${incoming.number} (кросс-докинг)`,
        items: incoming.items.map((i) => ({
          article: i.article,
          name: i.name ?? undefined,
          quantity: i.quantity,
          weight: i.weight != null ? Number(i.weight) : undefined,
          volume: i.volume != null ? Number(i.volume) : undefined,
        })),
      },
      createdBy,
    );
  }

  async update(id: number, dto: UpdateOutgoingDeliveryDto) {
    const delivery = await this.findOne(id);
    if (delivery.status !== 'Создана') {
      throw new ConflictException(
        'Редактировать можно только заявку в статусе «Создана» — отгрузка уже началась',
      );
    }

    const data: Prisma.OutgoingDeliveryUpdateInput = {};
    if (dto.warehouseCode !== undefined) data.warehouseCode = dto.warehouseCode;
    if (dto.isCrossDock !== undefined) data.isCrossDock = dto.isCrossDock;
    if (dto.shipDate !== undefined) data.shipDate = dto.shipDate ? new Date(dto.shipDate) : null;
    if (dto.comment !== undefined) data.comment = dto.comment;

    if (dto.items !== undefined) {
      const skuByArticle = await this.buildSkuIndex(delivery.partnerId);
      await this.replaceItems(id, delivery.items, dto.items, skuByArticle);
    }

    await this.prisma.outgoingDelivery.update({ where: { id }, data });
    return this.recalculate(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.outgoingDelivery.delete({ where: { id } });
    return { deleted: true };
  }

  async cancel(id: number, changedBy: string) {
    const delivery = await this.findOne(id);
    if (delivery.status === 'Выполнено' || delivery.status === 'Отмена') {
      throw new ConflictException(`Заявку в статусе «${delivery.status}» нельзя отменить`);
    }
    const updated = await this.prisma.outgoingDelivery.update({
      where: { id },
      data: { status: 'Отмена' },
      include,
    });
    await this.numbering.logStatus('OUTGOING', id, 'Отмена', changedBy);
    return updated;
  }

  /** Переопределение состава операций по позиции (п.8 ИСП-блока ТЗ) + автопересчёт (п.9). */
  async updateItemOperations(itemId: number, dto: UpdateItemOperationsDto) {
    const item = await this.prisma.outgoingDeliveryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Позиция #${itemId} не найдена`);

    const codes = dto.operations.map((o) => o.code);
    const operations = await this.prisma.operation.findMany({ where: { code: { in: codes } } });
    const byCode = new Map(operations.map((o) => [o.code, o]));
    const unknown = codes.filter((c) => !byCode.has(c));
    if (unknown.length) {
      throw new NotFoundException(`Неизвестные операции: ${unknown.join(', ')}`);
    }

    await this.prisma.$transaction([
      this.prisma.outgoingDeliveryItemOperation.deleteMany({ where: { itemId } }),
      this.prisma.outgoingDeliveryItemOperation.createMany({
        data: dto.operations.map((o) => ({
          itemId,
          operationId: byCode.get(o.code)!.id,
          value: o.value?.trim() || '1',
        })),
      }),
    ]);

    const delivery = await this.prisma.outgoingDelivery.findUniqueOrThrow({
      where: { id: item.deliveryId },
    });
    return this.recalculate(delivery.id);
  }

  /**
   * Отгрузка через интерфейс: факт по позициям, исполнитель фиксируется
   * автоматически. Статусная схема — та же, что у ВХП (п.5-7 блока ИСП).
   */
  async ship(id: number, dto: ShipOutgoingDeliveryDto, executedBy: string) {
    const delivery = await this.findOne(id);
    if (delivery.status === 'Выполнено' || delivery.status === 'Отмена') {
      throw new ConflictException(`Заявка уже в статусе «${delivery.status}»`);
    }

    const itemIds = new Set(delivery.items.map((i) => i.id));
    for (const line of dto.items) {
      if (!itemIds.has(line.itemId)) {
        throw new NotFoundException(`Позиция #${line.itemId} не относится к этой заявке`);
      }
    }

    await this.prisma.$transaction(
      dto.items.map((line) =>
        this.prisma.outgoingDeliveryItem.update({
          where: { id: line.itemId },
          data: { factQuantity: line.factQuantity },
        }),
      ),
    );

    const wasCreated = delivery.status === 'Создана';
    const refreshed = await this.findOne(id);
    const allShipped = refreshed.items.every((i) => i.factQuantity != null);

    let nextStatus: string | null = null;
    if (allShipped && refreshed.status !== 'Выполнено') nextStatus = 'Выполнено';
    else if (wasCreated) nextStatus = 'Процесс';

    if (nextStatus) {
      await this.prisma.outgoingDelivery.update({
        where: { id },
        data: {
          status: nextStatus,
          actualDate: nextStatus === 'Выполнено' ? new Date() : refreshed.actualDate,
        },
      });
      await this.numbering.logStatus('OUTGOING', id, nextStatus, executedBy);
    }

    return this.findOne(id);
  }

  /** Пересчёт unitCost/totalCost по текущим тарифам партнёра и составу операций каждой позиции. */
  async recalculate(id: number) {
    const delivery = await this.findOne(id);
    const ctx = await this.buildTariffContext(delivery.partnerId);

    for (const item of delivery.items) {
      // Коэффициент К по ШДВ (как в acts.service.ts) для позиций ИСП — фаст-фоллоу,
      // MVP считает по базовому тарифу без него.
      const unitCost = item.operations.reduce((sum, io) => {
        const base =
          ctx.tariffByOp.get(io.operationId) ??
          (io.operation.tariff != null ? Number(io.operation.tariff) : 0);
        return sum + round2(base * parseQty(io.value));
      }, 0);
      await this.prisma.outgoingDeliveryItem.update({
        where: { id: item.id },
        data: { unitCost, totalCost: round2(unitCost * item.quantity) },
      });
    }

    return this.findOne(id);
  }

  private async buildTariffContext(partnerId: number): Promise<TariffContext> {
    const tariffs = await this.prisma.partnerTariff.findMany({ where: { partnerId } });
    return { tariffByOp: new Map(tariffs.map((t) => [t.operationId, Number(t.tariff)])) };
  }

  private async buildSkuIndex(partnerId: number) {
    const skus = await this.prisma.sku.findMany({
      where: { partnerId },
      include: { operations: { include: { operation: true } } },
    });
    return new Map(skus.map((s) => [normalizeArticle(s.article), s]));
  }

  private async buildItemWithDefaultOps(
    item: OutgoingDeliveryItemDto,
    skuByArticle: Map<
      string,
      { id: number; name: string; operations: { operation: { id: number; phase: string }; value: string | null }[] }
    >,
  ): Promise<Prisma.OutgoingDeliveryItemCreateWithoutDeliveryInput> {
    const sku = skuByArticle.get(normalizeArticle(item.article));
    // Дефолтные операции по SKU (п.7 ИСП-блока ТЗ) — только с фазой OUTGOING/BOTH,
    // приёмочные операции ВХП сюда не попадают (см. Operation.phase).
    const defaultOps = (sku?.operations ?? []).filter((so) =>
      ['OUTGOING', 'BOTH'].includes(so.operation.phase),
    );
    return {
      article: item.article,
      name: item.name ?? sku?.name ?? null,
      quantity: item.quantity,
      weight: item.weight ?? null,
      volume: item.volume ?? null,
      sku: sku ? { connect: { id: sku.id } } : undefined,
      operations: defaultOps.length
        ? {
            create: defaultOps.map((so) => ({
              operationId: so.operation.id,
              value: so.value ?? '1',
            })),
          }
        : undefined,
    };
  }

  private async replaceItems(
    deliveryId: number,
    existing: { id: number; article: string }[],
    incoming: OutgoingDeliveryItemDto[],
    skuByArticle: Map<
      string,
      { id: number; name: string; operations: { operation: { id: number; phase: string }; value: string | null }[] }
    >,
  ) {
    const incomingIds = new Set(incoming.filter((i) => i.id != null).map((i) => i.id));
    const toRemove = existing.filter((item) => !incomingIds.has(item.id));

    for (const item of toRemove) {
      await this.prisma.outgoingDeliveryItemOperation.deleteMany({ where: { itemId: item.id } });
      await this.prisma.outgoingDeliveryItem.delete({ where: { id: item.id } });
    }

    for (const item of incoming.filter((i) => i.id != null)) {
      const data = await this.buildItemWithDefaultOps(item, skuByArticle);
      // Обновление существующей позиции не трогает уже переопределённый состав
      // операций — только article/name/quantity/вес/объём/sku.
      const { operations: _ops, ...scalarData } = data;
      void _ops;
      await this.prisma.outgoingDeliveryItem.update({ where: { id: item.id as number }, data: scalarData });
    }

    for (const item of incoming.filter((i) => i.id == null)) {
      const data = await this.buildItemWithDefaultOps(item, skuByArticle);
      await this.prisma.outgoingDeliveryItem.create({
        data: { ...data, delivery: { connect: { id: deliveryId } } },
      });
    }
  }
}
