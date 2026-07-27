import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { advanceStatus } from '../../common/request-status';
import { CreateReceiptDto } from './dto/create-receipt.dto';

const receiptInclude = { items: true } as const;

@Injectable()
export class ReceivingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  async create(dto: CreateReceiptDto, receivedBy?: string) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: dto.requestId },
    });
    if (!request) {
      throw new NotFoundException(`Заявка #${dto.requestId} не найдена`);
    }

    const isPartial = dto.items.some((i) => i.acceptedQty !== i.expectedQty);

    const receipt = await this.prisma.receipt.create({
      data: {
        requestId: dto.requestId,
        type: dto.type,
        isPartial,
        receivedBy: receivedBy ?? dto.receivedBy,
        comment: dto.comment ?? null,
        items: {
          create: dto.items.map((i) => ({
            requestItemId: i.requestItemId ?? null,
            article: i.article,
            expectedQty: i.expectedQty,
            acceptedQty: i.acceptedQty,
            discrepancyType: i.discrepancyType ?? null,
            discrepancyComment: i.discrepancyComment ?? null,
          })),
        },
      },
      include: receiptInclude,
    });

    const nextStatus = advanceStatus(request.status, 'Приёмка');
    if (nextStatus !== request.status) {
      await this.prisma.partnerRequest.update({
        where: { id: request.id },
        data: { status: nextStatus },
      });
    }

    return receipt;
  }

  async findByRequest(requestId: number) {
    return this.prisma.receipt.findMany({
      where: { requestId },
      include: receiptInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: receiptInclude,
    });
    if (!receipt) throw new NotFoundException(`Приёмка #${id} не найдена`);
    return receipt;
  }

  /**
   * Формирование документа по приёмке: МХ-1 — по факту приёмки,
   * ТОРГ-2 — при выявленных расхождениях (количество/качество/упаковка).
   */
  async createDocument(receiptId: number, type: 'MX1' | 'TORG2', createdBy = 'tsd') {
    const receipt = await this.findOne(receiptId);
    return this.documents.create(receipt.requestId, type, receipt, createdBy);
  }
}
