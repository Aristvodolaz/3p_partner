import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export const SHIPMENT_METHODS = ['SELF', 'PARTNER'] as const;

export class ShipmentItemDto {
  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  article: string;

  @ApiPropertyOptional({ description: 'Наименование' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateShipmentDto {
  @ApiProperty({ description: 'ID заявки' })
  @Type(() => Number)
  @IsInt()
  requestId: number;

  @ApiProperty({
    enum: SHIPMENT_METHODS,
    description: 'SELF — собственными силами (ЗТУ), PARTNER — силами партнёра',
  })
  @IsIn(SHIPMENT_METHODS)
  method: (typeof SHIPMENT_METHODS)[number];

  @ApiPropertyOptional({ description: 'Данные автомобиля' })
  @IsOptional()
  @IsString()
  vehicleInfo?: string;

  @ApiPropertyOptional({ description: 'Водитель' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ description: 'Плановая дата отгрузки' })
  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ type: [ShipmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items: ShipmentItemDto[];
}
