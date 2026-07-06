import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SetPartnerTariffsDto } from './dto/partner-tariffs.dto';
import {
  ImportTariffsDto,
  UpdateOperationDto,
} from './dto/import-tariffs.dto';
import { SkusService } from './skus.service';

@ApiTags('Тарифы по операциям')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly skusService: SkusService) {}

  @Get('operations')
  @ApiOperation({ summary: 'Каталог операций (наименование, описание, ед. изм.)' })
  getOperations() {
    return this.skusService.getOperations();
  }

  @Get('coefficients')
  @ApiOperation({ summary: 'Коэффициенты К0-К5 по сумме трёх сторон (ШДВ)' })
  getCoefficients() {
    return this.skusService.getCoefficients();
  }

  @Patch('operations/:id')
  @ApiOperation({ summary: 'Редактировать описание/единицу измерения операции' })
  updateOperation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOperationDto,
  ) {
    return this.skusService.updateOperation(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Тарифы партнёра по операциям' })
  getPartnerTariffs(@Query('partnerId', ParseIntPipe) partnerId: number) {
    return this.skusService.getPartnerTariffs(partnerId);
  }

  @Post()
  @ApiOperation({ summary: 'Установить тарифы партнёра вручную' })
  setPartnerTariffs(@Body() dto: SetPartnerTariffsDto) {
    return this.skusService.setPartnerTariffs(dto.partnerId, dto.tariffs);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Загрузка тарифов из Excel (лист «Операции и описание»)',
  })
  import(@Body() dto: ImportTariffsDto) {
    return this.skusService.importTariffs(
      dto.partnerId,
      dto.items,
      dto.replace ?? false,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Полное удаление тарифов партнёра' })
  deleteAll(@Query('partnerId', ParseIntPipe) partnerId: number) {
    return this.skusService.deletePartnerTariffs(partnerId);
  }

  @Get('history')
  @ApiOperation({ summary: 'История изменения тарифов партнёра' })
  getHistory(@Query('partnerId', ParseIntPipe) partnerId: number) {
    return this.skusService.getTariffHistory(partnerId);
  }
}
