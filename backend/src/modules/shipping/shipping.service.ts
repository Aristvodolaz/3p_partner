import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { advanceStatus } from '../../common/request-status';
import { CreateShipmentDto } from './dto/create-shipment.dto';

const shipmentInclude = { items: true } as const;

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  async create(dto: CreateShipmentDto) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: dto.requestId },
    });
    if (!request) {
      throw new NotFoundException(`Заявка #${dto.requestId} не найдена`);
    }

    return this.prisma.shipment.create({
      data: {
        requestId: dto.requestId,
        method: dto.method,
        vehicleInfo: dto.vehicleInfo ?? null,
        driverName: dto.driverName ?? null,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null,
        comment: dto.comment ?? null,
        items: {
          create: dto.items.map((i) => ({
            article: i.article,
            name: i.name ?? null,
            quantity: i.quantity,
          })),
        },
      },
      include: shipmentInclude,
    });
  }

  async findByRequest(requestId: number) {
    return this.prisma.shipment.findMany({
      where: { requestId },
      include: shipmentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: shipmentInclude,
    });
    if (!shipment) throw new NotFoundException(`Отгрузка #${id} не найдена`);
    return shipment;
  }

  async markShipped(id: number, shippedBy: string) {
    const shipment = await this.findOne(id);
    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { shippedAt: new Date(), shippedBy },
      include: shipmentInclude,
    });

    const request = await this.prisma.partnerRequest.findUniqueOrThrow({
      where: { id: shipment.requestId },
    });
    const nextStatus = advanceStatus(request.status, 'Отгружено');
    if (nextStatus !== request.status) {
      await this.prisma.partnerRequest.update({
        where: { id: request.id },
        data: { status: nextStatus },
      });
    }

    return updated;
  }

  /** Формирование ТТН или МХ-3 по отгрузке */
  async createDocument(shipmentId: number, type: 'TTN' | 'MX3', createdBy = 'tsd') {
    const shipment = await this.findOne(shipmentId);
    return this.documents.create(shipment.requestId, type, shipment, createdBy);
  }
}
