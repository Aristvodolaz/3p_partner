import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Сотрудники')
@Roles('НРП')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Список сотрудников (появляются автоматически после первого входа)' })
  findAll(@Query('search') search?: string) {
    return this.employeesService.findAll(search);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Назначить роль (НПП/НРП) и/или активность сотрудника' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }
}
