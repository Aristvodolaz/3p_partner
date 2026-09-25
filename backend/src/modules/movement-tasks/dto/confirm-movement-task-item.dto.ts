import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmMovementTaskItemDto {
  @ApiProperty({ description: 'Код адреса в зоне обработки (W), куда фактически переместили товар' })
  @IsString()
  @IsNotEmpty()
  targetAddressCode: string;
}
