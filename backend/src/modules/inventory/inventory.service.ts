import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentNumberingService } from '../../common/document-numbering/document-numbering.service';
import { CountInventoryTaskDto, CreateInventoryTaskDto } from './dto/create-inventory-task.dto';

const include = {
  partner: { select: { id: true, name: true } },
  items: { include: { sku: { select: { id: true, article: true, name: true } } } },
  executors: true,
} satisfies Prisma.InventoryTaskInclude;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: DocumentNumberingService,
  ) {}

  async findAll(partnerId?: number, status?: string) {
    const where: Prisma.InventoryTaskWhereInput = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryTask.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
      this.prisma.inventoryTask.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: number) {
    const task = await this.prisma.inventoryTask.findUnique({ where: { id }, include });
    if (!task) throw new NotFoundException(`Инвентаризация #${id} не найдена`);
    return task;
  }

  getHistory(id: number) {
    return this.numbering.getHistory('INVENTORY', id);
  }

  /**
   * Снимок остатков (StorageMovement, тот же источник, что и /storage) на
   * момент создания задания — по артикулу и месту хранения, как того требует
   * формат ИНВ-5. source=PARTNER — остатки только этого партнёра; INTERNAL —
   * по всему складу (partnerId не фильтруется), см. п.2-3 ТЗ.
   */
  async create(dto: CreateInventoryTaskDto, createdBy: string) {
    if (dto.source === 'PARTNER' && !dto.partnerId) {
      throw new BadRequestException('Для инвентаризации по инициативе партнёра укажите partnerId');
    }
    if (dto.partnerId) {
      const partner = await this.prisma.partner.findUnique({ where: { id: dto.partnerId } });
      if (!partner) throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);
    }

    const where: Prisma.StorageMovementWhereInput = {};
    if (dto.partnerId) where.partnerId = dto.partnerId;
    if (dto.articles?.length) where.article = { in: dto.articles };

    const grouped = await this.prisma.storageMovement.groupBy({
      by: ['article', 'address', 'partnerId'],
      where,
      _sum: { quantity: true },
    });
    const balances = grouped
      .map((g) => ({ article: g.article, address: g.address, partnerId: g.partnerId, qty: g._sum.quantity ?? 0 }))
      .filter((b) => b.qty > 0);

    if (!balances.length) {
      throw new BadRequestException('По заданным условиям нет остатков на складе для инвентаризации');
    }

    const skuByArticle = await this.buildSkuIndex(dto.partnerId);
    const number = await this.numbering.nextNumber('INVENTORY');

    const task = await this.prisma.inventoryTask.create({
      data: {
        number,
        partnerId: dto.partnerId ?? null,
        source: dto.source,
        createdBy,
        items: {
          create: balances.map((b) => {
            const sku = skuByArticle.get(normalizeArticle(b.article));
            return {
              article: b.article,
              name: sku?.name ?? null,
              address: b.address,
              expectedQty: b.qty,
              skuId: sku?.id,
            };
          }),
        },
        executors: dto.executorEmployeeIds?.length
          ? { create: dto.executorEmployeeIds.map((employeeId) => ({ employeeId })) }
          : undefined,
      },
      include,
    });

    await this.numbering.logStatus('INVENTORY', task.id, 'Создана', createdBy);
    return task;
  }

  async addExecutor(id: number, employeeId: string) {
    await this.findOne(id);
    await this.prisma.inventoryTaskExecutor.upsert({
      where: { taskId_employeeId: { taskId: id, employeeId } },
      update: {},
      create: { taskId: id, employeeId },
    });
    return this.findOne(id);
  }

  async removeExecutor(id: number, employeeId: string) {
    await this.prisma.inventoryTaskExecutor.deleteMany({ where: { taskId: id, employeeId } });
    return this.findOne(id);
  }

  async cancel(id: number, changedBy: string) {
    const task = await this.findOne(id);
    if (task.status === 'Выполнено' || task.status === 'Отмена') {
      throw new ConflictException(`Задание в статусе «${task.status}» нельзя отменить`);
    }
    const updated = await this.prisma.inventoryTask.update({
      where: { id },
      data: { status: 'Отмена' },
      include,
    });
    await this.numbering.logStatus('INVENTORY', id, 'Отмена', changedBy);
    return updated;
  }

  /**
   * Пересчёт через ТСД или интерфейс: несколько исполнителей могут считать
   * одно задание параллельно (п.9 ТЗ) — каждый присылает факт по своим
   * позициям. Первый присланный факт переводит «Создана» → «Процесс»; когда
   * факт указан по всем позициям — «Процесс» → «Выполнено».
   */
  async count(id: number, dto: CountInventoryTaskDto, countedBy: string) {
    const task = await this.findOne(id);
    if (task.status === 'Выполнено' || task.status === 'Отмена') {
      throw new ConflictException(`Задание уже в статусе «${task.status}»`);
    }

    const itemIds = new Set(task.items.map((i) => i.id));
    for (const line of dto.items) {
      if (!itemIds.has(line.itemId)) {
        throw new NotFoundException(`Позиция #${line.itemId} не относится к этому заданию`);
      }
    }

    const itemsById = new Map(task.items.map((i) => [i.id, i]));

    await this.prisma.$transaction(
      dto.items.map((line) =>
        this.prisma.inventoryTaskItem.update({
          where: { id: line.itemId },
          data: { countedQty: line.countedQty, countedBy, countedAt: new Date() },
        }),
      ),
    );

    // Расхождение по факту пересчёта — корректирующее движение по остаткам
    // (п.12 ТЗ по остаткам: история перемещений включает инвентаризацию).
    // Для внутренней инвентаризации (partnerId=null) остатки не ведём —
    // движение по остаткам всегда в разрезе конкретного партнёра.
    if (task.partnerId) {
      const adjustments = dto.items
        .map((line) => {
          const item = itemsById.get(line.itemId)!;
          const diff = line.countedQty - item.expectedQty;
          return { item, diff, countedQty: line.countedQty };
        })
        .filter(({ diff }) => diff !== 0);

      if (adjustments.length > 0) {
        await this.prisma.$transaction(
          adjustments.map(({ item, diff, countedQty }) =>
            this.prisma.storageMovement.create({
              data: {
                partnerId: task.partnerId!,
                article: item.article,
                address: item.address ?? '—',
                quantity: diff,
                type: 'ADJUST',
                docType: 'INVENTORY',
                docId: task.id,
                comment: `Инвентаризация ${task.number}: учёт ${item.expectedQty}, факт ${countedQty}`,
                createdBy: countedBy,
              },
            }),
          ),
        );
      }
    }

    const wasCreated = task.status === 'Создана';
    const refreshed = await this.findOne(id);
    const allCounted = refreshed.items.every((i) => i.countedQty != null);

    let nextStatus: string | null = null;
    if (allCounted) nextStatus = 'Выполнено';
    else if (wasCreated) nextStatus = 'Процесс';

    if (nextStatus) {
      await this.prisma.inventoryTask.update({ where: { id }, data: { status: nextStatus } });
      await this.numbering.logStatus('INVENTORY', id, nextStatus, countedBy);
    }

    return this.findOne(id);
  }

  private async buildSkuIndex(partnerId?: number) {
    const skus = partnerId ? await this.prisma.sku.findMany({ where: { partnerId } }) : [];
    return new Map(skus.map((s) => [normalizeArticle(s.article), s]));
  }
}

function normalizeArticle(s: string): string {
  return s.trim().toLowerCase();
}
