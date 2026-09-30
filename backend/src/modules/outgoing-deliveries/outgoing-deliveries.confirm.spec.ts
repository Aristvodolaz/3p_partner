import { ConflictException, NotFoundException } from '@nestjs/common';
import { OutgoingDeliveriesService } from './outgoing-deliveries.service';

/**
 * Unit-тесты на штучное подтверждение позиции ИСП (confirmItem) — самая
 * хрупкая логика по итогам аудита: гейты остатка/статуса/гонки и переход
 * частичное→финальное. Prisma/Storage/Numbering замоканы, БД не нужна.
 */
describe('OutgoingDeliveriesService.confirmItem', () => {
  let service: OutgoingDeliveriesService;
  let prisma: any;
  let storage: any;
  let numbering: any;

  // tx, который получает колбэк $transaction — те же методы, что у prisma.
  const tx = {
    outgoingDeliveryItem: { updateMany: jest.fn() },
  };

  beforeEach(() => {
    tx.outgoingDeliveryItem.updateMany = jest.fn().mockResolvedValue({ count: 1 });

    prisma = {
      outgoingDeliveryItem: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1, factQuantity: 5 }),
        update: jest.fn(),
      },
      outgoingDelivery: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    };
    storage = {
      balanceInZone: jest.fn().mockResolvedValue(100),
      consumeFromZone: jest.fn().mockResolvedValue(undefined),
    };
    numbering = { logStatus: jest.fn() };

    service = new OutgoingDeliveriesService(
      prisma,
      numbering,
      storage,
      {} as any,
    );
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
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(null);
    await expect(service.confirmItem(1, { quantity: 1 }, 'u')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('бросает Conflict, если позиция уже отгружена (factQuantity задан)', async () => {
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(item({ factQuantity: 10 }));
    await expect(service.confirmItem(1, { quantity: 1 }, 'u')).rejects.toThrow(
      'уже отгружена',
    );
  });

  it('бросает Conflict, если заявка уже «Выполнено»', async () => {
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(
      item({ delivery: { id: 10, partnerId: 1, status: 'Выполнено' } }),
    );
    await expect(service.confirmItem(1, { quantity: 1 }, 'u')).rejects.toThrow(
      'Выполнено',
    );
  });

  it('бросает Conflict, если в зоне W недостаточно товара', async () => {
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(item());
    storage.balanceInZone.mockResolvedValue(3);
    await expect(service.confirmItem(1, { quantity: 5 }, 'u')).rejects.toThrow(
      'доступно только 3',
    );
    expect(storage.consumeFromZone).not.toHaveBeenCalled();
  });

  it('частичное подтверждение: копит confirmedQuantity, не ставит factQuantity, списывает из W', async () => {
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(
      item({ confirmedQuantity: 4 }),
    );
    await service.confirmItem(1, { quantity: 3 }, 'user');

    expect(tx.outgoingDeliveryItem.updateMany).toHaveBeenCalledWith({
      where: { id: 1, factQuantity: null },
      data: { confirmedQuantity: 7 },
    });
    expect(storage.consumeFromZone).toHaveBeenCalledWith(
      expect.objectContaining({ zoneType: 'W', quantity: 3, article: 'A1' }),
    );
    // Частичное не двигает статус заявки.
    expect(prisma.outgoingDelivery.update).not.toHaveBeenCalled();
  });

  it('финальное подтверждение: ставит factQuantity = накопленному', async () => {
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(
      item({ confirmedQuantity: 7 }),
    );
    // maybeAdvanceStatus → findOne → все позиции отгружены.
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 10,
      status: 'Процесс',
      items: [{ factQuantity: 10 }],
    } as any);

    await service.confirmItem(1, { quantity: 3, final: true }, 'user');

    expect(tx.outgoingDeliveryItem.updateMany).toHaveBeenCalledWith({
      where: { id: 1, factQuantity: null },
      data: { confirmedQuantity: 10, factQuantity: 10 },
    });
  });

  it('гонка: если updateMany вернул count 0 — Conflict, транзакция откатывается', async () => {
    prisma.outgoingDeliveryItem.findUnique.mockResolvedValue(item());
    tx.outgoingDeliveryItem.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.confirmItem(1, { quantity: 5 }, 'u')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
