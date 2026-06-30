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
exports.PartnersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PartnersService = class PartnersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, changedBy = 'system') {
        const existing = await this.prisma.partner.findFirst({
            where: { inn: dto.inn, contractNumber: dto.contractNumber },
        });
        if (existing) {
            throw new common_1.ConflictException('Партнёр с таким ИНН и номером договора уже существует');
        }
        const partner = await this.prisma.partner.create({ data: dto });
        await this.prisma.partnerHistory.create({
            data: {
                partnerId: partner.id,
                changedBy,
                fieldName: 'CREATE',
                oldValue: null,
                newValue: JSON.stringify(partner),
            },
        });
        return partner;
    }
    async findAll(query) {
        const where = {};
        if (query.isActive !== undefined) {
            where.isActive = query.isActive;
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search } },
                { inn: { contains: query.search } },
                { contactPerson: { contains: query.search } },
                { contractNumber: { contains: query.search } },
                { email: { contains: query.search } },
            ];
        }
        const [data, total] = await this.prisma.$transaction([
            this.prisma.partner.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.partner.count({ where }),
        ]);
        return { data, total };
    }
    async findOne(id) {
        const partner = await this.prisma.partner.findUnique({ where: { id } });
        if (!partner)
            throw new common_1.NotFoundException(`Партнёр #${id} не найден`);
        return partner;
    }
    async update(id, dto, changedBy = 'system') {
        const partner = await this.findOne(id);
        const historyEntries = [];
        for (const [key, newValue] of Object.entries(dto)) {
            const oldValue = partner[key];
            if (oldValue !== newValue) {
                historyEntries.push({
                    partnerId: id,
                    changedBy,
                    fieldName: key,
                    oldValue: oldValue != null ? String(oldValue) : null,
                    newValue: newValue != null ? String(newValue) : null,
                });
            }
        }
        const updated = await this.prisma.partner.update({
            where: { id },
            data: dto,
        });
        if (historyEntries.length > 0) {
            await this.prisma.partnerHistory.createMany({ data: historyEntries });
        }
        return updated;
    }
    async deactivate(id, changedBy = 'system') {
        const partner = await this.findOne(id);
        if (!partner.isActive) {
            throw new common_1.ConflictException('Партнёр уже деактивирован');
        }
        const updated = await this.prisma.partner.update({
            where: { id },
            data: { isActive: false },
        });
        await this.prisma.partnerHistory.create({
            data: {
                partnerId: id,
                changedBy,
                fieldName: 'isActive',
                oldValue: 'true',
                newValue: 'false',
            },
        });
        return updated;
    }
    async activate(id, changedBy = 'system') {
        const partner = await this.findOne(id);
        if (partner.isActive) {
            throw new common_1.ConflictException('Партнёр уже активен');
        }
        const updated = await this.prisma.partner.update({
            where: { id },
            data: { isActive: true },
        });
        await this.prisma.partnerHistory.create({
            data: {
                partnerId: id,
                changedBy,
                fieldName: 'isActive',
                oldValue: 'false',
                newValue: 'true',
            },
        });
        return updated;
    }
    async getHistory(id) {
        await this.findOne(id);
        return this.prisma.partnerHistory.findMany({
            where: { partnerId: id },
            orderBy: { changedAt: 'desc' },
        });
    }
};
exports.PartnersService = PartnersService;
exports.PartnersService = PartnersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartnersService);
//# sourceMappingURL=partners.service.js.map