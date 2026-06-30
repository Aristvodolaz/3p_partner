import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePartnerDto {
  @ApiProperty({ example: 'ООО «Ромашка»', description: 'Название организации' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '7707083893', description: 'ИНН (10 или 12 цифр)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}(\d{2})?$/, { message: 'ИНН должен содержать 10 или 12 цифр' })
  inn: string;

  @ApiProperty({ example: 'Д-2024/001', description: 'Номер договора' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contractNumber: string;

  @ApiProperty({ example: 'Иванов Иван Иванович', description: 'ФИО контактного лица' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactPerson: string;

  @ApiProperty({ example: '+79001234567', description: 'Телефон' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: 'partner@example.com', description: 'Email' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Оплата в течение 30 дней с момента выставления счёта', description: 'Условия оплаты' })
  @IsString()
  @IsNotEmpty()
  paymentTerms: string;
}
