import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentNumberingService } from '../../common/document-numbering/document-numbering.service';
import { OutgoingDeliveriesService } from '../outgoing-deliveries/outgoing-deliveries.service';
import {
  CreateIncomingDeliveryDto,
  IncomingDeliveryItemDto,
  ReceiveIncomingDeliveryDto,
  UpdateIncomingDeliveryDto,
} from './dto/create-incoming-delivery.dto';

const include = {
  partner: { select: { id: true, name: true } },
  items: { include: { sku: { select: { id: true, article: true, name: true } } } },
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
    await this.findOne(id);
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

    await this.prisma.$transaction(
      dto.items.map((line) =>
        this.prisma.incomingDeliveryItem.update({
          where: { id: line.itemId },
          data: { factQuantity: line.factQuantity },
        }),
      ),
    );

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

  private async buildSkuIndex(partnerId: number) {
    const skus = await this.prisma.sku.findMany({ where: { partnerId } });
    return new Map(skus.map((s) => [normalizeArticle(s.article), s]));
  }

  private buildItem(
    item: IncomingDeliveryItemDto,
    skuByArticle: Map<string, { id: number; name: string }>,
  ): Prisma.IncomingDeliveryItemCreateWithoutDeliveryInput {
    const sku = skuByArticle.get(normalizeArticle(item.article));
    return {
      article: item.article,
      name: item.name ?? sku?.name ?? null,
      barcode: item.barcode ?? null,
      quantity: item.quantity,
      weight: item.weight ?? null,
      volume: item.volume ?? null,
      sku: sku ? { connect: { id: sku.id } } : undefined,
    };
  }

  /** Тот же приём диффа по id, что и в requests.service.ts — не удаляет/пересоздаёт то, что не менялось. */
  private async replaceItems(
    deliveryId: number,
    existing: { id: number; article: string }[],
    incoming: IncomingDeliveryItemDto[],
    skuByArticle: Map<string, { id: number; name: string }>,
  ) {
    const incomingIds = new Set(incoming.filter((i) => i.id != null).map((i) => i.id));
    const toRemove = existing.filter((item) => !incomingIds.has(item.id));

    await this.prisma.$transaction([
      ...toRemove.map((item) => this.prisma.incomingDeliveryItem.delete({ where: { id: item.id } })),
      ...incoming
        .filter((item): item is IncomingDeliveryItemDto & { id: number } => item.id != null)
        .map((item) =>
          this.prisma.incomingDeliveryItem.update({
            where: { id: item.id },
            data: this.buildItem(item, skuByArticle),
          }),
        ),
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
