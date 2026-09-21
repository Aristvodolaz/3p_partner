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
import { IncomingDeliveriesService } from './incoming-deliveries.service';
import {
  CreateIncomingDeliveryDto,
  ReceiveIncomingDeliveryDto,
  UpdateIncomingDeliveryDto,
} from './dto/create-incoming-delivery.dto';

@ApiTags('ВХП — входящая поставка')
@Controller('incoming-deliveries')
export class IncomingDeliveriesController {
  constructor(private readonly service: IncomingDeliveriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список ВХП (используется и ТСД)' })
  findAll(@Query('partnerId') partnerId?: string, @Query('status') status?: string) {
    return this.service.findAll(partnerId ? Number(partnerId) : undefined, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ВХП с позициями' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'История статусов ВХП' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHistory(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать ВХП (номер присваивается автоматически)' })
  create(@Body() dto: CreateIncomingDeliveryDto, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.create(dto, employee.fullName);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать ВХП (только в статусе «Создана»)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIncomingDeliveryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить ВХП' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Отменить ВХП вручную' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.cancel(id, employee.fullName);
  }

  @Post(':id/receive')
  @ApiOperation({
    summary: 'Приёмка через интерфейс: факт по позициям, исполнитель фиксируется автоматически',
  })
  receive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceiveIncomingDeliveryDto,
    @CurrentEmployee() employee: CurrentEmployeeInfo,
  ) {
    return this.service.receive(id, dto, employee.fullName);
  }
}
