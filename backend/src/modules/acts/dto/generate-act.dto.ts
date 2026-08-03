import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export const ACT_TYPES = ['REQUEST', 'ON_DEMAND', 'MONTHLY'] as const;

export class GenerateActDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ enum: ACT_TYPES })
  @IsIn(ACT_TYPES)
  type: (typeof ACT_TYPES)[number];

  @ApiPropertyOptional({
    description: 'ID заявок (для REQUEST — одна, для ON_DEMAND — одна или несколько)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  requestIds?: number[];

  @ApiPropertyOptional({ description: 'Месяц для MONTHLY, формат ГГГГ-ММ' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  periodLabel?: string;
}
