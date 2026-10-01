import { describe, it, expect } from 'vitest';
import { getSizeCoefficient, calcEffectiveTariff } from './tariffCalc';
import type { Operation, TariffCoefficient } from '@/types/sku';

const coefficients: TariffCoefficient[] = [
  { id: 1, code: 'К0', multiplier: '1', minSum: '0', maxSum: '60', label: 'до 60' },
  { id: 2, code: 'К1', multiplier: '1.5', minSum: '61', maxSum: '120', label: '61–120' },
  { id: 3, code: 'К2', multiplier: '2', minSum: '121', maxSum: null, label: 'от 121' },
];

const op = (over: Partial<Operation> = {}): Operation => ({
  id: 1,
  code: 'pack',
  name: 'Упаковка',
  description: null,
  unit: 'шт',
  tariff: '10',
  applySizeCoef: false,
  sortOrder: 0,
  phase: 'OUTGOING',
  ...over,
});

describe('getSizeCoefficient', () => {
  it('подбирает диапазон по сумме трёх сторон', () => {
    expect(getSizeCoefficient(50, coefficients)?.code).toBe('К0');
    expect(getSizeCoefficient(100, coefficients)?.code).toBe('К1');
    expect(getSizeCoefficient(500, coefficients)?.code).toBe('К2'); // открытый верх (maxSum null)
  });

  it('границы диапазона включительны', () => {
    expect(getSizeCoefficient(60, coefficients)?.code).toBe('К0');
    expect(getSizeCoefficient(61, coefficients)?.code).toBe('К1');
  });

  it('undefined/NaN → нет коэффициента', () => {
    expect(getSizeCoefficient(undefined, coefficients)).toBeUndefined();
    expect(getSizeCoefficient(NaN, coefficients)).toBeUndefined();
  });
});

describe('calcEffectiveTariff', () => {
  it('без коэффициента: тариф партнёра перекрывает дефолт операции', () => {
    const r = calcEffectiveTariff(op({ tariff: '10' }), '15', 100, coefficients);
    expect(r).toEqual({ base: 15, multiplier: 1, total: 15 });
  });

  it('без тарифа партнёра берётся дефолт операции', () => {
    const r = calcEffectiveTariff(op({ tariff: '12' }), undefined, 100, coefficients);
    expect(r?.base).toBe(12);
    expect(r?.total).toBe(12);
  });

  it('с applySizeCoef умножает на коэффициент по ШДВ', () => {
    const r = calcEffectiveTariff(op({ applySizeCoef: true }), '10', 100, coefficients);
    expect(r).toEqual({ base: 10, multiplier: 1.5, coefCode: 'К1', total: 15 });
  });

  it('coefCode не выставляется при множителе 1 (базовый К0)', () => {
    const r = calcEffectiveTariff(op({ applySizeCoef: true }), '10', 50, coefficients);
    expect(r?.multiplier).toBe(1);
    expect(r?.coefCode).toBeUndefined();
  });

  it('округляет итог до 2 знаков', () => {
    const r = calcEffectiveTariff(op({ applySizeCoef: true, tariff: '3.33' }), '3.33', 100, coefficients);
    // 3.33 * 1.5 = 4.995 → 5
    expect(r?.total).toBe(5);
  });

  it('нет базовой ставки нигде → undefined', () => {
    const r = calcEffectiveTariff(op({ tariff: null }), undefined, 100, coefficients);
    expect(r).toBeUndefined();
  });
});
