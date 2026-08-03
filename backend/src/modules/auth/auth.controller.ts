import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Вход по ШК/табельному номеру сотрудника (через внешний сервис авторизации)',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.employeeId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Текущий авторизованный сотрудник' })
  me(@CurrentEmployee() employee: CurrentEmployeeInfo) {
    return employee;
  }
}
