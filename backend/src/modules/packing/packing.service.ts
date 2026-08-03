import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddPackingUnitItemDto,
  BindParentPalletDto,
  CreatePackingUnitDto,
  UpdatePackingUnitDto,
} from './dto/packing.dto';

const packingUnitInclude = { items: true, boxes: true } as const;

function generateCode(type: string): string {
  const prefix = type === 'PALLET' ? 'PAL' : 'BOX';
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

@Injectable()
export class PackingService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRequest(requestId: number) {
    return this.prisma.packingUnit.findMany({
      where: { item: { requestId } },
      include: packingUnitInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePackingUnitDto, createdBy = 'tsd') {
    const item = await this.prisma.requestItem.findUnique({
      where: { id: dto.requestItemId },
    });
    if (!item) {
      throw new NotFoundException(`Позиция #${dto.requestItemId} не найдена`);
    }

    return this.prisma.packingUnit.create({
      data: {
        requestItemId: dto.requestItemId,
        type: dto.type,
        code: dto.code?.trim() || generateCode(dto.type),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        nestingQty: dto.nestingQty ?? null,
        createdBy,
      },
      include: packingUnitInclude,
    });
  }

  async addItem(packingUnitId: number, dto: AddPackingUnitItemDto) {
    const unit = await this.prisma.packingUnit.findUnique({
      where: { id: packingUnitId },
      include: packingUnitInclude,
    });
    if (!unit) throw new NotFoundException(`Упаковочная единица #${packingUnitId} не найдена`);

    // Микс-короб (несколько разных артикулов в одном коробе) разрешён только
    // если это позволяет справочник SKU — проверяем и уже добавленный артикул,
    // и добавляемый.
    if (unit.type === 'BOX') {
      const existingArticles = new Set(unit.items.map((i) => i.article));
      if (existingArticles.size > 0 && !existingArticles.has(dto.article)) {
        const [existingItem, newItem] = await Promise.all([
          this.prisma.requestItem.findUnique({
            where: { id: unit.items[0].requestItemId },
            include: { sku: true },
          }),
          this.prisma.requestItem.findUnique({
            where: { id: dto.requestItemId },
            include: { sku: true },
          }),
        ]);
        const allowed = existingItem?.sku?.allowMixedBox && newItem?.sku?.allowMixedBox;
        if (!allowed) {
          throw new ConflictException(
            `Короб «${unit.code}» уже содержит артикул «${unit.items[0].article}» — микс разных артикулов в одном коробе не разрешён справочником SKU`,
          );
        }
      }
    }

    await this.prisma.packingUnitItem.create({
      data: {
        packingUnitId,
        requestItemId: dto.requestItemId,
        article: dto.article,
        quantity: dto.quantity,
        isDefect: dto.isDefect ?? false,
        comment: dto.comment ?? null,
      },
    });

    return this.prisma.packingUnit.findUnique({
      where: { id: packingUnitId },
      include: packingUnitInclude,
    });
  }

  async update(id: number, dto: UpdatePackingUnitDto) {
    const unit = await this.prisma.packingUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException(`Упаковочная единица #${id} не найдена`);

    return this.prisma.packingUnit.update({
      where: { id },
      data: {
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        nestingQty: dto.nestingQty ?? undefined,
        status: dto.status ?? undefined,
        completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: packingUnitInclude,
    });
  }

  async bindToParentPallet(id: number, dto: BindParentPalletDto) {
    const [box, pallet] = await Promise.all([
      this.prisma.packingUnit.findUnique({ where: { id } }),
      this.prisma.packingUnit.findUnique({ where: { id: dto.parentPalletId } }),
    ]);
    if (!box) throw new NotFoundException(`Короб #${id} не найден`);
    if (!pallet) throw new NotFoundException(`Паллета #${dto.parentPalletId} не найдена`);
    if (pallet.type !== 'PALLET') {
      throw new ConflictException(`Единица #${dto.parentPalletId} не является паллетой`);
    }

    return this.prisma.packingUnit.update({
      where: { id },
      data: { parentPalletId: dto.parentPalletId },
      include: packingUnitInclude,
    });
  }
}
