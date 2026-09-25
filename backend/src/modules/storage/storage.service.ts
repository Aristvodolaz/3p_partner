import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { advanceStatus } from '../../common/request-status';
import { WarehouseZonesService } from '../warehouse-zones/warehouse-zones.service';
import { MoveItemDto, PlaceItemDto, RemoveItemDto } from './dto/storage.dto';

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zones: WarehouseZonesService,
  ) {}

  async place(dto: PlaceItemDto, createdBy = 'tsd') {
    const address = await this.zones.resolveAddressByCode(dto.address);

    await this.prisma.storageMovement.create({
      data: {
        partnerId: dto.partnerId,
        article: dto.article,
        address: address.code,
        addressId: address.id,
        zoneType: address.zone.type,
        quantity: dto.quantity,
        type: 'PLACE',
        requestItemId: dto.requestItemId ?? null,
        comment: dto.comment ?? null,
        createdBy,
      },
    });

    if (dto.requestItemId) {
      await this.advanceRequestStatusByItem(dto.requestItemId, 'Хранение');
    }

    return this.balanceForArticle(dto.partnerId, dto.article);
  }

  async remove(dto: RemoveItemDto, createdBy = 'tsd') {
    const address = await this.zones.resolveAddressByCode(dto.address);
    const batches = await this.fifoBatchesAtAddress(dto.partnerId, dto.article, address.code);
    const available = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (available < dto.quantity) {
      throw new ConflictException(
        `На адресе «${dto.address}» доступно только ${available} шт. артикула «${dto.article}»`,
      );
    }

    const parts = this.splitFifo(batches, dto.quantity);
    await this.prisma.$transaction(
      parts.map((part) =>
        this.prisma.storageMovement.create({
          data: {
            partnerId: dto.partnerId,
            article: dto.article,
            address: address.code,
            addressId: address.id,
            zoneType: address.zone.type,
            quantity: -part.quantity,
            type: 'REMOVE',
            incomingDeliveryItemId: part.incomingDeliveryItemId,
            comment: dto.comment ?? null,
            createdBy,
          },
        }),
      ),
    );

    return this.balanceForArticle(dto.partnerId, dto.article);
  }

  async move(dto: MoveItemDto, createdBy = 'tsd') {
    const [fromAddress, toAddress] = await Promise.all([
      this.zones.resolveAddressByCode(dto.fromAddress),
      this.zones.resolveAddressByCode(dto.toAddress),
    ]);
    const batches = await this.fifoBatchesAtAddress(dto.partnerId, dto.article, fromAddress.code);
    const available = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (available < dto.quantity) {
      throw new ConflictException(
        `На адресе «${dto.fromAddress}» доступно только ${available} шт. артикула «${dto.article}»`,
      );
    }

    // Партии переносятся вместе с товаром (FIFO) — иначе после первого же
    // перемещения теряется связь "остаток -> партия поступления", а отчёт по
    // остаткам и FIFO-подбор задания на перемещение начинают давать неверные
    // числа (партия PLACE и обезличенный MOVE_IN считались бы раздельно).
    const parts = this.splitFifo(batches, dto.quantity);
    const movements = parts.flatMap((part) => [
      this.prisma.storageMovement.create({
        data: {
          partnerId: dto.partnerId,
          article: dto.article,
          address: fromAddress.code,
          addressId: fromAddress.id,
          zoneType: fromAddress.zone.type,
          quantity: -part.quantity,
          type: 'MOVE_OUT' as const,
          incomingDeliveryItemId: part.incomingDeliveryItemId,
          comment: dto.comment ?? null,
          createdBy,
        },
      }),
      this.prisma.storageMovement.create({
        data: {
          partnerId: dto.partnerId,
          article: dto.article,
          address: toAddress.code,
          addressId: toAddress.id,
          zoneType: toAddress.zone.type,
          quantity: part.quantity,
          type: 'MOVE_IN' as const,
          incomingDeliveryItemId: part.incomingDeliveryItemId,
          receivedAt: part.receivedAt,
          comment: dto.comment ?? null,
          createdBy,
        },
      }),
    ]);
    await this.prisma.$transaction(movements);

    return this.balanceForArticle(dto.partnerId, dto.article);
  }

  /** Остатки на конкретном адресе, сгруппированные по партии (FIFO-порядок). */
  private async fifoBatchesAtAddress(partnerId: number, article: string, address: string) {
    const rows = await this.prisma.storageMovement.groupBy({
      by: ['incomingDeliveryItemId'],
      where: { partnerId, article, address },
      _sum: { quantity: true },
      _min: { receivedAt: true },
    });
    return rows
      .map((r) => ({
        incomingDeliveryItemId: r.incomingDeliveryItemId,
        quantity: r._sum.quantity ?? 0,
        receivedAt: r._min.receivedAt,
      }))
      .filter((r) => r.quantity > 0)
      .sort((a, b) => (a.receivedAt?.getTime() ?? 0) - (b.receivedAt?.getTime() ?? 0));
  }

  /** Жадно разбивает нужное количество по партиям в FIFO-порядке (старые — первыми). */
  private splitFifo<T extends { quantity: number }>(batches: T[], quantity: number): T[] {
    const parts: T[] = [];
    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, batch.quantity);
      if (take <= 0) continue;
      parts.push({ ...batch, quantity: take });
      remaining -= take;
    }
    return parts;
  }

  /** Остатки по артикулу — сгруппировано по адресам */
  async balanceForArticle(partnerId: number, article: string) {
    const rows = await this.prisma.storageMovement.groupBy({
      by: ['address'],
      where: { partnerId, article },
      _sum: { quantity: true },
    });
    return rows
      .map((r) => ({ address: r.address, quantity: r._sum.quantity ?? 0 }))
      .filter((r) => r.quantity > 0)
      .sort((a, b) => a.address.localeCompare(b.address));
  }

  /** Остатки по адресу — сгруппировано по артикулам */
  async balanceForAddress(address: string, partnerId?: number) {
    const rows = await this.prisma.storageMovement.groupBy({
      by: ['article', 'partnerId'],
      where: { address, partnerId },
      _sum: { quantity: true },
    });
    return rows
      .map((r) => ({
        article: r.article,
        partnerId: r.partnerId,
        quantity: r._sum.quantity ?? 0,
      }))
      .filter((r) => r.quantity > 0)
      .sort((a, b) => a.article.localeCompare(b.article));
  }

  /**
   * Размещение принятой партии ВХП в зону приёмки (I) — используется из
   * incoming-deliveries.service.ts при указании адреса в позиции приёмки.
   * Отдельно от place(), т.к. пишет docType/incomingDeliveryItemId/receivedAt
   * и требует именно зону типа I (иначе это не первичная приёмка).
   */
  async placeIncomingBatch(params: {
    partnerId: number;
    article: string;
    addressCode: string;
    quantity: number;
    incomingDeliveryId: number;
    incomingDeliveryItemId: number;
    createdBy: string;
  }) {
    const address = await this.zones.resolveAddressByCode(params.addressCode);
    if (address.zone.type !== 'I') {
      throw new ConflictException(
        `Адрес «${params.addressCode}» относится к зоне «${address.zone.name}» (тип ${address.zone.type}) — для приёмки нужен адрес зоны приёмки (I)`,
      );
    }
    const receivedAt = new Date();
    await this.prisma.storageMovement.create({
      data: {
        partnerId: params.partnerId,
        article: params.article,
        address: address.code,
        addressId: address.id,
        zoneType: address.zone.type,
        quantity: params.quantity,
        type: 'PLACE',
        docType: 'INCOMING',
        docId: params.incomingDeliveryId,
        incomingDeliveryItemId: params.incomingDeliveryItemId,
        receivedAt,
        createdBy: params.createdBy,
      },
    });
  }

  /**
   * Отчёт по остаткам: партнёр, артикул, партия поступления (№ ВХП), адрес,
   * количество — группировка по (partnerId, article, incomingDeliveryItemId, addressId).
   */
  async report(params: { partnerId?: number; article?: string }) {
    const rows = await this.prisma.storageMovement.groupBy({
      by: ['partnerId', 'article', 'incomingDeliveryItemId', 'addressId'],
      where: {
        partnerId: params.partnerId,
        article: params.article,
        addressId: { not: null },
      },
      _sum: { quantity: true },
    });
    const positive = rows.filter((r) => (r._sum.quantity ?? 0) > 0);
    if (positive.length === 0) return [];

    const partnerIds = [...new Set(positive.map((r) => r.partnerId))];
    const addressIds = [...new Set(positive.map((r) => r.addressId).filter((v): v is number => v != null))];
    const batchIds = [
      ...new Set(positive.map((r) => r.incomingDeliveryItemId).filter((v): v is number => v != null)),
    ];

    const [partners, addresses, batches] = await Promise.all([
      this.prisma.partner.findMany({ where: { id: { in: partnerIds } }, select: { id: true, name: true } }),
      this.prisma.storageAddress.findMany({ where: { id: { in: addressIds } }, include: { zone: true } }),
      this.prisma.incomingDeliveryItem.findMany({
        where: { id: { in: batchIds } },
        include: { delivery: { select: { number: true } } },
      }),
    ]);
    const partnerById = new Map(partners.map((p) => [p.id, p]));
    const addressById = new Map(addresses.map((a) => [a.id, a]));
    const batchById = new Map(batches.map((b) => [b.id, b]));

    return positive
      .map((r) => {
        const address = r.addressId != null ? addressById.get(r.addressId) : undefined;
        const batch = r.incomingDeliveryItemId != null ? batchById.get(r.incomingDeliveryItemId) : undefined;
        return {
          partnerId: r.partnerId,
          partnerName: partnerById.get(r.partnerId)?.name ?? `Партнёр #${r.partnerId}`,
          article: r.article,
          batchNumber: batch?.delivery.number ?? null,
          address: address?.code ?? '—',
          zoneType: address?.zone.type ?? null,
          quantity: r._sum.quantity ?? 0,
        };
      })
      .sort((a, b) => a.partnerName.localeCompare(b.partnerName) || a.article.localeCompare(b.article));
  }

  /** Остаток по (партнёр, артикул) в пределах указанной зоны — для FIFO-подбора и гейта отгрузки. */
  async balanceInZone(partnerId: number, article: string, zoneType: string): Promise<number> {
    const result = await this.prisma.storageMovement.aggregate({
      where: { partnerId, article, zoneType },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  /**
   * Остатки по зоне S, сгруппированные по адресу/партии и отсортированные по
   * дате приёмки (FIFO) — источник для подбора при создании задания на
   * перемещение (см. movement-tasks.service.ts).
   */
  async fifoBatchesInZone(partnerId: number, article: string, zoneType: string) {
    const rows = await this.prisma.storageMovement.groupBy({
      by: ['addressId', 'incomingDeliveryItemId'],
      where: { partnerId, article, zoneType, addressId: { not: null } },
      _sum: { quantity: true },
      _min: { receivedAt: true },
    });
    return rows
      .map((r) => ({
        addressId: r.addressId as number,
        incomingDeliveryItemId: r.incomingDeliveryItemId,
        quantity: r._sum.quantity ?? 0,
        receivedAt: r._min.receivedAt,
      }))
      .filter((r) => r.quantity > 0)
      .sort((a, b) => (a.receivedAt?.getTime() ?? 0) - (b.receivedAt?.getTime() ?? 0));
  }

  /**
   * Списывает количество из зоны по FIFO (в т.ч. через несколько адресов/
   * партий) — используется при отгрузке ИСП, чтобы остаток в зоне W
   * реально уменьшался (иначе повторная отгрузка того же товара не была бы
   * ничем ограничена, а отчёт по остаткам показывал бы уже отгруженное).
   */
  async consumeFromZone(params: {
    partnerId: number;
    article: string;
    zoneType: string;
    quantity: number;
    docType: string;
    docId: number;
    createdBy: string;
  }) {
    const batches = await this.fifoBatchesInZone(params.partnerId, params.article, params.zoneType);
    const available = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (available < params.quantity) {
      throw new ConflictException(
        `В зоне доступно только ${available} шт. артикула «${params.article}», нужно ${params.quantity}`,
      );
    }
    const parts = this.splitFifo(batches, params.quantity);
    const addresses = await this.prisma.storageAddress.findMany({
      where: { id: { in: parts.map((p) => p.addressId) } },
    });
    const addressById = new Map(addresses.map((a) => [a.id, a]));

    await this.prisma.$transaction(
      parts.map((part) =>
        this.prisma.storageMovement.create({
          data: {
            partnerId: params.partnerId,
            article: params.article,
            address: addressById.get(part.addressId)?.code ?? '—',
            addressId: part.addressId,
            zoneType: params.zoneType,
            quantity: -part.quantity,
            type: 'REMOVE',
            docType: params.docType,
            docId: params.docId,
            incomingDeliveryItemId: part.incomingDeliveryItemId,
            createdBy: params.createdBy,
          },
        }),
      ),
    );
  }

  async history(params: { partnerId?: number; article?: string; address?: string }) {
    return this.prisma.storageMovement.findMany({
      where: {
        partnerId: params.partnerId,
        article: params.article,
        address: params.address,
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  private async advanceRequestStatusByItem(requestItemId: number, target: string) {
    const item = await this.prisma.requestItem.findUnique({
      where: { id: requestItemId },
      include: { request: true },
    });
    if (!item) return;
    const nextStatus = advanceStatus(item.request.status, target);
    if (nextStatus !== item.request.status) {
      await this.prisma.partnerRequest.update({
        where: { id: item.requestId },
        data: { status: nextStatus },
      });
    }
  }
}
