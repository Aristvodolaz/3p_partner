import * as XLSX from 'xlsx';
import type { ImportTariffItem } from '@/types/sku';

export interface TariffParseResult {
  items: ImportTariffItem[];
  warnings: string[];
}

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Парсит лист «Операции и описание»: колонки — Операция,
 * Единица измерения, Тариф руб. с НДС. Таблицы коэффициентов справа игнорируются.
 */
export function parseTariffsExcel(buffer: ArrayBuffer): TariffParseResult {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) =>
    n.trim().toLowerCase().includes('операции'),
  );
  if (!sheetName) {
    throw new Error('Не найден лист «Операции и описание»');
  }

  const grid: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: '',
  });

  // Строка заголовков — первая ячейка «Операция»
  const headerRowIdx = grid.findIndex(
    (row) =>
      typeof row[0] === 'string' &&
      row[0].trim().toLowerCase().startsWith('операци'),
  );
  if (headerRowIdx === -1) {
    throw new Error('Не найдена строка заголовков (колонка «Операция»)');
  }

  const items: ImportTariffItem[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (let i = headerRowIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    const name = toStr(row[0]);
    if (!name) continue;

    const tariff = toNumber(row[2]);
    if (tariff === undefined) {
      warnings.push(`«${name}» — тариф не указан или не число, строка пропущена`);
      continue;
    }

    const key = name.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
    if (seen.has(key)) {
      warnings.push(`«${name}» — повтор в файле, взято первое значение`);
      continue;
    }
    seen.add(key);

    items.push({ name, unit: toStr(row[1]), tariff });
  }

  return { items, warnings };
}
