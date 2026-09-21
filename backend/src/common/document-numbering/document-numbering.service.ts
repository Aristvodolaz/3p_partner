import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DocType = 'INCOMING' | 'OUTGOING' | 'INVENTORY';

const PREFIX: Record<DocType, string> = {
  INCOMING: 'ВХП',
  OUTGOING: 'ИСП',
  INVENTORY: 'ИНВ',
};

/**
 * Общая для ВХП/ИСП/Инвентаризации логика: сквозная нумерация по типу
 * документа и история статусов (кто, когда). См. Документ5.docx п.2, п.5-6.
 */
@Injectable()
export class DocumentNumberingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Атомарно увеличивает счётчик и возвращает готовый номер вида "ВХП-123". */
  async nextNumber(docType: DocType): Promise<string> {
    const counter = await this.prisma.documentCounter.upsert({
      where: { docType },
      update: { lastNumber: { increment: 1 } },
      create: { docType, lastNumber: 1 },
    });
    return `${PREFIX[docType]}-${counter.lastNumber}`;
  }

  logStatus(docType: DocType, docId: number, status: string, changedBy: string) {
    return this.prisma.statusChange.create({
      data: { docType, docId, status, changedBy },
    });
  }

  getHistory(docType: DocType, docId: number) {
    return this.prisma.statusChange.findMany({
      where: { docType, docId },
      orderBy: { changedAt: 'asc' },
    });
  }
}
