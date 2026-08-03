import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const PACKING_UNIT_TYPES = ['BOX', 'PALLET'] as const;

export class CreatePackingUnitDto {
  @ApiProperty({ description: 'ID позиции заявки' })
  @Type(() => Number)
  @IsInt()
  requestItemId: number;

  @ApiProperty({ enum: PACKING_UNIT_TYPES, description: 'Короб или паллета' })
  @IsIn(PACKING_UNIT_TYPES)
  type: (typeof PACKING_UNIT_TYPES)[number];

  @ApiPropertyOptional({ description: 'ШК ВПС / номер паллеты (если не указан — генерируется)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Срок годности' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Вложенность (кол-во единиц в упаковке)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nestingQty?: number;
}

export class AddPackingUnitItemDto {
  @ApiProperty({ description: 'ID позиции заявки (артикула, помещаемого в короб/паллету)' })
  @Type(() => Number)
  @IsInt()
  requestItemId: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  article: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Брак' })
  @IsOptional()
  @IsBoolean()
  isDefect?: boolean;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdatePackingUnitDto {
  @ApiPropertyOptional({ description: 'Срок годности' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Вложенность' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nestingQty?: number;

  @ApiPropertyOptional({ enum: ['IN_PROGRESS', 'COMPLETED'], description: 'Завершить упаковку' })
  @IsOptional()
  @IsIn(['IN_PROGRESS', 'COMPLETED'])
  status?: 'IN_PROGRESS' | 'COMPLETED';
}

export class BindParentPalletDto {
  @ApiProperty({ description: 'ID паллеты, к которой привязывается короб' })
  @Type(() => Number)
  @IsInt()
  parentPalletId: number;
}
