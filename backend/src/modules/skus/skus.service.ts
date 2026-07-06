import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkuDto, SkuOperationDto } from './dto/create-sku.dto';
import { ImportSkusDto } from './dto/import-skus.dto';
import { PartnerTariffItemDto } from './dto/partner-tariffs.dto';
import { QuerySkuDto } from './dto/query-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

export const UPLOADS_DIR = join(__dirname, '..', '..', '..', 'uploads', 'skus');
const MAX_PHOTOS = 3;

/** Нормализация названия операции для сопоставления при импорте */
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
}

const skuInclude = {
  operations: { include: { operation: true } },
  photos: true,
} satisfies Prisma.SkuInclude;

@Injectable()
export class SkusService {
  constructor(private readonly prisma: PrismaService) {}

  getOperations() {
    return this.prisma.operation.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  getCoefficients() {
    return this.prisma.tariffCoefficient.findMany({
      orderBy: { minSum: 'asc' },
    });
  }

  getPartnerTariffs(partnerId: number) {
    return this.prisma.partnerTariff.findMany({
      where: { partnerId },
      include: { operation: true },
      orderBy: { operation: { sortOrder: 'asc' } },
    });
  }

  async setPartnerTariffs(
    partnerId: number,
    tariffs: PartnerTariffItemDto[],
    changedBy = 'system',
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Партнёр #${partnerId} не найден`);
    }

    const opsByCode = new Map(
      (await this.getOperations()).map((op) => [op.code, op.id]),
    );
    const unknown = tariffs.filter((t) => !opsByCode.has(t.code));
    if (unknown.length) {
      throw new BadRequestException(
        `Неизвестные операции: ${unknown.map((t) => t.code).join(', ')}`,
      );
    }

    for (const t of tariffs) {
      const operationId = opsByCode.get(t.code)!;
      await this.upsertTariffWithHistory(partnerId, operationId, t.tariff, changedBy);
    }

    return this.getPartnerTariffs(partnerId);
  }

  /** Upsert тарифа с записью в историю (только при реальном изменении) */
  private async upsertTariffWithHistory(
    partnerId: number,
    operationId: number,
    tariff: number,
    changedBy: string,
  ) {
    const existing = await this.prisma.partnerTariff.findUnique({
      where: { partnerId_operationId: { partnerId, operationId } },
    });
    const oldTariff = existing ? Number(existing.tariff) : null;
    if (oldTariff === tariff) return;

    await this.prisma.partnerTariff.upsert({
      where: { partnerId_operationId: { partnerId, operationId } },
      update: { tariff },
      create: { partnerId, operationId, tariff },
    });
    await this.prisma.tariffHistory.create({
      data: { partnerId, operationId, changedBy, oldTariff, newTariff: tariff },
    });
  }

  /** Импорт тарифов из листа «Операции и описание»: новые операции создаются в каталоге */
  async importTariffs(
    partnerId: number,
    items: { name: string; unit?: string; tariff: number; description?: string }[],
    replace = false,
    changedBy = 'system',
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Партнёр #${partnerId} не найден`);
    }
    if (!items.length) {
      throw new BadRequestException('Файл не содержит тарифов');
    }

    if (replace) {
      await this.deletePartnerTariffs(partnerId, changedBy);
    }

    const ops = await this.getOperations();
    const opsByNorm = new Map(ops.map((op) => [normalizeName(op.name), op]));
    let maxSort = ops.reduce((m, op) => Math.max(m, op.sortOrder), 0);

    let created = 0;
    let updated = 0;

    for (const item of items) {
      const norm = normalizeName(item.name);
      let op = opsByNorm.get(norm);

      if (!op) {
        op = await this.prisma.operation.create({
          data: {
            code: await this.generateOpCode(item.name),
            name: item.name,
            unit: item.unit ?? null,
            description: item.description ?? null,
            sortOrder: ++maxSort,
          },
        });
        opsByNorm.set(norm, op);
        created++;
      } else {
        const data: Prisma.OperationUpdateInput = {};
        if (item.unit && item.unit !== op.unit) data.unit = item.unit;
        if (item.description && item.description !== op.description) {
          data.description = item.description;
        }
        if (Object.keys(data).length) {
          await this.prisma.operation.update({ where: { id: op.id }, data });
        }
        updated++;
      }

      await this.upsertTariffWithHistory(partnerId, op.id, item.tariff, changedBy);
    }

    return { createdOperations: created, updatedOperations: updated, total: items.length };
  }

  /** Полное удаление тарифов партнёра (с историей) */
  async deletePartnerTariffs(partnerId: number, changedBy = 'system') {
    const existing = await this.prisma.partnerTariff.findMany({
      where: { partnerId },
    });
    if (existing.length) {
      await this.prisma.tariffHistory.createMany({
        data: existing.map((t) => ({
          partnerId,
          operationId: t.operationId,
          changedBy,
          oldTariff: t.tariff,
          newTariff: null,
        })),
      });
      await this.prisma.partnerTariff.deleteMany({ where: { partnerId } });
    }
    return { deleted: existing.length };
  }

  getTariffHistory(partnerId: number) {
    return this.prisma.tariffHistory.findMany({
      where: { partnerId },
      include: { operation: true },
      orderBy: { changedAt: 'desc' },
      take: 200,
    });
  }

  async updateOperation(
    id: number,
    data: { description?: string; unit?: string },
  ) {
    const op = await this.prisma.operation.findUnique({ where: { id } });
    if (!op) throw new NotFoundException(`Операция #${id} не найдена`);
    return this.prisma.operation.update({ where: { id }, data });
  }

  private async generateOpCode(name: string) {
    const translit: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
      я: 'ya',
    };
    const slug = name
      .toLowerCase()
      .split('')
      .map((ch) => translit[ch] ?? (/[a-z0-9]/.test(ch) ? ch : '_'))
      .join('')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40);

    let code = slug || 'operation';
    let attempt = 1;
    while (await this.prisma.operation.findUnique({ where: { code } })) {
      code = `${slug.slice(0, 36)}_${++attempt}`;
    }
    return code;
  }

  async findAll(query: QuerySkuDto) {
    const where: Prisma.SkuWhereInput = {};

    if (query.partnerId) where.partnerId = query.partnerId;

    if (query.search) {
      where.OR = [
        { article: { contains: query.search } },
        { barcode: { contains: query.search } },
        { name: { contains: query.search } },
        { color: { contains: query.search } },
        { specialMarks: { contains: query.search } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sku.findMany({
        where,
        include: skuInclude,
        orderBy: [{ partnerId: 'asc' }, { article: 'asc' }],
      }),
      this.prisma.sku.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number) {
    const sku = await this.prisma.sku.findUnique({
      where: { id },
      include: skuInclude,
    });
    if (!sku) throw new NotFoundException(`SKU #${id} не найден`);
    return sku;
  }

  async create(dto: CreateSkuDto) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: dto.partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);
    }

    const existing = await this.prisma.sku.findUnique({
      where: {
        partnerId_article: { partnerId: dto.partnerId, article: dto.article },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Артикул «${dto.article}» уже есть у этого партнёра`,
      );
    }

    const { operations, ...data } = dto;
    const operationsCreate = await this.buildOperationsCreate(operations);

    const sku = await this.prisma.sku.create({
      data: { ...data, operations: operationsCreate },
      include: skuInclude,
    });
    return sku;
  }

  async update(id: number, dto: UpdateSkuDto) {
    const sku = await this.findOne(id);

    if (dto.article && dto.article !== sku.article) {
      const dup = await this.prisma.sku.findUnique({
        where: {
          partnerId_article: { partnerId: sku.partnerId, article: dto.article },
        },
      });
      if (dup) {
        throw new ConflictException(
          `Артикул «${dto.article}» уже есть у этого партнёра`,
        );
      }
    }

    const { operations, ...data } = dto;

    // Операции заменяются целиком, если переданы
    if (operations !== undefined) {
      await this.prisma.skuOperation.deleteMany({ where: { skuId: id } });
    }
    const operationsCreate = await this.buildOperationsCreate(operations);

    return this.prisma.sku.update({
      where: { id },
      data: { ...data, operations: operationsCreate },
      include: skuInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const photos = await this.prisma.skuPhoto.findMany({ where: { skuId: id } });
    // Позиции заявок сохраняются, но теряют связь со справочником
    await this.prisma.requestItem.updateMany({
      where: { skuId: id },
      data: { skuId: null },
    });
    await this.prisma.sku.delete({ where: { id } });
    this.deletePhotoFiles(photos.map((p) => p.filename));
    return { deleted: true };
  }

  async removeAllByPartner(partnerId: number) {
    const photos = await this.prisma.skuPhoto.findMany({
      where: { sku: { partnerId } },
    });
    await this.prisma.requestItem.updateMany({
      where: { sku: { partnerId } },
      data: { skuId: null },
    });
    const { count } = await this.prisma.sku.deleteMany({ where: { partnerId } });
    this.deletePhotoFiles(photos.map((p) => p.filename));
    return { deleted: count };
  }

  async import(dto: ImportSkusDto) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: dto.partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Партнёр #${dto.partnerId} не найден`);
    }
    if (!dto.rows.length) {
      throw new BadRequestException('Файл не содержит строк для импорта');
    }

    // Дубли артикулов внутри файла
    const seen = new Set<string>();
    for (const row of dto.rows) {
      if (seen.has(row.article)) {
        throw new BadRequestException(
          `Артикул «${row.article}» встречается в файле несколько раз`,
        );
      }
      seen.add(row.article);
    }

    const opsByCode = new Map(
      (await this.getOperations()).map((op) => [op.code, op.id]),
    );

    if (dto.replace !== false) {
      await this.removeAllByPartner(dto.partnerId);
    }

    // Тарифы партнёра из строки расценок шаблона
    if (dto.tariffs?.length) {
      await this.setPartnerTariffs(dto.partnerId, dto.tariffs);
    }

    let created = 0;
    let updated = 0;

    for (const row of dto.rows) {
      const { operations, ...data } = row;
      const operationsData = (operations ?? [])
        .filter((op) => opsByCode.has(op.code))
        .map((op) => ({
          operationId: opsByCode.get(op.code)!,
          value: op.value ?? null,
        }));

      const existing = await this.prisma.sku.findUnique({
        where: {
          partnerId_article: {
            partnerId: dto.partnerId,
            article: row.article,
          },
        },
      });

      if (existing) {
        await this.prisma.skuOperation.deleteMany({
          where: { skuId: existing.id },
        });
        await this.prisma.sku.update({
          where: { id: existing.id },
          data: { ...data, operations: { create: operationsData } },
        });
        updated++;
      } else {
        await this.prisma.sku.create({
          data: {
            ...data,
            partnerId: dto.partnerId,
            operations: { create: operationsData },
          },
        });
        created++;
      }
    }

    return { created, updated, total: dto.rows.length };
  }

  async addPhoto(id: number, filename: string) {
    const sku = await this.findOne(id);
    if (sku.photos.length >= MAX_PHOTOS) {
      this.deletePhotoFiles([filename]);
      throw new ConflictException(`Максимум ${MAX_PHOTOS} фото на SKU`);
    }
    return this.prisma.skuPhoto.create({ data: { skuId: id, filename } });
  }

  async removePhoto(id: number, photoId: number) {
    const photo = await this.prisma.skuPhoto.findFirst({
      where: { id: photoId, skuId: id },
    });
    if (!photo) throw new NotFoundException(`Фото #${photoId} не найдено`);
    await this.prisma.skuPhoto.delete({ where: { id: photoId } });
    this.deletePhotoFiles([photo.filename]);
    return { deleted: true };
  }

  private async buildOperationsCreate(operations?: SkuOperationDto[]) {
    if (!operations?.length) {
      return operations === undefined
        ? undefined
        : { create: [] as { operationId: number; value: string | null }[] };
    }
    const opsByCode = new Map(
      (await this.getOperations()).map((op) => [op.code, op.id]),
    );
    const unknown = operations.filter((op) => !opsByCode.has(op.code));
    if (unknown.length) {
      throw new BadRequestException(
        `Неизвестные операции: ${unknown.map((o) => o.code).join(', ')}`,
      );
    }
    return {
      create: operations.map((op) => ({
        operationId: opsByCode.get(op.code)!,
        value: op.value ?? null,
      })),
    };
  }

  private deletePhotoFiles(filenames: string[]) {
    for (const filename of filenames) {
      const filePath = join(UPLOADS_DIR, filename);
      try {
        if (existsSync(filePath)) unlinkSync(filePath);
      } catch {
        // файл мог быть удалён вручную — не критично
      }
    }
  }
}
