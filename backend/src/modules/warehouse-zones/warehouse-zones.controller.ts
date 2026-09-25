import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WarehouseZonesService } from './warehouse-zones.service';
import { CreateWarehouseZoneDto, UpdateWarehouseZoneDto } from './dto/warehouse-zone.dto';
import { CreateStorageAddressDto, UpdateStorageAddressDto } from './dto/storage-address.dto';

@ApiTags('Склад — зоны и адреса')
@Controller('warehouse-zones')
export class WarehouseZonesController {
  constructor(private readonly service: WarehouseZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Справочник зон склада' })
  findAllZones() {
    return this.service.findAllZones();
  }

  @Post()
  @ApiOperation({ summary: 'Создать зону' })
  createZone(@Body() dto: CreateWarehouseZoneDto) {
    return this.service.createZone(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать зону' })
  updateZone(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWarehouseZoneDto) {
    return this.service.updateZone(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить зону (если у неё нет адресов)' })
  removeZone(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeZone(id);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Справочник адресов хранения' })
  findAllAddresses(@Query('zoneType') zoneType?: string, @Query('search') search?: string) {
    return this.service.findAllAddresses({ zoneType, search });
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Создать адрес' })
  createAddress(@Body() dto: CreateStorageAddressDto) {
    return this.service.createAddress(dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Редактировать адрес' })
  updateAddress(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStorageAddressDto) {
    return this.service.updateAddress(id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Удалить адрес (если по нему ещё не было движений)' })
  removeAddress(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeAddress(id);
  }
}
