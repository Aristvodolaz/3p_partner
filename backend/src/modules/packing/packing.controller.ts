import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackingService } from './packing.service';
import {
  AddPackingUnitItemDto,
  BindParentPalletDto,
  CreatePackingUnitDto,
  UpdatePackingUnitDto,
} from './dto/packing.dto';
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';

@ApiTags('Обработка: паллеты и короба')
@Controller('packing')
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @Get('units')
  @ApiOperation({ summary: 'Паллеты и короба по заявке' })
  findByRequest(@Query('requestId', ParseIntPipe) requestId: number) {
    return this.packingService.findByRequest(requestId);
  }

  @Post('units')
  @ApiOperation({ summary: 'Создать короб или паллету для позиции заявки' })
  create(@Body() dto: CreatePackingUnitDto, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.packingService.create(dto, employee.fullName);
  }

  @Post('units/:id/items')
  @ApiOperation({
    summary: 'Добавить артикул в короб/паллету (микс-короб — только если разрешено в SKU)',
  })
  addItem(@Param('id', ParseIntPipe) id: number, @Body() dto: AddPackingUnitItemDto) {
    return this.packingService.addItem(id, dto);
  }

  @Patch('units/:id')
  @ApiOperation({ summary: 'Обновить срок годности/вложенность или завершить упаковку' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePackingUnitDto) {
    return this.packingService.update(id, dto);
  }

  @Patch('units/:id/bind-parent')
  @ApiOperation({ summary: 'Привязать короб к паллете (ШК ВПС)' })
  bindParent(@Param('id', ParseIntPipe) id: number, @Body() dto: BindParentPalletDto) {
    return this.packingService.bindToParentPallet(id, dto);
  }
}
