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
import {
  Dialog,
  ConfirmDialog,
  PageHeader,
  Button,
  Input,
  Select,
  Textarea,
  Field,
  Badge,
  SearchInput,
  EmptyState,
  Skeleton,
  TableContainer,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from '@/components/ui';
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
import { exportRequestPreliminaryCostPdf } from '@/lib/exportRequestPdf';
import type { Partner } from '@/types/partner';
import { usePackingUnits } from '@/hooks/usePacking';

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
      <PageHeader
        title="Заявки партнёров"
        subtitle={
          data?.total
            ? `${data.total} заяв${data.total === 1 ? 'ка' : data.total < 5 ? 'ки' : 'ок'}`
            : 'Нет заявок'
        }
        actions={
          <Button onClick={() => setImportOpen(true)}>
            <Plus size={16} />
            Загрузить заявку
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          aria-label="Партнёр"
          value={partnerId ?? ''}
          onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : undefined)}
          className="sm:max-w-xs"
        >
          <option value="">Все партнёры</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по номеру, артикулу..." />
      </div>

      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Заявок нет"
          description="Загрузите Excel-заявку, поступившую от партнёра"
          action={
            <Button onClick={() => setImportOpen(true)}>
              <Plus size={16} />
              Загрузить заявку
            </Button>
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>№ заявки</TH>
              <TH>Партнёр</TH>
              <TH>Дата заявки</TH>
              <TH align="center">Позиций</TH>
              <TH align="right">Предв. стоимость</TH>
              <TH>Статус</TH>
              <TH align="right">Действия</TH>
            </THead>
            <TBody>
              {requests.map((req) => {
                const total = requestTotal(req);
                const unknown = hasUnknownArticles(req);
                return (
                  <TR key={req.id}>
                    <TD className="font-mono text-[13px] font-medium text-gray-900 whitespace-nowrap">
                      {req.number}
                      {unknown && (
                        <span
                          className="inline-flex ml-2 text-amber-500 align-middle"
                          title="Есть артикулы, не найденные в справочнике SKU"
                        >
                          <AlertTriangle size={14} />
                        </span>
                      )}
                    </TD>
                    <TD className="text-gray-600">{req.partner.name}</TD>
                    <TD className="text-gray-500 whitespace-nowrap">
                      {req.requestDate ? formatDateShort(req.requestDate) : '—'}
                    </TD>
                    <TD align="center">{req.items.length}</TD>
                    <TD
                      align="right"
                      className="font-mono text-[13px] font-medium whitespace-nowrap cursor-pointer text-primary hover:underline decoration-dotted underline-offset-2"
                      onClick={() => {
                        try {
                          exportRequestPreliminaryCostPdf(req);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Не удалось сформировать PDF');
                        }
                      }}
                      title="Скачать предварительную стоимость (PDF)"
                    >
                      {total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}
                    </TD>
                    <TD>
                      <StatusBadge status={req.status} />
                    </TD>
                    <TD align="right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => recalc.mutate(req.id)}
                          title="Пересчитать стоимость"
                          disabled={recalc.isPending}
                        >
                          <Calculator size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditRequest(req)} title="Открыть / редактировать">
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(req)}
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </TableContainer>
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

// У заявок свой набор статусов (шире, чем у ВХП/ИСП) — соответствует
// RequestStatus.colorHex в мобильном приложении (core:model/Models.kt),
// поэтому маппинг локальный, а не общий statusTone.
const REQUEST_STATUS_TONE: Record<string, NonNullable<Parameters<typeof Badge>[0]['tone']>> = {
  Запланировано: 'gray',
  Приёмка: 'primary',
  Хранение: 'blue',
  'В работе': 'blue',
  Готово: 'green',
  Отгружено: 'green',
  Закрыто: 'gray',
  Дефект: 'red',
};

function StatusBadge({ status }: { status: string }) {
  return <Badge tone={REQUEST_STATUS_TONE[status] ?? 'gray'}>{status}</Badge>;
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
          <Button type="button" className="mt-4">
            <Upload size={16} />
            Выбрать файл
          </Button>
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
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Выбрать другой файл
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Партнёр"
              required
              htmlFor="req-partner"
              hint={parsed.customerName ? `Заказчик в файле: ${parsed.customerName}` : undefined}
            >
              <Select
                id="req-partner"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Выберите...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="№ заявки (вручную)" required htmlFor="req-number">
              <Input
                id="req-number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="2000058118022"
              />
            </Field>
            <Field label="Дата заявки">
              <Input value={parsed.requestDate ?? '—'} readOnly className="bg-gray-50 text-gray-500" />
            </Field>
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

          <div className="max-h-60 overflow-auto">
            <TableContainer>
              <Table>
                <THead>
                  <TH>Артикул</TH>
                  <TH>Наименование</TH>
                  <TH align="center">Кол-во</TH>
                  <TH>Поступление</TH>
                  <TH>Обработать до</TH>
                </THead>
                <TBody>
                  {parsed.items.map((item, i) => (
                    <TR key={i}>
                      <TD className="font-mono text-xs">{item.article}</TD>
                      <TD>{item.name ?? '—'}</TD>
                      <TD align="center">{item.quantity}</TD>
                      <TD className="text-xs text-gray-500">{item.arrivalDate ?? '—'}</TD>
                      <TD className="text-xs text-gray-500">{item.shipmentDate ?? '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </div>

          <p className="text-xs text-gray-400">
            Предварительная стоимость обработки будет рассчитана автоматически по
            операциям из справочника SKU и тарифам партнёра.
          </p>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={handleClose} disabled={create.isPending}>
              Отмена
            </Button>
            <Button onClick={handleCreate} loading={create.isPending}>
              Создать заявку
            </Button>
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
      id: item.id,
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
        id: it.id,
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
          <Field label="№ заявки" htmlFor="edit-req-number">
            <Input id="edit-req-number" value={number} onChange={(e) => setNumber(e.target.value)} />
          </Field>
          <Field label="Статус" htmlFor="edit-req-status">
            <Select id="edit-req-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Дата заявки">
            <Input
              value={request.requestDate ? formatDateShort(request.requestDate) : '—'}
              readOnly
              className="bg-gray-50 text-gray-500"
            />
          </Field>
        </div>

        <Field label="Комментарий" htmlFor="edit-req-comment">
          <Textarea
            id="edit-req-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Примечания к заявке..."
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Позиции ({items.length})</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems((prev) => [...prev, { article: '', quantity: 1 }])}
            >
              <Plus size={14} />
              Добавить позицию
            </Button>
          </div>
          <div className="max-h-72 overflow-auto">
            <TableContainer>
              <Table>
                <THead>
                  <TH>Артикул</TH>
                  <TH>Наименование</TH>
                  <TH className="w-20">Кол-во</TH>
                  <TH>Поступление</TH>
                  <TH>Обработать до</TH>
                  <TH align="right">Стоимость</TH>
                  <TH className="w-8" />
                </THead>
                <TBody>
                  {items.map((item, i) => (
                    <TR key={i}>
                      <TD>
                        <Input
                          aria-label={`Артикул позиции ${i + 1}`}
                          value={item.article}
                          onChange={(e) => setItem(i, { article: e.target.value })}
                          error={item.skuFound === false}
                          className="text-xs py-1 font-mono w-28"
                          title={item.skuFound === false ? 'Артикул не найден в справочнике SKU' : undefined}
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label={`Наименование позиции ${i + 1}`}
                          value={item.name ?? ''}
                          onChange={(e) => setItem(i, { name: e.target.value })}
                          className="text-xs py-1 w-full min-w-32"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label={`Количество позиции ${i + 1}`}
                          value={item.quantity || ''}
                          onChange={(e) => setItem(i, { quantity: Number(e.target.value) || 0 })}
                          inputMode="numeric"
                          className="text-xs py-1 w-16 text-center"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label={`Дата поступления позиции ${i + 1}`}
                          type="date"
                          value={item.arrivalDate ?? ''}
                          onChange={(e) => setItem(i, { arrivalDate: e.target.value })}
                          className="text-xs py-1"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label={`Обработать до позиции ${i + 1}`}
                          type="date"
                          value={item.shipmentDate ?? ''}
                          onChange={(e) => setItem(i, { shipmentDate: e.target.value })}
                          className="text-xs py-1"
                        />
                      </TD>
                      <TD align="right" className="whitespace-nowrap text-xs">
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
                      </TD>
                      <TD>
                        <button
                          type="button"
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                          title="Убрать позицию"
                          aria-label={`Убрать позицию ${i + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-xs text-gray-400">
                Стоимость пересчитается автоматически после сохранения
              </span>
              <span className="font-semibold">Итого: {total.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </div>

        <PackingUnitsSection requestId={request.id} />

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Отмена
          </Button>
          <Button onClick={handleSave} loading={update.isPending}>
            Сохранить заявку
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Только просмотр — паллеты/короба создаются на мобильном приложении (пол склада) */
function PackingUnitsSection({ requestId }: { requestId: number }) {
  const { data: units, isLoading } = usePackingUnits(requestId);

  if (isLoading || !units || units.length === 0) return null;

  return (
    <div className="border-t border-gray-100 pt-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        Упаковка: паллеты и короба ({units.length})
      </h4>
      <div className="space-y-2">
        {units.map((u) => (
          <div key={u.id} className="card p-2.5 text-xs flex items-start justify-between gap-3">
            <div>
              <span className="font-medium text-gray-800">
                {u.type === 'PALLET' ? 'Паллета' : 'Короб'} · {u.code}
              </span>
              {u.parentPalletId && (
                <span className="text-gray-400 ml-2">→ паллета #{u.parentPalletId}</span>
              )}
              <div className="text-gray-500 mt-0.5">
                {u.items.map((i) => `${i.article}: ${i.quantity} шт.`).join(', ') || 'позиции не добавлены'}
              </div>
              {u.expiryDate && (
                <div className="text-gray-400">Срок годности: {formatDateShort(u.expiryDate)}</div>
              )}
            </div>
            <Badge tone={u.status === 'COMPLETED' ? 'green' : 'gray'} className="whitespace-nowrap">
              {u.status === 'COMPLETED' ? 'Завершена' : 'В работе'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
