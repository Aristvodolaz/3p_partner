import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import {
  AddExecutorDto,
  CountInventoryTaskDto,
  CreateInventoryTaskDto,
} from './dto/create-inventory-task.dto';

@ApiTags('Инвентаризация')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Список заданий на инвентаризацию (используется и ТСД)' })
  findAll(@Query('partnerId') partnerId?: string, @Query('status') status?: string) {
    return this.service.findAll(partnerId ? Number(partnerId) : undefined, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Задание с позициями и исполнителями' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'История статусов задания' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHistory(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Создать задание: по выбранным артикулам или всем остаткам склада (партнёра либо всего склада)',
  })
  create(@Body() dto: CreateInventoryTaskDto, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.create(dto, employee.fullName);
  }

  @Post(':id/executors')
  @ApiOperation({ summary: 'Назначить исполнителя (задание могут выполнять несколько сотрудников)' })
  addExecutor(@Param('id', ParseIntPipe) id: number, @Body() dto: AddExecutorDto) {
    return this.service.addExecutor(id, dto.employeeId);
  }

  @Delete(':id/executors/:employeeId')
  @ApiOperation({ summary: 'Снять исполнителя с задания' })
  removeExecutor(@Param('id', ParseIntPipe) id: number, @Param('employeeId') employeeId: string) {
    return this.service.removeExecutor(id, employeeId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Отменить задание вручную' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.cancel(id, employee.fullName);
  }

  @Post(':id/count')
  @ApiOperation({
    summary: 'Пересчёт: факт по позициям, исполнитель фиксируется автоматически',
  })
  count(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CountInventoryTaskDto,
    @CurrentEmployee() employee: CurrentEmployeeInfo,
  ) {
    return this.service.count(id, dto, employee.fullName);
  }
}
