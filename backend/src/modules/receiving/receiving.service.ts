import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { advanceStatus } from '../../common/request-status';
import { CreateReceiptDto } from './dto/create-receipt.dto';

const receiptInclude = { items: true } as const;

export interface ReceivingSummaryItem {
  requestItemId: number;
  article: string;
  name: string | null;
  expectedQty: number;
  receivedQty: number;
  remainingQty: number;
  fullyReceived: boolean;
}

@Injectable()
export class ReceivingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  async create(dto: CreateReceiptDto, receivedBy?: string) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: dto.requestId },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException(`Заявка #${dto.requestId} не найдена`);
    }

    // Не даём принять по позиции больше, чем заявлено (с учётом уже принятого ранее)
    const alreadyReceived = await this.receivedByRequestItem(dto.requestId);
    for (const incoming of dto.items) {
      if (!incoming.requestItemId) continue;
      const requestItem = request.items.find((i) => i.id === incoming.requestItemId);
      if (!requestItem) continue;
      const received = alreadyReceived.get(incoming.requestItemId) ?? 0;
      if (received >= requestItem.quantity) {
        throw new ConflictException(
          `Артикул «${requestItem.article}» уже принят полностью (${received}/${requestItem.quantity}) — повторная приёмка по этой позиции недоступна`,
        );
      }
      if (received + incoming.acceptedQty > requestItem.quantity) {
        throw new ConflictException(
          `Артикул «${requestItem.article}»: заявлено ${requestItem.quantity}, уже принято ${received}, попытка принять ещё ${incoming.acceptedQty} превышает заявленное количество`,
        );
      }
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
   * Сводка по заявке: сколько заявлено / уже принято / осталось принять
   * по каждой позиции. Используется, чтобы не показывать и не позволять
   * повторно принимать уже полностью принятые позиции.
   */
  async getSummary(requestId: number): Promise<ReceivingSummaryItem[]> {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: requestId },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException(`Заявка #${requestId} не найдена`);
    }

    const receivedByItem = await this.receivedByRequestItem(requestId);

    return request.items.map((item) => {
      const receivedQty = receivedByItem.get(item.id) ?? 0;
      const remainingQty = Math.max(item.quantity - receivedQty, 0);
      return {
        requestItemId: item.id,
        article: item.article,
        name: item.name,
        expectedQty: item.quantity,
        receivedQty,
        remainingQty,
        fullyReceived: remainingQty <= 0,
      };
    });
  }

  /** Сколько уже принято по каждой позиции заявки (сумма по всем прошлым приёмкам) */
  private async receivedByRequestItem(requestId: number): Promise<Map<number, number>> {
    const priorItems = await this.prisma.receiptItem.findMany({
      where: { receipt: { requestId }, requestItemId: { not: null } },
    });
    const map = new Map<number, number>();
    for (const ri of priorItems) {
      if (ri.requestItemId == null) continue;
      map.set(ri.requestItemId, (map.get(ri.requestItemId) ?? 0) + ri.acceptedQty);
    }
    return map;
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
