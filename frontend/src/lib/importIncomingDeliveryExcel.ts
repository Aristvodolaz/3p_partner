import * as XLSX from 'xlsx';

export interface IncomingDeliveryItemInput {
  article: string;
  name?: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  volume?: number;
}

export interface IncomingDeliveryParseResult {
  warehouseCode?: string;
  isCrossDock?: boolean;
  plannedDate?: string;
  items: IncomingDeliveryItemInput[];
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

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** См. комментарий в importRequestExcel.ts — тот же timezone-safe разбор дат. */
function toIsoDate(v: unknown): string | undefined {
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

function toBool(v: unknown): boolean {
  const s = norm(v);
  return s === 'да' || s === 'yes' || s === '1' || s === 'true';
}

/**
 * Парсит файл ВХП: шапка (склад получатель, КД, дата план) и таблица
 * позиций «#ВХП | Артикул | Наименование товара | Кол-во | ШК | Вес | Объем».
 */
export function parseIncomingDeliveryExcel(buffer: ArrayBuffer): IncomingDeliveryParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => norm(n).includes('вхп')) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error('Не найден лист с данными ВХП');

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const warnings: string[] = [];
  let warehouseCode: string | undefined;
  let isCrossDock: boolean | undefined;
  let plannedDate: string | undefined;

  for (const row of grid.slice(0, 8)) {
    for (let c = 0; c < row.length - 1; c++) {
      const key = norm(row[c]);
      if (key.includes('складполучател')) warehouseCode = toStr(row[c + 1]) ?? warehouseCode;
      if (key === 'кд') isCrossDock = toBool(row[c + 1]);
      if (key.includes('датаплан')) plannedDate = toIsoDate(row[c + 1]) ?? plannedDate;
    }
  }

  // Таблица позиций: «#ВХП | Артикул | Наименование товара | Кол-во | ШК | Вес | Объем»
  const headerRowIdx = grid.findIndex((row) => row.some((cell) => norm(cell) === 'артикул'));
  if (headerRowIdx === -1) {
    throw new Error('Не найдена таблица позиций (колонка «Артикул»)');
  }

  const items: IncomingDeliveryItemInput[] = [];
  for (let i = headerRowIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    const article = toStr(row[1]) ?? (toInt(row[1]) !== undefined ? String(row[1]) : undefined);
    const hasAny = article || toStr(row[2]) || toInt(row[3]) !== undefined;
    if (!hasAny) continue;
    if (!article) {
      warnings.push(`Строка ${i + 1}: нет артикула — пропущена`);
      continue;
    }
    const quantity = toInt(row[3]);
    if (!quantity || quantity < 1) {
      warnings.push(`Строка ${i + 1} (${article}): количество не указано — пропущена`);
      continue;
    }

    items.push({
      article,
      name: toStr(row[2]),
      quantity,
      barcode: toStr(row[4]),
      weight: toNum(row[5]),
      volume: toNum(row[6]),
    });
  }

  return { warehouseCode, isCrossDock, plannedDate, items, warnings };
}
