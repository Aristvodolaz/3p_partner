import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class QuerySkuDto {
  @ApiPropertyOptional({ description: 'ID партнёра' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partnerId?: number;

  @ApiPropertyOptional({ description: 'Поиск по артикулу, ШК, наименованию, цвету' })
  @IsOptional()
  @IsString()
  search?: string;
}
