import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export const RECEIPT_TYPES = ['PALLET', 'BOX', 'UNIT'] as const;
export const DISCREPANCY_TYPES = [
  'QUALITY',
  'NAME',
  'QUANTITY',
  'PACKAGING',
  'DEFECT',
] as const;

export class ReceiptItemDto {
  @ApiPropertyOptional({ description: 'ID позиции заявки, если сопоставлена' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  requestItemId?: number;

  @ApiProperty({ description: 'Артикул' })
  @IsString()
  @IsNotEmpty()
  article: string;

  @ApiProperty({ description: 'Ожидаемое количество (по заявке)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedQty: number;

  @ApiProperty({ description: 'Принято по факту' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  acceptedQty: number;

  @ApiPropertyOptional({ enum: DISCREPANCY_TYPES, description: 'Тип расхождения' })
  @IsOptional()
  @IsIn(DISCREPANCY_TYPES)
  discrepancyType?: (typeof DISCREPANCY_TYPES)[number];

  @ApiPropertyOptional({ description: 'Комментарий к расхождению' })
  @IsOptional()
  @IsString()
  discrepancyComment?: string;
}

export class CreateReceiptDto {
  @ApiProperty({ description: 'ID заявки' })
  @Type(() => Number)
  @IsInt()
  requestId: number;

  @ApiProperty({ enum: RECEIPT_TYPES, description: 'Тип приёмки' })
  @IsIn(RECEIPT_TYPES)
  type: (typeof RECEIPT_TYPES)[number];

  @ApiProperty({ description: 'Кто принял' })
  @IsString()
  @IsNotEmpty()
  receivedBy: string;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ type: [ReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items: ReceiptItemDto[];
}
