import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DocumentType = 'MX1' | 'TORG2' | 'TTN' | 'MX3';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Регистрирует факт формирования документа со снимком данных.
   * Печатная форма не генерируется — фиксируется история и данные для неё.
   */
  async create(
    requestId: number,
    type: DocumentType,
    data: unknown,
    createdBy = 'tsd',
  ) {
    const count = await this.prisma.warehouseDocument.count({
      where: { requestId, type },
    });
    const number = `${type}-${requestId}-${count + 1}`;
    return this.prisma.warehouseDocument.create({
      data: {
        requestId,
        type,
        number,
        data: JSON.stringify(data),
        createdBy,
      },
    });
  }

  async listByRequest(requestId: number) {
    const docs = await this.prisma.warehouseDocument.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => ({ ...d, data: JSON.parse(d.data) }));
  }
}
