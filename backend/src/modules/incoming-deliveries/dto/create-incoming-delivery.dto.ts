import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class IncomingDeliveryItemDto {
  @ApiPropertyOptional({ description: 'ID существующей позиции (при редактировании)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  article: string;

  @ApiPropertyOptional({ description: 'Наименование товара' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @ApiPropertyOptional({ description: 'Штрихкод' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Вес, кг' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Объём, м3' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volume?: number;
}

export class CreateIncomingDeliveryDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiPropertyOptional({ description: 'Код склада получателя' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warehouseCode?: string;

  @ApiPropertyOptional({ description: 'Кросс-докинг' })
  @IsOptional()
  @IsBoolean()
  isCrossDock?: boolean;

  @ApiPropertyOptional({ description: 'Дата план поступления' })
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ type: [IncomingDeliveryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncomingDeliveryItemDto)
  items: IncomingDeliveryItemDto[];
}

export class UpdateIncomingDeliveryDto extends PartialType(CreateIncomingDeliveryDto) {}

export class ReceiveIncomingDeliveryItemDto {
  @ApiProperty({ description: 'ID позиции ВХП' })
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @ApiProperty({ description: 'Фактически принятое количество' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  factQuantity: number;
}

export class ReceiveIncomingDeliveryDto {
  @ApiProperty({ type: [ReceiveIncomingDeliveryItemDto], description: 'Факт по позициям' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveIncomingDeliveryItemDto)
  items: ReceiveIncomingDeliveryItemDto[];
}
