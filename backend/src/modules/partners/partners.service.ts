import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { QueryPartnerDto } from './dto/query-partner.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartnerDto, changedBy = 'system') {
    const existing = await this.prisma.partner.findFirst({
      where: { inn: dto.inn, contractNumber: dto.contractNumber },
    });
    if (existing) {
      throw new ConflictException(
        'Партнёр с таким ИНН и номером договора уже существует',
      );
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

  async findAll(query: QueryPartnerDto) {
    const where: Prisma.PartnerWhereInput = {};

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

  async findOne(id: number) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException(`Партнёр #${id} не найден`);
    return partner;
  }

  async update(id: number, dto: UpdatePartnerDto, changedBy = 'system') {
    const partner = await this.findOne(id);

    const historyEntries: Prisma.PartnerHistoryCreateManyInput[] = [];
    for (const [key, newValue] of Object.entries(dto)) {
      const oldValue = (partner as any)[key];
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

  async deactivate(id: number, changedBy = 'system') {
    const partner = await this.findOne(id);
    if (!partner.isActive) {
      throw new ConflictException('Партнёр уже деактивирован');
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

  async activate(id: number, changedBy = 'system') {
    const partner = await this.findOne(id);
    if (partner.isActive) {
      throw new ConflictException('Партнёр уже активен');
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

  async getHistory(id: number) {
    await this.findOne(id);
    return this.prisma.partnerHistory.findMany({
      where: { partnerId: id },
      orderBy: { changedAt: 'desc' },
    });
  }
}
