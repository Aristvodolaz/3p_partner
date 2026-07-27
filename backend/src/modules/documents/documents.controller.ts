import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';

@ApiTags('Документы (МХ-1, ТОРГ-2, ТТН, МХ-3)')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'История сформированных документов по заявке' })
  listByRequest(@Query('requestId', ParseIntPipe) requestId: number) {
    return this.documentsService.listByRequest(requestId);
  }
}
