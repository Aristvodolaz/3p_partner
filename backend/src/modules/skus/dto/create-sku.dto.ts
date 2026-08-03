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

export class SkuOperationDto {
  @ApiProperty({ description: 'Код операции (barcode_check, labeling и т.д.)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Значение из шаблона (1, количество и т.п.)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  value?: string;
}

export class CreateSkuDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  article: string;

  @ApiPropertyOptional({ description: 'Штрих-код' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ description: 'Наименование товара' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional({ description: 'Цвет' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @ApiPropertyOptional({ description: 'Срок годности' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shelfLife?: string;

  @ApiPropertyOptional({ description: 'Сумма трёх сторон, см (ШДВ)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sumOfSides?: number;

  @ApiPropertyOptional({ description: 'Вес, кг' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Требования заказчика' })
  @IsOptional()
  @IsString()
  clientRequirements?: string;

  @ApiPropertyOptional({ description: 'Специальные отметки (ЧЗ, 18+, хрупкий...)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialMarks?: string;

  @ApiPropertyOptional({ description: 'Квант коробочный' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  boxQuant?: number;

  @ApiPropertyOptional({ description: 'Квант паллетный' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  palletQuant?: number;

  @ApiPropertyOptional({ description: 'Затраты на допупаковку 1 ед., руб.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  packCostUnit?: number;

  @ApiPropertyOptional({ description: 'Затраты на допупаковку 1 короб, руб.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  packCostBox?: number;

  @ApiPropertyOptional({ description: 'Разрешить микс разных артикулов в одном коробе при упаковке' })
  @IsOptional()
  @IsBoolean()
  allowMixedBox?: boolean;

  @ApiPropertyOptional({ type: [SkuOperationDto], description: 'Операции по SKU' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuOperationDto)
  operations?: SkuOperationDto[];
}
