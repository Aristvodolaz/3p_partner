import * as XLSX from 'xlsx';
import type { RequestItemInput } from '@/types/request';

export interface RequestParseResult {
  customerName?: string;
  requestDate?: string;
  items: RequestItemInput[];
  warnings: string[];
}

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (v instanceof Date) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function toInt(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

/** Дата из ячейки: Date (cellDates) или серийный номер Excel → ISO yyyy-mm-dd */
function toIsoDate(v: unknown): string | undefined {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  if (typeof v === 'string') {
    const m = v.trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
    if (m) {
      const year = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
  }
  return undefined;
}

function norm(s: unknown): string {
  return String(s ?? '').toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
}

/**
 * Парсит лист «Заявка на поставку»: шапка (дата создания, заказчик)
 * и таблица позиций (артикул, наименование, кол-во, дата поступления,
 * до какой даты обработать).
 */
export function parseRequestExcel(buffer: ArrayBuffer): RequestParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => n.trim().toLowerCase().includes('заявка')) ??
    wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error('Не найден лист «Заявка на поставку»');

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  });

  const warnings: string[] = [];
  let customerName: string | undefined;
  let requestDate: string | undefined;

  // Шапка: пары «Поле | Значение | Поле | Значение»
  for (const row of grid.slice(0, 8)) {
    for (let c = 0; c < row.length - 1; c++) {
      const key = norm(row[c]);
      if (key.includes('датасозданиязаявки')) {
        requestDate = toIsoDate(row[c + 1]) ?? requestDate;
      }
      if (key.includes('наименованиезаказчика')) {
        customerName = toStr(row[c + 1]) ?? customerName;
      }
    }
  }

  // Строка заголовков таблицы позиций
  const headerRowIdx = grid.findIndex((row) => norm(row[0]).includes('артикул'));
  if (headerRowIdx === -1) {
    throw new Error('Не найдена таблица позиций (колонка «Артикул (SKU)»)');
  }

  const items: RequestItemInput[] = [];
  for (let i = headerRowIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    const article = toStr(row[0]) ?? (toInt(row[0]) !== undefined ? String(row[0]) : undefined);
    const hasAny = article || toStr(row[1]) || toInt(row[2]) !== undefined;
    if (!hasAny) continue;
    if (!article) {
      warnings.push(`Строка ${i + 1}: нет артикула — пропущена`);
      continue;
    }
    const quantity = toInt(row[2]);
    if (!quantity || quantity < 1) {
      warnings.push(`Строка ${i + 1} (${article}): количество не указано — пропущена`);
      continue;
    }

    items.push({
      article,
      name: toStr(row[1]),
      quantity,
      arrivalDate: toIsoDate(row[3]),
      shipmentDate: toIsoDate(row[4]),
    });
  }

  return { customerName, requestDate, items, warnings };
}
