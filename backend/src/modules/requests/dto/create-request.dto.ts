import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RequestItemDto {
  @ApiProperty({ description: 'Артикул (из справочника SKU)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  article: string;

  @ApiPropertyOptional({ description: 'Наименование товара' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @ApiProperty({ description: 'Количество' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Дата прихода на СК «Поларис»' })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({ description: 'Дата отгрузки партнёру / срок обработки' })
  @IsOptional()
  @IsDateString()
  shipmentDate?: string;
}

export class CreateRequestDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ description: 'Номер заявки (присваивается вручную)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  number: string;

  @ApiPropertyOptional({ description: 'Дата создания заявки (из файла)' })
  @IsOptional()
  @IsDateString()
  requestDate?: string;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ type: [RequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];
}

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @ApiPropertyOptional({ description: 'Статус заявки' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
