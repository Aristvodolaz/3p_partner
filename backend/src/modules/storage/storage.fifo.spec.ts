import { ConflictException } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Тесты FIFO-логики перемещения/списания: приватный splitFifo проверяется
 * через публичные move/remove — что партии берутся в порядке приёмки
 * (старые первыми), а нехватка даёт Conflict и не пишет движений.
 */
describe('StorageService FIFO (move/remove)', () => {
  let service: StorageService;
  let prisma: any;
  let zones: any;

  // Две партии одного артикула на одном адресе: старая (id 100, янв) и
  // новая (id 200, март). groupBy в fifoBatchesAtAddress вернёт их так.
  const batchRows = [
    { incomingDeliveryItemId: 200, _sum: { quantity: 6 }, _min: { receivedAt: new Date('2026-03-01') } },
    { incomingDeliveryItemId: 100, _sum: { quantity: 4 }, _min: { receivedAt: new Date('2026-01-01') } },
  ];

  const address = (code: string, type: string) => ({
    id: code.length,
    code,
    isActive: true,
    zone: { type },
  });

  beforeEach(() => {
    prisma = {
      storageMovement: {
        // fifoBatchesAtAddress группирует по партии, balanceForArticle (в конце
        // move/remove) — по адресу; отдаём подходящую форму под каждый вызов.
        groupBy: jest.fn((args: any) =>
          args.by?.includes('address')
            ? Promise.resolve([{ address: 'S-01', _sum: { quantity: 5 } }])
            : Promise.resolve(batchRows),
        ),
        create: jest.fn((args: any) => args), // вернём аргументы как «созданную» запись
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    zones = {
      resolveAddressByCode: jest.fn(async (code: string) =>
        code === 'S-01' ? address('S-01', 'S') : address('W-01', 'W'),
      ),
    };
    service = new StorageService(prisma, zones);
  });

  it('remove списывает из старой партии первой (FIFO)', async () => {
    // Нужно списать 5: 4 из партии 100 (старая), 1 из партии 200.
    await service.remove(
      { partnerId: 1, article: 'A1', address: 'S-01', quantity: 5 } as any,
      'user',
    );

    const created = prisma.storageMovement.create.mock.calls.map((c: any) => c[0].data);
    expect(created).toHaveLength(2);
    expect(created[0]).toMatchObject({ incomingDeliveryItemId: 100, quantity: -4 });
    expect(created[1]).toMatchObject({ incomingDeliveryItemId: 200, quantity: -1 });
  });

  it('remove бросает Conflict при нехватке и не пишет движений', async () => {
    await expect(
      service.remove(
        { partnerId: 1, article: 'A1', address: 'S-01', quantity: 999 } as any,
        'user',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.storageMovement.create).not.toHaveBeenCalled();
  });

  it('move создаёт пары MOVE_OUT/MOVE_IN по партиям в FIFO-порядке', async () => {
    // Переместить 5 из S-01 в W-01: партия 100 (4) + партия 200 (1).
    await service.move(
      { partnerId: 1, article: 'A1', fromAddress: 'S-01', toAddress: 'W-01', quantity: 5 } as any,
      'user',
    );

    const created = prisma.storageMovement.create.mock.calls.map((c: any) => c[0].data);
    // 2 партии × (OUT + IN) = 4 движения.
    expect(created).toHaveLength(4);
    // Старая партия первой: OUT -4 из S, IN +4 в W.
    expect(created[0]).toMatchObject({ type: 'MOVE_OUT', incomingDeliveryItemId: 100, quantity: -4, zoneType: 'S' });
    expect(created[1]).toMatchObject({ type: 'MOVE_IN', incomingDeliveryItemId: 100, quantity: 4, zoneType: 'W' });
    expect(created[2]).toMatchObject({ type: 'MOVE_OUT', incomingDeliveryItemId: 200, quantity: -1 });
    expect(created[3]).toMatchObject({ type: 'MOVE_IN', incomingDeliveryItemId: 200, quantity: 1 });
  });

  it('balanceInZone возвращает сумму движений (0, если пусто)', async () => {
    prisma.storageMovement.aggregate = jest.fn().mockResolvedValue({ _sum: { quantity: null } });
    expect(await service.balanceInZone(1, 'A1', 'W')).toBe(0);

    prisma.storageMovement.aggregate = jest.fn().mockResolvedValue({ _sum: { quantity: 7 } });
    expect(await service.balanceInZone(1, 'A1', 'W')).toBe(7);
  });
});
