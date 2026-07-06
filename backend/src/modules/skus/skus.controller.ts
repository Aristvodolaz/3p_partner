import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateSkuDto } from './dto/create-sku.dto';
import { ImportSkusDto } from './dto/import-skus.dto';
import { QuerySkuDto } from './dto/query-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkusService, UPLOADS_DIR } from './skus.service';

const photoStorage = diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `sku-${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

@ApiTags('Справочник SKU')
@Controller('skus')
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @Get('operations')
  @ApiOperation({ summary: 'Каталог операций с тарифами' })
  getOperations() {
    return this.skusService.getOperations();
  }

  @Get()
  @ApiOperation({ summary: 'Список SKU с фильтром по партнёру и поиском' })
  @ApiOkResponse({ description: 'Список SKU' })
  findAll(@Query() query: QuerySkuDto) {
    return this.skusService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить SKU по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skusService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать карточку SKU' })
  @ApiCreatedResponse({ description: 'SKU создан' })
  create(@Body() dto: CreateSkuDto) {
    return this.skusService.create(dto);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Массовый импорт SKU из Excel (замена или дозагрузка)',
  })
  import(@Body() dto: ImportSkusDto) {
    return this.skusService.import(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать SKU (атрибуты и операции)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSkuDto) {
    return this.skusService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить SKU' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.skusService.remove(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Полное удаление справочника партнёра' })
  removeAllByPartner(@Query('partnerId', ParseIntPipe) partnerId: number) {
    return this.skusService.removeAllByPartner(partnerId);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Загрузить фото SKU (до 3 штук)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: photoStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
        cb(ok ? null : new BadRequestException('Допустимы только изображения (jpg, png, webp, gif)'), ok);
      },
    }),
  )
  addPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл не передан');
    return this.skusService.addPhoto(id, file.filename);
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Удалить фото SKU' })
  removePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return this.skusService.removePhoto(id, photoId);
  }
}
