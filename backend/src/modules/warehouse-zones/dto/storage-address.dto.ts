import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStorageAddressDto {
  @ApiProperty({ description: 'Код адреса/ячейки' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiProperty({ description: 'ID зоны' })
  @Type(() => Number)
  @IsInt()
  zoneId: number;

  @ApiPropertyOptional({ description: 'Код склада' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warehouseCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStorageAddressDto extends PartialType(CreateStorageAddressDto) {}
