import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';
import { MovementTasksService } from './movement-tasks.service';
import { ConfirmMovementTaskItemDto } from './dto/confirm-movement-task-item.dto';

@ApiTags('Задания на перемещение (FIFO)')
@Controller('movement-tasks')
export class MovementTasksController {
  constructor(private readonly service: MovementTasksService) {}

  @Get()
  @ApiOperation({ summary: 'Список заданий на перемещение (используется и ТСД)' })
  findAll(@Query('partnerId') partnerId?: string, @Query('status') status?: string) {
    return this.service.findAll(partnerId ? Number(partnerId) : undefined, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Задание с позициями' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'История статусов задания' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHistory(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Отменить задание вручную' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.service.cancel(id, employee.fullName);
  }

  @Patch(':id/items/:itemId/confirm')
  @ApiOperation({ summary: 'Подтвердить перемещение позиции (сканирование адреса на ТСД)' })
  confirmItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: ConfirmMovementTaskItemDto,
    @CurrentEmployee() employee: CurrentEmployeeInfo,
  ) {
    return this.service.confirmItem(id, itemId, dto, employee.fullName);
  }
}
