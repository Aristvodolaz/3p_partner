import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShippingService } from './shipping.service';

class CreateShipmentDocumentDto {
  @ApiPropertyOptional({ enum: ['TTN', 'MX3'] })
  @IsIn(['TTN', 'MX3'])
  type: 'TTN' | 'MX3';
}

class MarkShippedDto {
  @ApiProperty({ description: 'Кто отгрузил' })
  @IsString()
  @IsNotEmpty()
  shippedBy: string;
}

@ApiTags('Отгрузка')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  @ApiOperation({ summary: 'Отгрузки по заявке' })
  findByRequest(@Query('requestId', ParseIntPipe) requestId: number) {
    return this.shippingService.findByRequest(requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отгрузка с позициями' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shippingService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать отгрузку (собственными силами или силами партнёра)',
  })
  create(@Body() dto: CreateShipmentDto) {
    return this.shippingService.create(dto);
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: 'Отметить отгрузку выполненной' })
  markShipped(@Param('id', ParseIntPipe) id: number, @Body() dto: MarkShippedDto) {
    return this.shippingService.markShipped(id, dto.shippedBy);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Сформировать ТТН или МХ-3 по отгрузке' })
  createDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateShipmentDocumentDto,
  ) {
    return this.shippingService.createDocument(id, dto.type);
  }
}
