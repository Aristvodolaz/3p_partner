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
import { Roles } from '../../common/decorators/roles.decorator';
import { WarehouseZonesService } from './warehouse-zones.service';
import { CreateWarehouseZoneDto, UpdateWarehouseZoneDto } from './dto/warehouse-zone.dto';
import { CreateStorageAddressDto, UpdateStorageAddressDto } from './dto/storage-address.dto';

// Справочник зон/адресов читается и мобильным ТСД (сотрудники любой роли —
// адрес нужен на каждом шаге приёмки/перемещения), а вот управляют им
// (создание/правка/удаление) только НРП из веба — отсюда Roles на методах,
// а не на классе целиком.
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
  @Roles('НРП')
  @ApiOperation({ summary: 'Создать зону' })
  createZone(@Body() dto: CreateWarehouseZoneDto) {
    return this.service.createZone(dto);
  }

  @Patch(':id')
  @Roles('НРП')
  @ApiOperation({ summary: 'Редактировать зону' })
  updateZone(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWarehouseZoneDto) {
    return this.service.updateZone(id, dto);
  }

  @Delete(':id')
  @Roles('НРП')
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
  @Roles('НРП')
  @ApiOperation({ summary: 'Создать адрес' })
  createAddress(@Body() dto: CreateStorageAddressDto) {
    return this.service.createAddress(dto);
  }

  @Patch('addresses/:id')
  @Roles('НРП')
  @ApiOperation({ summary: 'Редактировать адрес' })
  updateAddress(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStorageAddressDto) {
    return this.service.updateAddress(id, dto);
  }

  @Delete('addresses/:id')
  @Roles('НРП')
  @ApiOperation({ summary: 'Удалить адрес (если по нему ещё не было движений)' })
  removeAddress(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeAddress(id);
  }
}
