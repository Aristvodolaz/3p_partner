import * as XLSX from 'xlsx';
import type { InventoryTask } from '@/types/inventory';

/**
 * Инвентаризационная опись по форме ИНВ-5 (Приказ Минфина РФ от 18.08.98
 * №88, унифицированная форма) — для товаров, принятых на ответственное
 * хранение. Разобрал структуру приложенного к ТЗ образца xls и повторил
 * состав колонок построчной таблицы; подписной блок формы не воспроизводим
 * (внутренний рабочий документ, не юридически значимый бланк).
 */
export function exportInv5ToExcel(task: InventoryTask) {
  const rows: (string | number)[][] = [
    ['ИНВЕНТАРИЗАЦИОННАЯ ОПИСЬ', ''],
    ['товарно-материальных ценностей, принятых на ответственное хранение', ''],
    ['Унифицированная форма № ИНВ-5 (Постановление Госкомстата РФ от 18.08.98 № 88)', ''],
    ['', ''],
    ['Задание', task.number],
    ['Партнёр', task.partner?.name ?? (task.source === 'INTERNAL' ? 'Внутренняя (весь склад)' : '—')],
    ['Дата создания', new Date(task.createdAt).toLocaleString('ru-RU')],
    ['Исполнители', task.executors.map((e) => e.employeeId).join(', ') || '—'],
    ['', ''],
    [
      '№ п/п',
      'Наименование (номенклатурный номер)',
      'Артикул',
      'Место хранения',
      'Количество по данным учёта',
      'Количество фактически',
      'Отклонение',
      'Кто пересчитал',
    ],
  ];

  task.items.forEach((item, i) => {
    const counted = item.countedQty;
    const deviation = counted != null ? counted - item.expectedQty : '';
    rows.push([
      i + 1,
      item.name ?? '—',
      item.article,
      item.address ?? '—',
      item.expectedQty,
      counted ?? '—',
      deviation,
      item.countedBy ?? '—',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 24 },
  ];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ИНВ-5');

  XLSX.writeFile(wb, `${task.number}_ИНВ-5.xlsx`);
}
