import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PartnerTariffItemDto {
  @ApiProperty({ description: 'Код операции' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Тариф, руб. с НДС' })
  @Type(() => Number)
  @IsNumber()
  tariff: number;
}

export class SetPartnerTariffsDto {
  @ApiProperty({ description: 'ID партнёра' })
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty({ type: [PartnerTariffItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerTariffItemDto)
  tariffs: PartnerTariffItemDto[];
}
