import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentEmployee } from '../../common/decorators/current-employee.decorator';
import { CurrentEmployeeInfo } from '../../common/guards/jwt-auth.guard';
import { ActsService } from './acts.service';
import { GenerateActDto } from './dto/generate-act.dto';

@ApiTags('Акты выполненных услуг')
@Roles('НРП')
@Controller('acts')
export class ActsController {
  constructor(private readonly actsService: ActsService) {}

  @Get()
  @ApiOperation({ summary: 'История актов (опционально по партнёру)' })
  findAll(@Query('partnerId') partnerId?: string) {
    return this.actsService.findAll(partnerId ? Number(partnerId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Акт с построчной разбивкой' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actsService.findOne(id);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Сформировать акт: по заявке, по запросу (несколько заявок) или за месяц',
  })
  generate(@Body() dto: GenerateActDto, @CurrentEmployee() employee: CurrentEmployeeInfo) {
    return this.actsService.generate(dto, employee.fullName);
  }
}
