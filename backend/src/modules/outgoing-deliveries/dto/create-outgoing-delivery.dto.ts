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

export class OutgoingDeliveryItemDto {
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

export class CreateOutgoingDeliveryDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiPropertyOptional({ description: 'Код склада отгрузки' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warehouseCode?: string;

  @ApiPropertyOptional({ description: 'Кросс-докинг' })
  @IsOptional()
  @IsBoolean()
  isCrossDock?: boolean;

  @ApiPropertyOptional({ description: 'Дата отгрузки' })
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ type: [OutgoingDeliveryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutgoingDeliveryItemDto)
  items: OutgoingDeliveryItemDto[];
}

export class UpdateOutgoingDeliveryDto extends PartialType(CreateOutgoingDeliveryDto) {}

export class ShipOutgoingDeliveryItemDto {
  @ApiProperty({ description: 'ID позиции ИСП' })
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @ApiProperty({ description: 'Фактически отгруженное количество' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  factQuantity: number;
}

export class ShipOutgoingDeliveryDto {
  @ApiProperty({ type: [ShipOutgoingDeliveryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipOutgoingDeliveryItemDto)
  items: ShipOutgoingDeliveryItemDto[];
}

export class ItemOperationDto {
  @ApiProperty({ description: 'Код операции из справочника' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Значение (количество), по умолчанию 1' })
  @IsOptional()
  @IsString()
  value?: string;
}

export class UpdateItemOperationsDto {
  @ApiProperty({ type: [ItemOperationDto], description: 'Полный новый состав операций по позиции' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOperationDto)
  operations: ItemOperationDto[];
}
