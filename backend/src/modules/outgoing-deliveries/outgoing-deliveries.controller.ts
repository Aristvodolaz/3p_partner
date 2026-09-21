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
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';
import { OutgoingDeliveriesService } from './outgoing-deliveries.service';
import {
  CreateOutgoingDeliveryDto,
  ShipOutgoingDeliveryDto,
  UpdateItemOperationsDto,
  UpdateOutgoingDeliveryDto,
} from './dto/create-outgoing-delivery.dto';

@ApiTags('ИСП — исходящая поставка')
@Controller('outgoing-deliveries')
export class OutgoingDeliveriesController {
  constructor(private readonly service: OutgoingDeliveriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список ИСП (используется и ТСД)' })
  findAll(@Query('partnerId') partnerId?: string, @Query('status') status?: string) {
    return this.service.findAll(partnerId ? Number(partnerId) : undefined, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ИСП с позициями и их операциями' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'История статусов ИСП' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHistory(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать ИСП (номер автоматом; позиции получают дефолтные операции из справочника SKU)',
  })
  create(@Body() dto: CreateOutgoingDeliveryDto, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.create(dto, employee.fullName);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать ИСП (только в статусе «Создана»)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOutgoingDeliveryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить ИСП' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Отменить ИСП вручную' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.cancel(id, employee.fullName);
  }

  @Patch('items/:itemId/operations')
  @ApiOperation({
    summary: 'Переопределить состав операций позиции (относительно дефолта из SKU) — с автопересчётом',
  })
  updateItemOperations(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateItemOperationsDto,
  ) {
    return this.service.updateItemOperations(itemId, dto);
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Пересчитать стоимость по текущим тарифам' })
  recalculate(@Param('id', ParseIntPipe) id: number) {
    return this.service.recalculate(id);
  }

  @Post(':id/ship')
  @ApiOperation({
    summary: 'Отгрузка через интерфейс: факт по позициям, исполнитель фиксируется автоматически',
  })
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ShipOutgoingDeliveryDto,
    @CurrentEmployee() employee: CurrentEmployeeInfo,
  ) {
    return this.service.ship(id, dto, employee.fullName);
  }
}
