import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  FileSpreadsheet,
  History,
  ListTree,
  Package,
  Plus,
  Ship,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePartners } from '@/hooks/usePartners';
import { useOperations } from '@/hooks/useSkus';
import {
  useCancelOutgoingDelivery,
  useCreateOutgoingDelivery,
  useDeleteOutgoingDelivery,
  useOutgoingDeliveries,
  useOutgoingDeliveryHistory,
  useShipOutgoingDelivery,
  useUpdateItemOperations,
} from '@/hooks/useOutgoingDeliveries';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  parseOutgoingDeliveryExcel,
  type OutgoingDeliveryParseResult,
} from '@/lib/importOutgoingDeliveryExcel';
import type { OutgoingDelivery, OutgoingDeliveryItem } from '@/types/outgoingDelivery';
import { outgoingTotal } from '@/types/outgoingDelivery';
import { formatDate, formatDateShort } from '@/lib/utils';
import type { Partner } from '@/types/partner';

const STATUS_STYLES: Record<string, string> = {
  Создана: 'bg-gray-100 text-gray-600 ring-gray-500/10',
  Процесс: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  Выполнено: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  Отмена: 'bg-red-50 text-red-600 ring-red-600/15',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/10';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  );
}

export function OutgoingDeliveriesPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [shipTarget, setShipTarget] = useState<OutgoingDelivery | null>(null);
  const [opsTarget, setOpsTarget] = useState<OutgoingDelivery | null>(null);
  const [historyTarget, setHistoryTarget] = useState<OutgoingDelivery | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutgoingDelivery | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OutgoingDelivery | null>(null);

  const { data: partnersData } = usePartners();
  const { data, isLoading } = useOutgoingDeliveries({ partnerId });
  const deleteDelivery = useDeleteOutgoingDelivery();
  const cancelDelivery = useCancelOutgoingDelivery();

  const partners = partnersData?.data ?? [];
  const deliveries = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDelivery.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await cancelDelivery.mutateAsync(cancelTarget.id);
    setCancelTarget(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">Исходящие поставки (ИСП)</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ? `${data.total} заявок` : 'Нет заявок'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setImportOpen(true)}>
          <Plus size={16} />
          Загрузить ИСП
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={partnerId ?? ''}
          onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : undefined)}
          className="input sm:max-w-xs"
        >
          <option value="">Все партнёры</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Заявок нет</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Загрузите Excel-файл ИСП или дождитесь авто-создания по КД из ВХП
          </p>
          <button className="btn-primary" onClick={() => setImportOpen(true)}>
            <Plus size={16} />
            Загрузить ИСП
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">№ ИСП</th>
                  <th className="px-4 py-3 font-medium">Партнёр</th>
                  <th className="px-4 py-3 font-medium">Дата отгрузки</th>
                  <th className="px-4 py-3 font-medium text-center">Позиций</th>
                  <th className="px-4 py-3 font-medium text-right">Стоимость</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((d) => {
                  const total = outgoingTotal(d);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[13px] font-medium text-gray-900 whitespace-nowrap">
                        {d.number}
                        {d.isCrossDock && (
                          <span className="ml-2 text-xs text-amber-600 align-middle" title="Кросс-докинг">КД</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{d.partner.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {d.shipDate ? formatDateShort(d.shipDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">{d.items.length}</td>
                      <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums whitespace-nowrap">
                        {total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button className="btn-ghost text-xs p-2" onClick={() => setHistoryTarget(d)} title="История">
                            <History size={14} />
                          </button>
                          <button className="btn-ghost text-xs p-2" onClick={() => setOpsTarget(d)} title="Операции по позициям">
                            <ListTree size={14} />
                          </button>
                          {d.status !== 'Выполнено' && d.status !== 'Отмена' && (
                            <>
                              <button className="btn-ghost text-xs p-2" onClick={() => setShipTarget(d)} title="Отгрузка">
                                <Ship size={14} />
                              </button>
                              <button
                                className="btn-ghost text-xs p-2 text-amber-600 hover:bg-amber-50"
                                onClick={() => setCancelTarget(d)}
                                title="Отменить"
                              >
                                <Ban size={14} />
                              </button>
                            </>
                          )}
                          <button
                            className="btn-ghost text-xs p-2 text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteTarget(d)}
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OutgoingDeliveryImportDialog open={importOpen} onClose={() => setImportOpen(false)} partners={partners} />

      {shipTarget && <ShipDialog delivery={shipTarget} onClose={() => setShipTarget(null)} />}
      {opsTarget && <OperationsDialog delivery={opsTarget} onClose={() => setOpsTarget(null)} />}
      {historyTarget && <HistoryDialog delivery={historyTarget} onClose={() => setHistoryTarget(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить ИСП?"
        description={`Заявка «${deleteTarget?.number}» и все её позиции будут удалены.`}
        confirmLabel="Удалить"
        danger
        loading={deleteDelivery.isPending}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Отменить ИСП?"
        description={`Заявка «${cancelTarget?.number}» перейдёт в статус «Отмена».`}
        confirmLabel="Отменить заявку"
        danger
        loading={cancelDelivery.isPending}
      />
    </div>
  );
}

function OutgoingDeliveryImportDialog({
  open,
  onClose,
  partners,
}: {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<OutgoingDeliveryParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const create = useCreateOutgoingDelivery();

  const reset = () => {
    setParsed(null);
    setFileName('');
    setPartnerId('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const result = parseOutgoingDeliveryExcel(await file.arrayBuffer());
      if (!result.items.length) {
        toast.error('В файле не найдено ни одной позиции');
        return;
      }
      setParsed(result);
      setFileName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось прочитать файл');
    }
  };

  const handleCreate = async () => {
    if (!parsed || !partnerId) {
      toast.error('Выберите партнёра');
      return;
    }
    await create.mutateAsync({
      partnerId: Number(partnerId),
      warehouseCode: parsed.warehouseCode,
      isCrossDock: parsed.isCrossDock,
      shipDate: parsed.shipDate,
      items: parsed.items,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Загрузка ИСП" size="xl">
      {!parsed ? (
        <div
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={40} className="text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">Выберите файл «Заявка на исходящую поставку»</p>
          <p className="text-xs text-gray-400 mt-1">Артикул, наименование, количество, вес, объём</p>
          <button type="button" className="btn-primary mt-4">
            <Upload size={16} />
            Выбрать файл
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileSpreadsheet size={18} className="text-green-600" />
              <span className="font-medium">{fileName}</span>
              <span className="text-gray-400">— {parsed.items.length} позиций</span>
            </div>
            <button type="button" className="btn-ghost text-xs" onClick={reset}>
              Выбрать другой файл
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Партнёр *</label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
                className="input"
              >
                <option value="">Выберите...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Склад отгрузки</label>
              <input value={parsed.warehouseCode ?? '—'} readOnly className="input bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="label">Дата отгрузки</label>
              <input value={parsed.shipDate ?? '—'} readOnly className="input bg-gray-50 text-gray-500" />
            </div>
          </div>

          {parsed.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                <AlertTriangle size={14} />
                Предупреждения
              </div>
              <ul className="text-xs text-amber-600 list-disc pl-5 space-y-0.5 max-h-24 overflow-y-auto">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-60 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-3 py-2 font-medium">Артикул</th>
                    <th className="px-3 py-2 font-medium">Наименование</th>
                    <th className="px-3 py-2 font-medium text-center">Кол-во</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsed.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-xs">{item.article}</td>
                      <td className="px-3 py-2">{item.name ?? '—'}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Каждой позиции автоматически присвоятся операции по умолчанию из справочника SKU —
            изменить их состав можно после создания.
          </p>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={create.isPending}>
              Отмена
            </button>
            <button type="button" className="btn-primary" onClick={handleCreate} disabled={create.isPending}>
              {create.isPending ? 'Создание...' : 'Создать ИСП'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function ShipDialog({ delivery, onClose }: { delivery: OutgoingDelivery; onClose: () => void }) {
  const [facts, setFacts] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      delivery.items.map((i) => [i.id, i.factQuantity != null ? String(i.factQuantity) : String(i.quantity)]),
    ),
  );
  const ship = useShipOutgoingDelivery(delivery.id);

  const handleSubmit = async () => {
    const items = Object.entries(facts)
      .map(([itemId, v]) => ({ itemId: Number(itemId), factQuantity: Number(v) }))
      .filter((i) => Number.isFinite(i.factQuantity) && i.factQuantity >= 0);
    if (!items.length) {
      toast.error('Укажите фактическое количество хотя бы по одной позиции');
      return;
    }
    await ship.mutateAsync(items);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={`Отгрузка — ${delivery.number}`} size="lg">
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">Артикул</th>
                <th className="px-3 py-2 font-medium">Наименование</th>
                <th className="px-3 py-2 font-medium text-center">План</th>
                <th className="px-3 py-2 font-medium text-center w-28">Факт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {delivery.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-mono text-xs">{item.article}</td>
                  <td className="px-3 py-2">{item.name ?? '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{item.quantity}</td>
                  <td className="px-3 py-2">
                    <input
                      value={facts[item.id] ?? ''}
                      onChange={(e) => setFacts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      inputMode="numeric"
                      className="input text-center py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={ship.isPending}>
            Отмена
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={ship.isPending}>
            {ship.isPending ? 'Сохранение...' : 'Подтвердить отгрузку'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function OperationsDialog({ delivery, onClose }: { delivery: OutgoingDelivery; onClose: () => void }) {
  const [activeItem, setActiveItem] = useState<OutgoingDeliveryItem | null>(delivery.items[0] ?? null);
  const { data: operations = [] } = useOperations();
  const updateOps = useUpdateItemOperations();

  const [selected, setSelected] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    activeItem?.operations.forEach((o) => map.set(o.operation.code, o.value ?? '1'));
    return map;
  });

  const selectItem = (item: OutgoingDeliveryItem) => {
    setActiveItem(item);
    const map = new Map<string, string>();
    item.operations.forEach((o) => map.set(o.operation.code, o.value ?? '1'));
    setSelected(map);
  };

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(code)) next.delete(code);
      else next.set(code, '1');
      return next;
    });
  };

  const handleSave = async () => {
    if (!activeItem) return;
    await updateOps.mutateAsync({
      itemId: activeItem.id,
      operations: Array.from(selected.entries()).map(([code, value]) => ({ code, value })),
    });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={`Операции по позициям — ${delivery.number}`} size="xl">
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {delivery.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item)}
              className={`w-full text-left px-3 py-2 text-sm ${activeItem?.id === item.id ? 'bg-primary-50 text-primary font-medium' : 'hover:bg-gray-50'}`}
            >
              {item.article}
              <div className="text-xs text-gray-400">{item.name ?? '—'}</div>
            </button>
          ))}
        </div>
        <div>
          {activeItem && (
            <>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {operations
                  .filter((op) => op.phase !== 'INCOMING')
                  .map((op) => {
                    const checked = selected.has(op.code);
                    return (
                      <div key={op.code} className="flex items-center gap-3 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(op.code)}
                          className="rounded border-gray-300 text-primary focus:ring-primary-500"
                        />
                        <label className="flex-1 text-sm text-gray-700 cursor-pointer" onClick={() => toggle(op.code)}>
                          {op.name}
                        </label>
                        {checked && (
                          <input
                            value={selected.get(op.code) ?? ''}
                            onChange={(e) =>
                              setSelected((prev) => new Map(prev).set(op.code, e.target.value))
                            }
                            className="input w-20 text-center text-sm py-1"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={updateOps.isPending}>
                  Закрыть
                </button>
                <button type="button" className="btn-primary" onClick={handleSave} disabled={updateOps.isPending}>
                  {updateOps.isPending ? 'Сохранение...' : 'Сохранить и пересчитать'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function HistoryDialog({ delivery, onClose }: { delivery: OutgoingDelivery; onClose: () => void }) {
  const { data: history, isLoading } = useOutgoingDeliveryHistory(delivery.id);

  return (
    <Dialog open onClose={onClose} title={`История статусов — ${delivery.number}`} size="sm">
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ) : !history?.length ? (
        <p className="text-sm text-gray-400 py-8 text-center">Изменений ещё не было</p>
      ) : (
        <ol className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="flex items-start gap-3 text-sm">
              <StatusBadge status={h.status} />
              <div className="min-w-0">
                <p className="text-gray-700">{h.changedBy}</p>
                <p className="text-xs text-gray-400">{formatDate(h.changedAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
