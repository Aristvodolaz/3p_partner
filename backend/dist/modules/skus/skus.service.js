"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkusService = exports.UPLOADS_DIR = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.UPLOADS_DIR = (0, path_1.join)(__dirname, '..', '..', '..', 'uploads', 'skus');
const MAX_PHOTOS = 3;
const skuInclude = {
    operations: { include: { operation: true } },
    photos: true,
};
let SkusService = class SkusService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getOperations() {
        return this.prisma.operation.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    async findAll(query) {
        const where = {};
        if (query.partnerId)
            where.partnerId = query.partnerId;
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
    async findOne(id) {
        const sku = await this.prisma.sku.findUnique({
            where: { id },
            include: skuInclude,
        });
        if (!sku)
            throw new common_1.NotFoundException(`SKU #${id} не найден`);
        return sku;
    }
    async create(dto) {
        const partner = await this.prisma.partner.findUnique({
            where: { id: dto.partnerId },
        });
        if (!partner) {
            throw new common_1.NotFoundException(`Партнёр #${dto.partnerId} не найден`);
        }
        const existing = await this.prisma.sku.findUnique({
            where: {
                partnerId_article: { partnerId: dto.partnerId, article: dto.article },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Артикул «${dto.article}» уже есть у этого партнёра`);
        }
        const { operations, ...data } = dto;
        const operationsCreate = await this.buildOperationsCreate(operations);
        const sku = await this.prisma.sku.create({
            data: { ...data, operations: operationsCreate },
            include: skuInclude,
        });
        return sku;
    }
    async update(id, dto) {
        const sku = await this.findOne(id);
        if (dto.article && dto.article !== sku.article) {
            const dup = await this.prisma.sku.findUnique({
                where: {
                    partnerId_article: { partnerId: sku.partnerId, article: dto.article },
                },
            });
            if (dup) {
                throw new common_1.ConflictException(`Артикул «${dto.article}» уже есть у этого партнёра`);
            }
        }
        const { operations, ...data } = dto;
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
    async remove(id) {
        await this.findOne(id);
        const photos = await this.prisma.skuPhoto.findMany({ where: { skuId: id } });
        await this.prisma.sku.delete({ where: { id } });
        this.deletePhotoFiles(photos.map((p) => p.filename));
        return { deleted: true };
    }
    async removeAllByPartner(partnerId) {
        const photos = await this.prisma.skuPhoto.findMany({
            where: { sku: { partnerId } },
        });
        const { count } = await this.prisma.sku.deleteMany({ where: { partnerId } });
        this.deletePhotoFiles(photos.map((p) => p.filename));
        return { deleted: count };
    }
    async import(dto) {
        const partner = await this.prisma.partner.findUnique({
            where: { id: dto.partnerId },
        });
        if (!partner) {
            throw new common_1.NotFoundException(`Партнёр #${dto.partnerId} не найден`);
        }
        if (!dto.rows.length) {
            throw new common_1.BadRequestException('Файл не содержит строк для импорта');
        }
        const seen = new Set();
        for (const row of dto.rows) {
            if (seen.has(row.article)) {
                throw new common_1.BadRequestException(`Артикул «${row.article}» встречается в файле несколько раз`);
            }
            seen.add(row.article);
        }
        const opsByCode = new Map((await this.getOperations()).map((op) => [op.code, op.id]));
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
                operationId: opsByCode.get(op.code),
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
            }
            else {
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
    async addPhoto(id, filename) {
        const sku = await this.findOne(id);
        if (sku.photos.length >= MAX_PHOTOS) {
            this.deletePhotoFiles([filename]);
            throw new common_1.ConflictException(`Максимум ${MAX_PHOTOS} фото на SKU`);
        }
        return this.prisma.skuPhoto.create({ data: { skuId: id, filename } });
    }
    async removePhoto(id, photoId) {
        const photo = await this.prisma.skuPhoto.findFirst({
            where: { id: photoId, skuId: id },
        });
        if (!photo)
            throw new common_1.NotFoundException(`Фото #${photoId} не найдено`);
        await this.prisma.skuPhoto.delete({ where: { id: photoId } });
        this.deletePhotoFiles([photo.filename]);
        return { deleted: true };
    }
    async buildOperationsCreate(operations) {
        if (!operations?.length) {
            return operations === undefined
                ? undefined
                : { create: [] };
        }
        const opsByCode = new Map((await this.getOperations()).map((op) => [op.code, op.id]));
        const unknown = operations.filter((op) => !opsByCode.has(op.code));
        if (unknown.length) {
            throw new common_1.BadRequestException(`Неизвестные операции: ${unknown.map((o) => o.code).join(', ')}`);
        }
        return {
            create: operations.map((op) => ({
                operationId: opsByCode.get(op.code),
                value: op.value ?? null,
            })),
        };
    }
    deletePhotoFiles(filenames) {
        for (const filename of filenames) {
            const filePath = (0, path_1.join)(exports.UPLOADS_DIR, filename);
            try {
                if ((0, fs_1.existsSync)(filePath))
                    (0, fs_1.unlinkSync)(filePath);
            }
            catch {
            }
        }
    }
};
exports.SkusService = SkusService;
exports.SkusService = SkusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkusService);
//# sourceMappingURL=skus.service.js.map