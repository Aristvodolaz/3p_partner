import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { QueryPartnerDto } from './dto/query-partner.dto';

@ApiTags('Партнёры')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать карточку партнёра' })
  @ApiCreatedResponse({ description: 'Партнёр успешно создан' })
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список партнёров с поиском и фильтрацией' })
  @ApiOkResponse({ description: 'Список партнёров' })
  findAll(@Query() query: QueryPartnerDto) {
    return this.partnersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить партнёра по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать карточку партнёра' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Деактивировать партнёра (история сохраняется)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Активировать партнёра' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.activate(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'История изменений по партнёру' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.getHistory(id);
  }
}
