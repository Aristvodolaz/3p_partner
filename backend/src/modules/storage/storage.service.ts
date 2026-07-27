import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { advanceStatus } from '../../common/request-status';
import { MoveItemDto, PlaceItemDto, RemoveItemDto } from './dto/storage.dto';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  async place(dto: PlaceItemDto, createdBy = 'tsd') {
    await this.prisma.storageMovement.create({
      data: {
        partnerId: dto.partnerId,
        article: dto.article,
        address: dto.address,
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
    const available = await this.balanceAtAddress(
      dto.partnerId,
      dto.article,
      dto.address,
    );
    if (available < dto.quantity) {
      throw new ConflictException(
        `На адресе «${dto.address}» доступно только ${available} шт. артикула «${dto.article}»`,
      );
    }

    await this.prisma.storageMovement.create({
      data: {
        partnerId: dto.partnerId,
        article: dto.article,
        address: dto.address,
        quantity: -dto.quantity,
        type: 'REMOVE',
        comment: dto.comment ?? null,
        createdBy,
      },
    });

    return this.balanceForArticle(dto.partnerId, dto.article);
  }

  async move(dto: MoveItemDto, createdBy = 'tsd') {
    const available = await this.balanceAtAddress(
      dto.partnerId,
      dto.article,
      dto.fromAddress,
    );
    if (available < dto.quantity) {
      throw new ConflictException(
        `На адресе «${dto.fromAddress}» доступно только ${available} шт. артикула «${dto.article}»`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.storageMovement.create({
        data: {
          partnerId: dto.partnerId,
          article: dto.article,
          address: dto.fromAddress,
          quantity: -dto.quantity,
          type: 'MOVE_OUT',
          comment: dto.comment ?? null,
          createdBy,
        },
      }),
      this.prisma.storageMovement.create({
        data: {
          partnerId: dto.partnerId,
          article: dto.article,
          address: dto.toAddress,
          quantity: dto.quantity,
          type: 'MOVE_IN',
          comment: dto.comment ?? null,
          createdBy,
        },
      }),
    ]);

    return this.balanceForArticle(dto.partnerId, dto.article);
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

  private async balanceAtAddress(
    partnerId: number,
    article: string,
    address: string,
  ): Promise<number> {
    const result = await this.prisma.storageMovement.aggregate({
      where: { partnerId, article, address },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
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
