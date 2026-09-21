import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateInventoryTaskDto {
  @ApiProperty({ enum: ['PARTNER', 'INTERNAL'], description: 'Инициатор задания' })
  @IsIn(['PARTNER', 'INTERNAL'])
  source: 'PARTNER' | 'INTERNAL';

  @ApiPropertyOptional({ description: 'ID партнёра (обязателен для source=PARTNER)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partnerId?: number;

  @ApiPropertyOptional({ description: 'Конкретные артикулы. Не указывать вместе с all' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  articles?: string[];

  @ApiPropertyOptional({ description: 'Все артикулы на остатках склада (в рамках партнёра для PARTNER)' })
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @ApiPropertyOptional({ description: 'Табельные номера/ШК исполнителей, назначенных сразу' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  executorEmployeeIds?: string[];
}

export class CountInventoryItemDto {
  @ApiProperty({ description: 'ID позиции задания' })
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @ApiProperty({ description: 'Фактически пересчитанное количество' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedQty: number;
}

export class CountInventoryTaskDto {
  @ApiProperty({ type: [CountInventoryItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CountInventoryItemDto)
  items: CountInventoryItemDto[];
}

export class AddExecutorDto {
  @ApiProperty({ description: 'Табельный номер/ШК сотрудника' })
  @IsString()
  employeeId: string;
}
