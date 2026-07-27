import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class PlaceItemDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  article: string;

  @ApiProperty({ description: 'Адрес ячейки' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ description: 'ID позиции заявки, если известна' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  requestItemId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RemoveItemDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  article: string;

  @ApiProperty({ description: 'Адрес ячейки' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class MoveItemDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  article: string;

  @ApiProperty({ description: 'Адрес-источник' })
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @ApiProperty({ description: 'Адрес-назначение' })
  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
