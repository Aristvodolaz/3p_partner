import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentNumberingService } from '../../common/document-numbering/document-numbering.service';
import { StorageService } from '../storage/storage.service';
import { WarehouseZonesService } from '../warehouse-zones/warehouse-zones.service';
import { ConfirmMovementTaskItemDto } from './dto/confirm-movement-task-item.dto';

const include = {
  items: true,
} satisfies Prisma.MovementTaskInclude;

interface OutgoingItemForTask {
  id: number;
  article: string;
  name: string | null;
  skuId: number | null;
  quantity: number;
}

@Injectable()
export class MovementTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: DocumentNumberingService,
    private readonly storage: StorageService,
    private readonly zones: WarehouseZonesService,
  ) {}

  async findAll(partnerId?: number, status?: string) {
    const where: Prisma.MovementTaskWhereInput = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.movementTask.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
      this.prisma.movementTask.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: number) {
    const task = await this.prisma.movementTask.findUnique({ where: { id }, include });
    if (!task) throw new NotFoundException(`Задание на перемещение #${id} не найдено`);
    return task;
  }

  getHistory(id: number) {
    return this.numbering.getHistory('MOVEMENT', id);
  }

  /**
   * FIFO-подбор источников из зоны S и создание задания на перемещение S→W
   * при создании ИСП (см. Документ5.docx-по-остаткам п.7-9). Если по товару
   * вообще нет остатка в зоне S ни у одной позиции — задание не создаётся
   * (нечего перемещать), ship() потом заблокируется отдельным гейтом.
   */
  async createForOutgoing(
    outgoingDeliveryId: number,
    partnerId: number,
    items: OutgoingItemForTask[],
    createdBy: string,
  ) {
    const taskItemsData: Prisma.MovementTaskItemCreateManyTaskInput[] = [];

    for (const item of items) {
      let remaining = item.quantity;
      if (remaining <= 0) continue;

      const batches = await this.storage.fifoBatchesInZone(partnerId, item.article, 'S');
      for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, batch.quantity);
        if (take <= 0) continue;
        taskItemsData.push({
          article: item.article,
          name: item.name,
          skuId: item.skuId,
          outgoingDeliveryItemId: item.id,
          sourceAddressId: batch.addressId,
          incomingDeliveryItemId: batch.incomingDeliveryItemId,
          quantity: take,
        });
        remaining -= take;
      }
    }

    if (taskItemsData.length === 0) return null;

    const number = await this.numbering.nextNumber('MOVEMENT');
    const task = await this.prisma.movementTask.create({
      data: {
        number,
        outgoingDeliveryId,
        partnerId,
        createdBy,
        items: { createMany: { data: taskItemsData } },
      },
      include,
    });
    await this.numbering.logStatus('MOVEMENT', task.id, 'Создана', createdBy);
    return task;
  }

  /**
   * Подтверждение перемещения одной позиции задания (выполняется на ТСД):
   * пишет MOVE_OUT из адреса-источника (зона S) и MOVE_IN в указанный адрес
   * зоны W одной транзакцией, отмечает позицию выполненной. Когда все
   * позиции задания перемещены — задание переходит в "Выполнено".
   */
  async confirmItem(
    taskId: number,
    itemId: number,
    dto: ConfirmMovementTaskItemDto,
    confirmedBy: string,
  ) {
    const task = await this.findOne(taskId);
    if (task.status === 'Выполнено' || task.status === 'Отмена') {
      throw new ConflictException(`Задание уже в статусе «${task.status}»`);
    }
    const item = task.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException(`Позиция #${itemId} не относится к этому заданию`);
    if (item.status === 'Перемещено') {
      throw new ConflictException('Позиция уже перемещена');
    }
    if (!item.sourceAddressId) {
      throw new ConflictException('У позиции не определён адрес-источник');
    }

    const [sourceAddress, targetAddress] = await Promise.all([
      this.prisma.storageAddress.findUniqueOrThrow({
        where: { id: item.sourceAddressId },
        include: { zone: true },
      }),
      this.zones.resolveAddressByCode(dto.targetAddressCode),
    ]);
    if (targetAddress.zone.type !== 'W') {
      throw new ConflictException(
        `Адрес «${dto.targetAddressCode}» относится к зоне «${targetAddress.zone.name}» (тип ${targetAddress.zone.type}) — для перемещения в обработку нужен адрес зоны W`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.storageMovement.create({
        data: {
          partnerId: task.partnerId,
          article: item.article,
          address: sourceAddress.code,
          addressId: sourceAddress.id,
          zoneType: sourceAddress.zone.type,
          quantity: -item.quantity,
          type: 'MOVE_OUT',
          docType: 'MOVEMENT_TASK',
          docId: task.id,
          incomingDeliveryItemId: item.incomingDeliveryItemId,
          createdBy: confirmedBy,
        },
      }),
      this.prisma.storageMovement.create({
        data: {
          partnerId: task.partnerId,
          article: item.article,
          address: targetAddress.code,
          addressId: targetAddress.id,
          zoneType: targetAddress.zone.type,
          quantity: item.quantity,
          type: 'MOVE_IN',
          docType: 'MOVEMENT_TASK',
          docId: task.id,
          incomingDeliveryItemId: item.incomingDeliveryItemId,
          createdBy: confirmedBy,
        },
      }),
      this.prisma.movementTaskItem.update({
        where: { id: item.id },
        data: {
          status: 'Перемещено',
          targetAddressId: targetAddress.id,
          confirmedBy,
          confirmedAt: new Date(),
        },
      }),
    ]);

    const wasCreated = task.status === 'Создана';
    const refreshed = await this.findOne(taskId);
    const allMoved = refreshed.items.every((i) => i.status === 'Перемещено');

    let nextStatus: string | null = null;
    if (allMoved) nextStatus = 'Выполнено';
    else if (wasCreated) nextStatus = 'Процесс';

    if (nextStatus) {
      await this.prisma.movementTask.update({ where: { id: taskId }, data: { status: nextStatus } });
      await this.numbering.logStatus('MOVEMENT', taskId, nextStatus, confirmedBy);
    }

    return this.findOne(taskId);
  }

  async cancel(id: number, changedBy: string) {
    const task = await this.findOne(id);
    if (task.status === 'Выполнено' || task.status === 'Отмена') {
      throw new ConflictException(`Задание в статусе «${task.status}» нельзя отменить`);
    }
    const updated = await this.prisma.movementTask.update({
      where: { id },
      data: { status: 'Отмена' },
      include,
    });
    await this.numbering.logStatus('MOVEMENT', id, 'Отмена', changedBy);
    return updated;
  }
}
