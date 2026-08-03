import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ enum: ['НПП', 'НРП'], nullable: true })
  @IsOptional()
  @IsIn(['НПП', 'НРП', null])
  role?: 'НПП' | 'НРП' | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
