import * as XLSX from 'xlsx';
import type { Operation, PartnerTariffInput, SkuFormData } from '@/types/sku';

export interface ParseResult {
  rows: SkuFormData[];
  tariffs: PartnerTariffInput[];
  warnings: string[];
}

/** Нормализация заголовка для сопоставления с операцией из каталога */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
}

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function toInt(v: unknown): number | undefined {
  const n = toNumber(v);
  return n === undefined ? undefined : Math.round(n);
}

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

// Фиксированные атрибутные колонки шаблона «Справочник» (индексы 0–8)
const ATTR_COLUMNS = 9;

/**
 * Парсит лист «Справочник» шаблона: строка 2 — заголовки,
 * колонки 0–8 — атрибуты SKU, начиная с 9-й — операции
 * (значение в ячейке = операция утверждена).
 */
export function parseSkuExcel(
  buffer: ArrayBuffer,
  operations: Operation[],
): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName =
    wb.SheetNames.find((n) => n.trim().toLowerCase().includes('справочник')) ??
    wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error('Не найден лист «Справочник»');

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  });

  // Ищем строку заголовков — первая строка, где первая ячейка содержит «артикул»
  const headerRowIdx = grid.findIndex(
    (row) => typeof row[0] === 'string' && normalize(row[0]).includes('артикул'),
  );
  if (headerRowIdx === -1) {
    throw new Error('Не найдена строка заголовков (колонка «Артикул»)');
  }

  const headers = grid[headerRowIdx].map((h) => String(h ?? '').trim());
  const warnings: string[] = [];

  // Сопоставляем колонки операций с каталогом по нормализованному названию
  const opsByNorm = new Map(operations.map((op) => [normalize(op.name), op]));
  const opColumns: { col: number; code: string }[] = [];
  for (let col = ATTR_COLUMNS; col < headers.length; col++) {
    if (!headers[col]) continue;
    const op = opsByNorm.get(normalize(headers[col]));
    if (op) {
      opColumns.push({ col, code: op.code });
    } else {
      warnings.push(`Колонка «${headers[col]}» не сопоставлена с операцией — пропущена`);
    }
  }

  // Строка расценок партнёра — над заголовками, значения в колонках операций
  const tariffs: PartnerTariffInput[] = [];
  if (headerRowIdx > 0) {
    const tariffRow = grid[headerRowIdx - 1];
    for (const { col, code } of opColumns) {
      const tariff = toNumber(tariffRow?.[col]);
      if (tariff !== undefined) tariffs.push({ code, tariff });
    }
  }

  const rows: SkuFormData[] = [];
  for (let i = headerRowIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    const article = toStr(row[0]);
    const name = toStr(row[1]);
    if (!article && !name) continue; // пустая строка
    if (!article) {
      warnings.push(`Строка ${i + 1}: нет артикула — пропущена`);
      continue;
    }
    if (!name) {
      warnings.push(`Строка ${i + 1}: нет наименования — пропущена`);
      continue;
    }

    const ops = opColumns
      .filter(({ col }) => toStr(row[col]) !== undefined)
      .map(({ col, code }) => ({ code, value: toStr(row[col]) }));

    rows.push({
      article,
      name,
      sumOfSides: toNumber(row[2]),
      clientRequirements: toStr(row[3]),
      specialMarks: toStr(row[4]),
      boxQuant: toInt(row[5]),
      palletQuant: toInt(row[6]),
      packCostUnit: toNumber(row[7]),
      packCostBox: toNumber(row[8]),
      operations: ops,
    });
  }

  return { rows, tariffs, warnings };
}
