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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CreateRequestDto,
  UpdateRequestDto,
} from './dto/create-request.dto';
import { RequestsService } from './requests.service';
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';

class QueryRequestDto {
  @ApiPropertyOptional({ description: 'ID партнёра' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partnerId?: number;

  @ApiPropertyOptional({ description: 'Поиск по номеру, комментарию, артикулу' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Статус' })
  @IsOptional()
  @IsString()
  status?: string;
}

class ExecuteOperationDto {
  @ApiPropertyOptional({ description: 'Операция выполнена' })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({ description: 'Фактическое количество' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  factQty?: number;

  @ApiPropertyOptional({ description: 'Брак' })
  @IsOptional()
  @IsBoolean()
  isDefect?: boolean;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;
}

class UpdateItemFactDto {
  @ApiPropertyOptional({ description: 'Фактическое количество по позиции' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  factQuantity?: number;

  @ApiPropertyOptional({ description: 'Фактический артикул при пересорте' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  actualArticle?: string;
}

@ApiTags('Заявки партнёров')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Список заявок (используется и ТСД)' })
  findAll(@Query() query: QueryRequestDto) {
    return this.requestsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Заявка с позициями и стоимостью' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOne(id);
  }

  @Get(':id/detailed')
  @ApiOperation({
    summary: 'Детализация для ТСД: операции SKU, выполнение, процент готовности',
  })
  findOneDetailed(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOneDetailed(id);
  }

  @Patch('items/:itemId/operations/:operationId')
  @ApiOperation({
    summary: 'Фиксация выполнения операции по позиции (ТСД)',
  })
  executeOperation(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('operationId', ParseIntPipe) operationId: number,
    @Body() dto: ExecuteOperationDto,
    @CurrentEmployee() employee: CurrentEmployeeInfo,
  ) {
    return this.requestsService.executeOperation(itemId, operationId, dto, employee.fullName);
  }

  @Patch('items/:itemId/fact')
  @ApiOperation({ summary: 'Факт. количество и пересорт по позиции (ТСД)' })
  updateItemFact(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateItemFactDto,
  ) {
    return this.requestsService.updateItemFact(itemId, dto);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать заявку (из Excel или вручную), номер присваивается вручную',
  })
  create(@Body() dto: CreateRequestDto) {
    return this.requestsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать заявку (позиции заменяются целиком)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, dto);
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Пересчитать предварительную стоимость обработки' })
  recalculate(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.recalculate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заявку' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.remove(id);
  }
}
