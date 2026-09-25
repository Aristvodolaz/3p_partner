import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const ZONE_TYPES = ['I', 'S', 'W', 'O'] as const;

export class CreateWarehouseZoneDto {
  @ApiProperty({ description: 'Код зоны' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Наименование зоны' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ZONE_TYPES, description: 'I — приёмка, S — хранение, W — обработка, O — отгрузка' })
  @IsIn(ZONE_TYPES)
  type: (typeof ZONE_TYPES)[number];

  @ApiPropertyOptional({ description: 'Код склада' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warehouseCode?: string;
}

export class UpdateWarehouseZoneDto extends PartialType(CreateWarehouseZoneDto) {}
