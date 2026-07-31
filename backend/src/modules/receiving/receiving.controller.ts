import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceivingService } from './receiving.service';

class CreateReceiptDocumentDto {
  @ApiPropertyOptional({ enum: ['MX1', 'TORG2'] })
  @IsIn(['MX1', 'TORG2'])
  type: 'MX1' | 'TORG2';
}

@ApiTags('Приёмка товара')
@Controller('receiving')
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Get()
  @ApiOperation({ summary: 'Приёмки по заявке' })
  findByRequest(@Query('requestId', ParseIntPipe) requestId: number) {
    return this.receivingService.findByRequest(requestId);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Сводка по позициям заявки: заявлено/принято/осталось принять',
  })
  getSummary(@Query('requestId', ParseIntPipe) requestId: number) {
    return this.receivingService.getSummary(requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Приёмка с позициями' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receivingService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Приёмка товара (паллетная/коробочная/поштучная), частичная — при расхождении факта с заявкой',
  })
  create(@Body() dto: CreateReceiptDto) {
    return this.receivingService.create(dto);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Сформировать МХ-1 или ТОРГ-2 по приёмке' })
  createDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReceiptDocumentDto,
  ) {
    return this.receivingService.createDocument(id, dto.type);
  }
}
