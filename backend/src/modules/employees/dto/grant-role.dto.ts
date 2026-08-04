import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class GrantRoleDto {
  @ApiProperty({ description: 'ШК / табельный номер сотрудника' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: ['НПП', 'НРП'] })
  @IsIn(['НПП', 'НРП'])
  role: 'НПП' | 'НРП';
}
