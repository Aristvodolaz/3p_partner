import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentNumberingService } from '../../common/document-numbering/document-numbering.service';
import { OutgoingDeliveriesService } from '../outgoing-deliveries/outgoing-deliveries.service';
import { StorageService } from '../storage/storage.service';
import {
  ConfirmIncomingDeliveryItemDto,
  CreateIncomingDeliveryDto,
  IncomingDeliveryItemDto,
  ReceiveIncomingDeliveryDto,
  UpdateIncomingDeliveryDto,
} from './dto/create-incoming-delivery.dto';

const include = {
  partner: { select: { id: true, name: true } },
  items: {
    include: {
      sku: { select: { id: true, article: true, name: true } },
      operations: { include: { operation: true } },
    },
  },
} satisfies Prisma.IncomingDeliveryInclude;

function normalizeArticle(s: string): string {
  return s.trim().toLowerCase();
}

@Injectable()
export class IncomingDeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: DocumentNumberingService,
    private readonly outgoingDeliveries: OutgoingDeliveriesService,
    private readonly storage: StorageService,
  ) {}

  async findAll(partnerId?: number, status?: string) {
    const where: Prisma.IncomingDeliveryWhereInput = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.incomingDelivery.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.incomingDelivery.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: number) {
    const delivery = await this.prisma.incomingDelivery.findUnique({ where: { id }, include });
    if (!delivery) throw new NotFoundException(`ВХП #${id} не найдена`);
    return delivery;
  }

  getHistory(id: number) {
    return this.numbering.getHistory('INCOMING', id);
  }

  async create(dto: CreateIncomingDeliveryDto, createdBy: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
    if (!partner) throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);

    const skuByArticle = await this.buildSkuIndex(dto.partnerId);
    const number = await this.numbering.nextNumber('INCOMING');

    const delivery = await this.prisma.incomingDelivery.create({
      data: {
        number,
        partnerId: dto.partnerId,
        warehouseCode: dto.warehouseCode ?? null,
        isCrossDock: dto.isCrossDock ?? false,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null,
        comment: dto.comment ?? null,
        createdBy,
        items: { create: dto.items.map((item) => this.buildItem(item, skuByArticle)) },
      },
      include,
    });

    await this.numbering.logStatus('INCOMING', delivery.id, 'Создана', createdBy);
    return delivery;
  }

  async update(id: number, dto: UpdateIncomingDeliveryDto) {
    const delivery = await this.findOne(id);
    if (delivery.status !== 'Создана') {
      throw new ConflictException(
        'Редактировать можно только заявку в статусе «Создана» — приёмка уже началась',
      );
    }

    const data: Prisma.IncomingDeliveryUpdateInput = {};
    if (dto.warehouseCode !== undefined) data.warehouseCode = dto.warehouseCode;
    if (dto.isCrossDock !== undefined) data.isCrossDock = dto.isCrossDock;
    if (dto.plannedDate !== undefined) {
      data.plannedDate = dto.plannedDate ? new Date(dto.plannedDate) : null;
    }
    if (dto.comment !== undefined) data.comment = dto.comment;

    if (dto.items !== undefined) {
      const skuByArticle = await this.buildSkuIndex(delivery.partnerId);
      await this.replaceItems(id, delivery.items, dto.items, skuByArticle);
    }

    return this.prisma.incomingDelivery.update({ where: { id }, data, include });
  }

  async remove(id: number) {
    const delivery = await this.findOne(id);
    if (delivery.status !== 'Создана') {
      throw new ConflictException(
        'Удалить можно только заявку в статусе «Создана» — приёмка уже началась, а связанные с ней остатки на складе потеряют привязку к партии',
      );
    }
    await this.prisma.incomingDelivery.delete({ where: { id } });
    return { deleted: true };
  }

  async cancel(id: number, changedBy: string) {
    const delivery = await this.findOne(id);
    if (delivery.status === 'Выполнено' || delivery.status === 'Отмена') {
      throw new ConflictException(`Заявку в статусе «${delivery.status}» нельзя отменить`);
    }
    const updated = await this.prisma.incomingDelivery.update({
      where: { id },
      data: { status: 'Отмена' },
      include,
    });
    await this.numbering.logStatus('INCOMING', id, 'Отмена', changedBy);
    return updated;
  }

  /**
   * Приёмка через интерфейс (не ТСД): фиксация факта по позициям и
   * исполнителя. Первое обращение переводит «Создана» → «Процесс»;
   * когда факт указан по всем позициям — «Процесс» → «Выполнено»,
   * actualDate проставляется автоматически (п.3, п.5-7 ТЗ).
   */
  async receive(id: number, dto: ReceiveIncomingDeliveryDto, executedBy: string) {
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

    // Гейт: если у позиции настроены операции обработки (SKU, phase
    // INCOMING/BOTH), размещать её на складе можно только после того, как
    // они обработаны через PATCH items/:itemId/confirm (см. confirmItem
    // ниже) — factQuantity к этому моменту уже проставлен этим вызовом.
    for (const line of dto.items) {
      if (!line.addressCode) continue;
      const item = delivery.items.find((i) => i.id === line.itemId)!;
      if (item.operations.length > 0 && item.confirmedQuantity < item.quantity) {
        throw new ConflictException(
          `Сначала обработайте операции по позиции «${item.article}» на ТСД (обработано ${item.confirmedQuantity} из ${item.quantity}), потом размещайте на складе`,
        );
      }
    }

    await this.prisma.$transaction(
      dto.items.map((line) =>
        this.prisma.incomingDeliveryItem.update({
          where: { id: line.itemId },
          data: { factQuantity: line.factQuantity },
        }),
      ),
    );

    // Если на позиции указан адрес — сразу размещаем принятое количество в
    // зону приёмки (I); дальнейшее перемещение I→S — через POST /storage/move.
    for (const line of dto.items) {
      if (!line.addressCode || line.factQuantity <= 0) continue;
      const item = delivery.items.find((i) => i.id === line.itemId)!;
      await this.storage.placeIncomingBatch({
        partnerId: delivery.partnerId,
        article: item.article,
        addressCode: line.addressCode,
        quantity: line.factQuantity,
        incomingDeliveryId: delivery.id,
        incomingDeliveryItemId: item.id,
        createdBy: executedBy,
      });
    }

    const wasCreated = delivery.status === 'Создана';
    const refreshed = await this.findOne(id);
    const allReceived = refreshed.items.every((i) => i.factQuantity != null);

    let nextStatus: string | null = null;
    if (allReceived && refreshed.status !== 'Выполнено') {
      nextStatus = 'Выполнено';
    } else if (wasCreated) {
      nextStatus = 'Процесс';
    }

    if (nextStatus) {
      await this.prisma.incomingDelivery.update({
        where: { id },
        data: {
          status: nextStatus,
          actualDate: nextStatus === 'Выполнено' ? new Date() : refreshed.actualDate,
        },
      });
      await this.numbering.logStatus('INCOMING', id, nextStatus, executedBy);

      // Кросс-докинг (п.2.3 ИСП-блока ТЗ): как только приёмка полностью
      // завершена, автоматически создаём ИСП с фактически принятым
      // количеством — товар едет дальше без хранения.
      if (nextStatus === 'Выполнено' && refreshed.isCrossDock) {
        await this.outgoingDeliveries.createFromIncoming(
          {
            ...refreshed,
            items: refreshed.items.map((i) => ({
              article: i.article,
              name: i.name,
              quantity: i.factQuantity ?? i.quantity,
              weight: i.weight,
              volume: i.volume,
            })),
          },
          executedBy,
        );
      }
    }

    return this.findOne(id);
  }

  /**
   * Штучная обработка операций позиции ВХП (зеркало ИСП confirmItem):
   * каждый вызов добавляет quantity к накопленному confirmedQuantity — это
   * шаг обработки ПЕРЕД размещением, не трогает factQuantity/остатки на
   * складе (их проставляет receive()). final=true проверяет, что накоплено
   * не меньше заявленного, иначе просит указать остаток.
   */
  async confirmItem(itemId: number, dto: ConfirmIncomingDeliveryItemDto, confirmedBy: string) {
    const item = await this.prisma.incomingDeliveryItem.findUnique({
      where: { id: itemId },
      include: { delivery: true },
    });
    if (!item) throw new NotFoundException(`Позиция #${itemId} не найдена`);
    if (item.factQuantity != null) {
      throw new ConflictException('Позиция уже принята');
    }
    if (item.delivery.status === 'Выполнено' || item.delivery.status === 'Отмена') {
      throw new ConflictException(`Заявка уже в статусе «${item.delivery.status}»`);
    }

    const totalConfirmed = item.confirmedQuantity + dto.quantity;
    if (dto.final && totalConfirmed < item.quantity) {
      throw new ConflictException(
        `Обработано только ${totalConfirmed} из ${item.quantity} — укажите остаток перед завершением`,
      );
    }

    const { count } = await this.prisma.incomingDeliveryItem.updateMany({
      where: { id: itemId, factQuantity: null },
      data: { confirmedQuantity: totalConfirmed },
    });
    if (count === 0) throw new ConflictException('Позиция уже принята');

    if (item.delivery.status === 'Создана') {
      await this.prisma.incomingDelivery.update({ where: { id: item.deliveryId }, data: { status: 'Процесс' } });
      await this.numbering.logStatus('INCOMING', item.deliveryId, 'Процесс', confirmedBy);
    }

    return this.prisma.incomingDeliveryItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { sku: { select: { id: true, article: true, name: true } }, operations: { include: { operation: true } } },
    });
  }

  private async buildSkuIndex(partnerId: number) {
    const skus = await this.prisma.sku.findMany({
      where: { partnerId },
      include: { operations: { include: { operation: true } } },
    });
    return new Map(skus.map((s) => [normalizeArticle(s.article), s]));
  }

  private buildItem(
    item: IncomingDeliveryItemDto,
    skuByArticle: Map<
      string,
      { id: number; name: string; operations: { operation: { id: number; phase: string }; value: string | null }[] }
    >,
  ): Prisma.IncomingDeliveryItemCreateWithoutDeliveryInput {
    const sku = skuByArticle.get(normalizeArticle(item.article));
    // Дефолтные операции по SKU — обработка перед размещением (зеркало ИСП),
    // только с фазой INCOMING/BOTH; исходящие операции сюда не попадают.
    const defaultOps = (sku?.operations ?? []).filter((so) =>
      ['INCOMING', 'BOTH'].includes(so.operation.phase),
    );
    return {
      article: item.article,
      name: item.name ?? sku?.name ?? null,
      barcode: item.barcode ?? null,
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

  /** Тот же приём диффа по id, что и в requests.service.ts — не удаляет/пересоздаёт то, что не менялось. */
  private async replaceItems(
    deliveryId: number,
    existing: { id: number; article: string }[],
    incoming: IncomingDeliveryItemDto[],
    skuByArticle: Map<
      string,
      { id: number; name: string; operations: { operation: { id: number; phase: string }; value: string | null }[] }
    >,
  ) {
    const incomingIds = new Set(incoming.filter((i) => i.id != null).map((i) => i.id));
    const toRemove = existing.filter((item) => !incomingIds.has(item.id));

    await this.prisma.$transaction([
      ...toRemove.map((item) => this.prisma.incomingDeliveryItem.delete({ where: { id: item.id } })),
      // Обновление существующей позиции не трогает уже созданный состав
      // операций — только article/name/quantity/вес/объём/sku (см. тот же
      // приём в outgoing-deliveries.service.ts replaceItems).
      ...incoming
        .filter((item): item is IncomingDeliveryItemDto & { id: number } => item.id != null)
        .map((item) => {
          const { operations: _ops, ...scalarData } = this.buildItem(item, skuByArticle);
          void _ops;
          return this.prisma.incomingDeliveryItem.update({ where: { id: item.id }, data: scalarData });
        }),
      ...incoming
        .filter((item) => item.id == null)
        .map((item) =>
          this.prisma.incomingDeliveryItem.create({
            data: { ...this.buildItem(item, skuByArticle), delivery: { connect: { id: deliveryId } } },
          }),
        ),
    ]);
  }
}
