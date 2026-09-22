import type { PartnerRequest } from '@/types/request';
import { formatDateShort } from './utils';

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

/**
 * Печатная форма предварительной стоимости — не jsPDF (кириллица требует
 * отдельно встраивать шрифт), а обычное окно печати браузера: пользователь
 * сохраняет как PDF через системный диалог печати, текст остаётся чётким
 * и выделяемым.
 */
export function exportRequestPreliminaryCostPdf(request: PartnerRequest) {
  const rowsHtml = request.items
    .map((item) => {
      const unit = item.unitCost != null ? Number(item.unitCost) : null;
      const total = item.totalCost != null ? Number(item.totalCost) : null;
      return `<tr>
        <td>${escapeHtml(item.article)}</td>
        <td>${escapeHtml(item.name ?? '—')}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${unit != null ? `${unit.toLocaleString('ru-RU')} ₽` : '—'}</td>
        <td class="num">${total != null ? `${total.toLocaleString('ru-RU')} ₽` : '—'}</td>
      </tr>`;
    })
    .join('');

  const total = request.items.reduce(
    (sum, item) => sum + (item.totalCost != null ? Number(item.totalCost) : 0),
    0,
  );

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Предв. стоимость — ${escapeHtml(request.number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1B1815; padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #5A5443; font-size: 13px; margin-bottom: 24px; }
  .meta span { margin-right: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #E4E0D4; text-align: left; }
  th { background: #FAF9F6; color: #5A5443; font-weight: 600; font-size: 12px; }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tfoot td { border-top: 2px solid #1B1815; border-bottom: none; font-weight: 700; font-size: 14px; padding-top: 12px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Предварительная стоимость обработки</h1>
  <div class="meta">
    <span>№ заявки: <strong>${escapeHtml(request.number)}</strong></span>
    <span>Партнёр: <strong>${escapeHtml(request.partner.name)}</strong></span>
    <span>Дата заявки: <strong>${request.requestDate ? formatDateShort(request.requestDate) : '—'}</strong></span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Артикул</th>
        <th>Наименование</th>
        <th class="num">Кол-во</th>
        <th class="num">Цена за ед.</th>
        <th class="num">Сумма</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">Итого</td>
        <td class="num">${total.toLocaleString('ru-RU')} ₽</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  // Печать через скрытый iframe, а не window.open: во многих браузерах и
  // корпоративных политиках всплывающие окна блокируются даже по прямому
  // клику пользователя, а iframe для этого не требует ничьего разрешения.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    document.body.removeChild(iframe);
    throw new Error('Не удалось подготовить документ для печати');
  }
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  // Небольшая задержка перед печатью — чтобы контент/стили в iframe успели
  // отрисоваться до вызова диалога печати.
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  }, 250);
}
