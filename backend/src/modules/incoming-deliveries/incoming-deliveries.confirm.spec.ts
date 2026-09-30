import { ConflictException, NotFoundException } from '@nestjs/common';
import { IncomingDeliveriesService } from './incoming-deliveries.service';

/**
 * Unit-тесты на штучную обработку операций позиции ВХП (confirmItem):
 * гейты статуса/уже-принято, требование полного количества для final,
 * гонка (count 0). Prisma/Numbering замоканы.
 */
describe('IncomingDeliveriesService.confirmItem', () => {
  let service: IncomingDeliveriesService;
  let prisma: any;
  let numbering: any;

  beforeEach(() => {
    prisma = {
      incomingDeliveryItem: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      incomingDelivery: { update: jest.fn() },
    };
    numbering = { logStatus: jest.fn() };

    service = new IncomingDeliveriesService(prisma, numbering, {} as any, {} as any);
  });

  const item = (over: Partial<any> = {}) => ({
    id: 1,
    deliveryId: 10,
    article: 'A1',
    quantity: 10,
    factQuantity: null,
    confirmedQuantity: 0,
    delivery: { id: 10, partnerId: 1, status: 'Создана' },
    ...over,
  });

  it('бросает NotFound, если позиции нет', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(null);
    await expect(service.confirmItem(1, { quantity: 1 }, 'u')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('бросает Conflict, если позиция уже принята', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(item({ factQuantity: 10 }));
    await expect(service.confirmItem(1, { quantity: 1 }, 'u')).rejects.toThrow(
      'уже принята',
    );
  });

  it('бросает Conflict, если заявка «Отмена»', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(
      item({ delivery: { id: 10, partnerId: 1, status: 'Отмена' } }),
    );
    await expect(service.confirmItem(1, { quantity: 1 }, 'u')).rejects.toThrow('Отмена');
  });

  it('final требует накопить полное заявленное количество', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(item({ confirmedQuantity: 4 }));
    // 4 + 3 = 7 < 10 → нельзя завершать
    await expect(
      service.confirmItem(1, { quantity: 3, final: true }, 'u'),
    ).rejects.toThrow('Обработано только 7 из 10');
    expect(prisma.incomingDeliveryItem.updateMany).not.toHaveBeenCalled();
  });

  it('частичное подтверждение копит confirmedQuantity и переводит «Создана»→«Процесс»', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(item({ confirmedQuantity: 4 }));
    await service.confirmItem(1, { quantity: 3 }, 'user');

    expect(prisma.incomingDeliveryItem.updateMany).toHaveBeenCalledWith({
      where: { id: 1, factQuantity: null },
      data: { confirmedQuantity: 7 },
    });
    expect(prisma.incomingDelivery.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'Процесс' },
    });
  });

  it('гонка: updateMany count 0 → Conflict', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(item());
    prisma.incomingDeliveryItem.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.confirmItem(1, { quantity: 5 }, 'u')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('не двигает статус, если заявка уже «Процесс»', async () => {
    prisma.incomingDeliveryItem.findUnique.mockResolvedValue(
      item({ delivery: { id: 10, partnerId: 1, status: 'Процесс' } }),
    );
    await service.confirmItem(1, { quantity: 5 }, 'user');
    expect(prisma.incomingDelivery.update).not.toHaveBeenCalled();
  });
});
