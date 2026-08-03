import * as XLSX from 'xlsx';
import type { Act } from '@/types/act';
import { ACT_TYPE_LABELS } from '@/types/act';

export function exportActToExcel(act: Act) {
  const rows: (string | number)[][] = [
    ['Акт выполненных услуг', ''],
    ['', ''],
    ['Партнёр', act.partner?.name ?? act.breakdown.partnerName],
    ['Тип', ACT_TYPE_LABELS[act.type]],
    ['Период', act.periodLabel ?? '—'],
    ['Дата формирования', new Date(act.createdAt).toLocaleDateString('ru-RU')],
    ['Сформировал', act.createdBy],
    ['', ''],
    ['№ заявки', 'Артикул', 'Наименование', 'Операция', 'Кол-во заявки', 'Тариф, ₽', 'Сумма, ₽'],
  ];

  for (const r of act.breakdown.requests) {
    for (const item of r.items) {
      if (item.operations.length === 0) {
        rows.push([r.requestNumber, item.article, item.name ?? '', '—', item.quantity, '', item.totalCost]);
        continue;
      }
      for (const op of item.operations) {
        rows.push([
          r.requestNumber,
          item.article,
          item.name ?? '',
          `${op.operationName}${op.unit ? ` (${op.unit})` : ''}`,
          item.quantity,
          op.tariff,
          op.amount,
        ]);
      }
    }
  }

  rows.push(['', '', '', '', '', 'Итого:', act.totalAmount]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Акт');

  const safePeriod = (act.periodLabel ?? act.id.toString()).replace(/[\/\\?*[\]]/g, '_');
  XLSX.writeFile(wb, `Акт_${safePeriod}.xlsx`);
}
