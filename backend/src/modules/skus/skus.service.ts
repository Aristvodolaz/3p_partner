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
import { QuerySkuDto } from './dto/query-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

export const UPLOADS_DIR = join(__dirname, '..', '..', '..', 'uploads', 'skus');
const MAX_PHOTOS = 3;

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
    await this.prisma.sku.delete({ where: { id } });
    this.deletePhotoFiles(photos.map((p) => p.filename));
    return { deleted: true };
  }

  async removeAllByPartner(partnerId: number) {
    const photos = await this.prisma.skuPhoto.findMany({
      where: { sku: { partnerId } },
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
