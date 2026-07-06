import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OmitType } from '@nestjs/swagger';
import { CreateSkuDto } from './create-sku.dto';

export class ImportSkuRowDto extends OmitType(CreateSkuDto, [
  'partnerId',
] as const) {}

export class ImportSkusDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiPropertyOptional({
    description: 'true — полная замена справочника партнёра, false — дозагрузка/обновление',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  @ApiProperty({ type: [ImportSkuRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSkuRowDto)
  rows: ImportSkuRowDto[];
}
