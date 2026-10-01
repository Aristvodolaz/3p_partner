import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseIncomingDeliveryExcel } from './importIncomingDeliveryExcel';

/** Собирает .xlsx в память из матрицы строк и отдаёт ArrayBuffer для парсера. */
function buildXlsx(rows: unknown[][], sheetName = 'ВХП'): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return out as ArrayBuffer;
}

const HEADER = ['#ВХП', 'Артикул', 'Наименование товара', 'Кол-во', 'ШК', 'Вес', 'Объём'];

describe('parseIncomingDeliveryExcel', () => {
  it('читает шапку и позиции', () => {
    const buf = buildXlsx([
      ['Склад получатель', 'СКЛАД-1'],
      ['КД', 'да'],
      ['Дата план', '15.10.2026'],
      [],
      HEADER,
      [1, 'ART-001', 'Ручка', 100, '460000000001', 0.02, 0.0005],
      [2, 'ART-002', 'Блокнот', 50, '460000000002', 0.15, 0.001],
    ]);
    const res = parseIncomingDeliveryExcel(buf);

    expect(res.warehouseCode).toBe('СКЛАД-1');
    expect(res.isCrossDock).toBe(true);
    expect(res.plannedDate).toBe('2026-10-15');
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toMatchObject({
      article: 'ART-001',
      name: 'Ручка',
      quantity: 100,
      barcode: '460000000001',
      weight: 0.02,
      volume: 0.0005,
    });
  });

  it('пропускает строки без артикула или без количества с предупреждением', () => {
    const buf = buildXlsx([
      HEADER,
      [1, 'ART-001', 'Ручка', 10, '', '', ''],
      [2, '', 'Без артикула', 5, '', '', ''],
      [3, 'ART-003', 'Без количества', '', '', '', ''],
    ]);
    const res = parseIncomingDeliveryExcel(buf);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].article).toBe('ART-001');
    expect(res.warnings.length).toBe(2);
  });

  it('количество с запятой/пробелами нормализуется', () => {
    const buf = buildXlsx([HEADER, [1, 'ART-001', 'Ручка', '1 000', '', '1,5', '']]);
    const res = parseIncomingDeliveryExcel(buf);
    expect(res.items[0].quantity).toBe(1000);
    expect(res.items[0].weight).toBe(1.5);
  });

  it('бросает ошибку, если таблица позиций не найдена', () => {
    const buf = buildXlsx([['Просто', 'текст'], ['без', 'таблицы']]);
    expect(() => parseIncomingDeliveryExcel(buf)).toThrow();
  });
});
