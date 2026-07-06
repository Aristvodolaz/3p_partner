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
import { IsInt, IsOptional, IsString } from 'class-validator';
import {
  CreateRequestDto,
  UpdateRequestDto,
} from './dto/create-request.dto';
import { RequestsService } from './requests.service';

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
