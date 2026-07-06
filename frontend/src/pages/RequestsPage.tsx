import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  ClipboardList,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePartners } from '@/hooks/usePartners';
import {
  useCreateRequest,
  useDeleteRequest,
  useRecalculateRequest,
  useRequests,
  useUpdateRequest,
} from '@/hooks/useRequests';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  parseRequestExcel,
  type RequestParseResult,
} from '@/lib/importRequestExcel';
import type {
  PartnerRequest,
  RequestItemInput,
} from '@/types/request';
import { hasUnknownArticles, REQUEST_STATUSES, requestTotal } from '@/types/request';
import { formatDateShort } from '@/lib/utils';
import type { Partner } from '@/types/partner';

export function RequestsPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<PartnerRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerRequest | null>(null);

  const { data: partnersData } = usePartners();
  const { data, isLoading } = useRequests({
    partnerId,
    search: search || undefined,
  });

  const deleteRequest = useDeleteRequest();
  const recalc = useRecalculateRequest();

  const partners = partnersData?.data ?? [];
  const requests = data?.data ?? [];

  // Свежая версия редактируемой заявки из кэша
  const editRequestFresh = useMemo(
    () =>
      editRequest
        ? requests.find((r) => r.id === editRequest.id) ?? editRequest
        : null,
    [requests, editRequest],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRequest.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заявки партнёров</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total
              ? `${data.total} заяв${data.total === 1 ? 'ка' : data.total < 5 ? 'ки' : 'ок'}`
              : 'Нет заявок'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setImportOpen(true)}>
          <Plus size={16} />
          Загрузить заявку
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={partnerId ?? ''}
          onChange={(e) =>
            setPartnerId(e.target.value ? Number(e.target.value) : undefined)
          }
          className="input sm:max-w-xs"
        >
          <option value="">Все партнёры</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Поиск по номеру, артикулу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Заявок нет</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Загрузите Excel-заявку, поступившую от партнёра
          </p>
          <button className="btn-primary" onClick={() => setImportOpen(true)}>
            <Plus size={16} />
            Загрузить заявку
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">№ заявки</th>
                  <th className="px-4 py-3 font-medium">Партнёр</th>
                  <th className="px-4 py-3 font-medium">Дата заявки</th>
                  <th className="px-4 py-3 font-medium text-center">Позиций</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Предв. стоимость
                  </th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => {
                  const total = requestTotal(req);
                  const unknown = hasUnknownArticles(req);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {req.number}
                        {unknown && (
                          <span
                            className="inline-flex ml-2 text-amber-500 align-middle"
                            title="Есть артикулы, не найденные в справочнике SKU"
                          >
                            <AlertTriangle size={14} />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{req.partner.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {req.requestDate ? formatDateShort(req.requestDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">{req.items.length}</td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                        {total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button
                            className="btn-ghost text-xs p-2"
                            onClick={() => recalc.mutate(req.id)}
                            title="Пересчитать стоимость"
                            disabled={recalc.isPending}
                          >
                            <Calculator size={14} />
                          </button>
                          <button
                            className="btn-ghost text-xs p-2"
                            onClick={() => setEditRequest(req)}
                            title="Открыть / редактировать"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-ghost text-xs p-2 text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteTarget(req)}
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

      <RequestImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        partners={partners}
      />

      {editRequestFresh && (
        <RequestEditDialog
          request={editRequestFresh}
          onClose={() => setEditRequest(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить заявку?"
        description={`Заявка «${deleteTarget?.number}» и все её позиции будут удалены.`}
        confirmLabel="Удалить"
        danger
        loading={deleteRequest.isPending}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Выполнена'
      ? 'bg-green-50 text-green-700'
      : status === 'В обработке'
        ? 'bg-blue-50 text-blue-700'
        : status === 'Отменена'
          ? 'bg-red-50 text-red-600'
          : 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}

function RequestImportDialog({
  open,
  onClose,
  partners,
}: {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<RequestParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const [number, setNumber] = useState('');
  const create = useCreateRequest();

  const reset = () => {
    setParsed(null);
    setFileName('');
    setPartnerId('');
    setNumber('');
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
      const result = parseRequestExcel(await file.arrayBuffer());
      if (!result.items.length) {
        toast.error('В файле не найдено ни одной позиции');
        return;
      }
      setParsed(result);
      setFileName(file.name);
      // Подбор партнёра по наименованию заказчика из шапки
      if (result.customerName) {
        const found = partners.find(
          (p) =>
            p.name.toLowerCase().includes(result.customerName!.toLowerCase()) ||
            result.customerName!.toLowerCase().includes(p.name.toLowerCase()),
        );
        if (found) setPartnerId(found.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось прочитать файл');
    }
  };

  const handleCreate = async () => {
    if (!parsed || !partnerId) {
      toast.error('Выберите партнёра');
      return;
    }
    if (!number.trim()) {
      toast.error('Укажите номер заявки');
      return;
    }
    await create.mutateAsync({
      partnerId: Number(partnerId),
      number: number.trim(),
      requestDate: parsed.requestDate,
      items: parsed.items,
    });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Загрузка заявки от партнёра"
      size="xl"
    >
      {!parsed ? (
        <div
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={40} className="text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Выберите файл «Заявка на поставку и обработку (3PL)»
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Артикул, наименование, количество, дата поступления, срок обработки
          </p>
          <button type="button" className="btn-primary mt-4">
            <Upload size={16} />
            Выбрать файл
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
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
                onChange={(e) =>
                  setPartnerId(e.target.value ? Number(e.target.value) : '')
                }
                className="input"
              >
                <option value="">Выберите...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {parsed.customerName && (
                <p className="mt-1 text-xs text-gray-400">
                  Заказчик в файле: {parsed.customerName}
                </p>
              )}
            </div>
            <div>
              <label className="label">№ заявки (вручную) *</label>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="2000058118022"
                className="input"
              />
            </div>
            <div>
              <label className="label">Дата заявки</label>
              <input
                value={parsed.requestDate ?? '—'}
                readOnly
                className="input bg-gray-50 text-gray-500"
              />
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
                    <th className="px-3 py-2 font-medium">Поступление</th>
                    <th className="px-3 py-2 font-medium">Обработать до</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsed.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-xs">{item.article}</td>
                      <td className="px-3 py-2">{item.name ?? '—'}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {item.arrivalDate ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {item.shipmentDate ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Предварительная стоимость обработки будет рассчитана автоматически по
            операциям из справочника SKU и тарифам партнёра.
          </p>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={create.isPending}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreate}
              disabled={create.isPending}
            >
              {create.isPending ? 'Создание...' : 'Создать заявку'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

interface EditableItem extends RequestItemInput {
  unitCost?: string | null;
  totalCost?: string | null;
  skuFound?: boolean;
}

function RequestEditDialog({
  request,
  onClose,
}: {
  request: PartnerRequest;
  onClose: () => void;
}) {
  const [number, setNumber] = useState(request.number);
  const [status, setStatus] = useState(request.status);
  const [comment, setComment] = useState(request.comment ?? '');
  const [items, setItems] = useState<EditableItem[]>(() =>
    request.items.map((item) => ({
      article: item.article,
      name: item.name ?? undefined,
      quantity: item.quantity,
      arrivalDate: item.arrivalDate?.slice(0, 10),
      shipmentDate: item.shipmentDate?.slice(0, 10),
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      skuFound: item.skuId !== null,
    })),
  );

  const update = useUpdateRequest(request.id);

  const setItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const total = items.reduce(
    (sum, it) => sum + (it.totalCost != null ? Number(it.totalCost) : 0),
    0,
  );

  const handleSave = async () => {
    if (!number.trim()) {
      toast.error('Номер заявки обязателен');
      return;
    }
    const bad = items.find((it) => !it.article.trim() || !it.quantity || it.quantity < 1);
    if (bad) {
      toast.error('У всех позиций должны быть артикул и количество');
      return;
    }
    await update.mutateAsync({
      number: number.trim(),
      status,
      comment: comment || undefined,
      items: items.map((it) => ({
        article: it.article.trim(),
        name: it.name?.trim() || undefined,
        quantity: it.quantity,
        arrivalDate: it.arrivalDate || undefined,
        shipmentDate: it.shipmentDate || undefined,
      })),
    });
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Заявка ${request.number} — ${request.partner.name}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">№ заявки</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input"
            >
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Дата заявки</label>
            <input
              value={request.requestDate ? formatDateShort(request.requestDate) : '—'}
              readOnly
              className="input bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="label">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="input resize-none"
            placeholder="Примечания к заявке..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Позиции ({items.length})</label>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() =>
                setItems((prev) => [...prev, { article: '', quantity: 1 }])
              }
            >
              <Plus size={14} />
              Добавить позицию
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-2 py-2 font-medium">Артикул</th>
                    <th className="px-2 py-2 font-medium">Наименование</th>
                    <th className="px-2 py-2 font-medium w-20">Кол-во</th>
                    <th className="px-2 py-2 font-medium">Поступление</th>
                    <th className="px-2 py-2 font-medium">Обработать до</th>
                    <th className="px-2 py-2 font-medium text-right">Стоимость</th>
                    <th className="px-2 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input
                          value={item.article}
                          onChange={(e) => setItem(i, { article: e.target.value })}
                          className={`input text-xs py-1 font-mono w-28 ${item.skuFound === false ? 'border-amber-300 bg-amber-50' : ''}`}
                          title={item.skuFound === false ? 'Артикул не найден в справочнике SKU' : undefined}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={item.name ?? ''}
                          onChange={(e) => setItem(i, { name: e.target.value })}
                          className="input text-xs py-1 w-full min-w-32"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={item.quantity || ''}
                          onChange={(e) =>
                            setItem(i, { quantity: Number(e.target.value) || 0 })
                          }
                          inputMode="numeric"
                          className="input text-xs py-1 w-16 text-center"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={item.arrivalDate ?? ''}
                          onChange={(e) => setItem(i, { arrivalDate: e.target.value })}
                          className="input text-xs py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={item.shipmentDate ?? ''}
                          onChange={(e) => setItem(i, { shipmentDate: e.target.value })}
                          className="input text-xs py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap text-xs">
                        {item.totalCost != null ? (
                          <>
                            {Number(item.totalCost).toLocaleString('ru-RU')} ₽
                            <div className="text-gray-400">
                              {Number(item.unitCost).toLocaleString('ru-RU')} ₽/ед.
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() =>
                            setItems((prev) => prev.filter((_, j) => j !== i))
                          }
                          title="Убрать позицию"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-xs text-gray-400">
                Стоимость пересчитается автоматически после сохранения
              </span>
              <span className="font-semibold">
                Итого: {total.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={update.isPending}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={update.isPending}
          >
            {update.isPending ? 'Сохранение...' : 'Сохранить заявку'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
