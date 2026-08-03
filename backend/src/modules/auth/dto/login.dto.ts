import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'ШК / табельный номер сотрудника' })
  @IsString()
  @MinLength(1)
  employeeId: string;
}
