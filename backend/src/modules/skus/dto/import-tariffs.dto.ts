import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ImportTariffItemDto {
  @ApiProperty({ description: 'Наименование операции' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Единица измерения' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit?: string;

  @ApiProperty({ description: 'Тариф, руб. с НДС' })
  @Type(() => Number)
  @IsNumber()
  tariff: number;

  @ApiPropertyOptional({ description: 'Описание операции' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ImportTariffsDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiPropertyOptional({
    description: 'true — тарифы партнёра удаляются и загружаются заново',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  @ApiProperty({ type: [ImportTariffItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTariffItemDto)
  items: ImportTariffItemDto[];
}

export class UpdateOperationDto {
  @ApiPropertyOptional({ description: 'Описание операции' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Единица измерения' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit?: string;
}
