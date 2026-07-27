import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MoveItemDto, PlaceItemDto, RemoveItemDto } from './dto/storage.dto';
import { StorageService } from './storage.service';

class BalanceArticleQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  partnerId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  article: string;
}

class BalanceAddressQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partnerId?: number;
}

class HistoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  partnerId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  article?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

@ApiTags('Хранение')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('place')
  @ApiOperation({ summary: 'Назначить адрес ячейки для товара' })
  place(@Body() dto: PlaceItemDto) {
    return this.storageService.place(dto);
  }

  @Post('remove')
  @ApiOperation({ summary: 'Снять товар с адреса' })
  remove(@Body() dto: RemoveItemDto) {
    return this.storageService.remove(dto);
  }

  @Post('move')
  @ApiOperation({ summary: 'Переместить товар между адресами' })
  move(@Body() dto: MoveItemDto) {
    return this.storageService.move(dto);
  }

  @Get('balance/by-article')
  @ApiOperation({ summary: 'Остатки по артикулу (по всем адресам)' })
  balanceByArticle(@Query() query: BalanceArticleQueryDto) {
    return this.storageService.balanceForArticle(query.partnerId, query.article);
  }

  @Get('balance/by-address')
  @ApiOperation({ summary: 'Остатки по адресу (по всем артикулам)' })
  balanceByAddress(@Query() query: BalanceAddressQueryDto) {
    return this.storageService.balanceForAddress(query.address, query.partnerId);
  }

  @Get('history')
  @ApiOperation({ summary: 'История перемещений' })
  history(@Query() query: HistoryQueryDto) {
    return this.storageService.history(query);
  }
}
