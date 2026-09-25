import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseZoneDto, UpdateWarehouseZoneDto } from './dto/warehouse-zone.dto';
import { CreateStorageAddressDto, UpdateStorageAddressDto } from './dto/storage-address.dto';

@Injectable()
export class WarehouseZonesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Зоны ---

  findAllZones() {
    return this.prisma.warehouseZone.findMany({ orderBy: { code: 'asc' } });
  }

  async createZone(dto: CreateWarehouseZoneDto) {
    return this.prisma.warehouseZone.create({ data: dto });
  }

  async updateZone(id: number, dto: UpdateWarehouseZoneDto) {
    await this.findZoneOrThrow(id);
    return this.prisma.warehouseZone.update({ where: { id }, data: dto });
  }

  async removeZone(id: number) {
    await this.findZoneOrThrow(id);
    const addressesCount = await this.prisma.storageAddress.count({ where: { zoneId: id } });
    if (addressesCount > 0) {
      throw new ConflictException(
        `У зоны есть привязанные адреса (${addressesCount}) — сначала удалите или перенесите их`,
      );
    }
    await this.prisma.warehouseZone.delete({ where: { id } });
    return { deleted: true };
  }

  private async findZoneOrThrow(id: number) {
    const zone = await this.prisma.warehouseZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException(`Зона #${id} не найдена`);
    return zone;
  }

  // --- Адреса ---

  findAllAddresses(params: { zoneType?: string; search?: string }) {
    return this.prisma.storageAddress.findMany({
      where: {
        zone: params.zoneType ? { type: params.zoneType } : undefined,
        code: params.search ? { contains: params.search } : undefined,
      },
      include: { zone: true },
      orderBy: { code: 'asc' },
    });
  }

  async createAddress(dto: CreateStorageAddressDto) {
    await this.findZoneOrThrow(dto.zoneId);
    return this.prisma.storageAddress.create({ data: dto, include: { zone: true } });
  }

  async updateAddress(id: number, dto: UpdateStorageAddressDto) {
    await this.findAddressOrThrow(id);
    if (dto.zoneId) await this.findZoneOrThrow(dto.zoneId);
    return this.prisma.storageAddress.update({ where: { id }, data: dto, include: { zone: true } });
  }

  async removeAddress(id: number) {
    await this.findAddressOrThrow(id);
    const movementsCount = await this.prisma.storageMovement.count({ where: { addressId: id } });
    if (movementsCount > 0) {
      throw new ConflictException(
        'По этому адресу уже есть движения — деактивируйте адрес вместо удаления',
      );
    }
    await this.prisma.storageAddress.delete({ where: { id } });
    return { deleted: true };
  }

  private async findAddressOrThrow(id: number) {
    const address = await this.prisma.storageAddress.findUnique({ where: { id } });
    if (!address) throw new NotFoundException(`Адрес #${id} не найден`);
    return address;
  }

  /** Резолв кода адреса → сущность с зоной; кидает, если адрес неизвестен или неактивен. */
  async resolveAddressByCode(code: string) {
    const address = await this.prisma.storageAddress.findUnique({
      where: { code },
      include: { zone: true },
    });
    if (!address) throw new NotFoundException(`Адрес «${code}» не найден в справочнике`);
    if (!address.isActive) throw new ConflictException(`Адрес «${code}» деактивирован`);
    return address;
  }
}
