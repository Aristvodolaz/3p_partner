import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Eye,
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
import {
  Dialog,
  ConfirmDialog,
  PageHeader,
  Button,
  Input,
  Select,
  Field,
  Badge,
  statusTone,
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
  parseOutgoingDeliveryExcel,
  type OutgoingDeliveryParseResult,
} from '@/lib/importOutgoingDeliveryExcel';
import type { OutgoingDelivery, OutgoingDeliveryItem } from '@/types/outgoingDelivery';
import { outgoingTotal } from '@/types/outgoingDelivery';
import { formatDate, formatDateShort } from '@/lib/utils';
import type { Partner } from '@/types/partner';

export function OutgoingDeliveriesPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [shipTarget, setShipTarget] = useState<OutgoingDelivery | null>(null);
  const [viewTarget, setViewTarget] = useState<OutgoingDelivery | null>(null);
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
      <PageHeader
        title="Исходящие поставки (ИСП)"
        subtitle={data?.total ? `${data.total} заявок` : 'Нет заявок'}
        actions={
          <Button onClick={() => setImportOpen(true)}>
            <Plus size={16} />
            Загрузить ИСП
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
      </div>

      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Заявок нет"
          description="Загрузите Excel-файл ИСП или дождитесь авто-создания по КД из ВХП"
          action={
            <Button onClick={() => setImportOpen(true)}>
              <Plus size={16} />
              Загрузить ИСП
            </Button>
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>№ ИСП</TH>
              <TH>Партнёр</TH>
              <TH>Дата отгрузки</TH>
              <TH align="center">Позиций</TH>
              <TH align="right">Стоимость</TH>
              <TH>Статус</TH>
              <TH align="right">Действия</TH>
            </THead>
            <TBody>
              {deliveries.map((d) => {
                const total = outgoingTotal(d);
                return (
                  <TR key={d.id}>
                    <TD className="font-mono text-[13px] font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewTarget(d)}
                        className="text-gray-900 hover:text-primary hover:underline decoration-dotted underline-offset-2"
                        title="Просмотр позиций"
                      >
                        {d.number}
                      </button>
                      {d.isCrossDock && (
                        <span className="ml-2 text-xs text-amber-600 align-middle" title="Кросс-докинг">
                          КД
                        </span>
                      )}
                    </TD>
                    <TD className="text-gray-600">{d.partner.name}</TD>
                    <TD className="text-gray-500 whitespace-nowrap">
                      {d.shipDate ? formatDateShort(d.shipDate) : '—'}
                    </TD>
                    <TD align="center">{d.items.length}</TD>
                    <TD align="right" className="font-mono text-[13px] whitespace-nowrap">
                      {total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}
                    </TD>
                    <TD>
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    </TD>
                    <TD align="right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setViewTarget(d)} title="Просмотр позиций">
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setHistoryTarget(d)} title="История">
                          <History size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setOpsTarget(d)} title="Операции по позициям">
                          <ListTree size={14} />
                        </Button>
                        {d.status !== 'Выполнено' && d.status !== 'Отмена' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setShipTarget(d)} title="Отгрузка">
                              <Ship size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-amber-600 hover:bg-amber-50"
                              onClick={() => setCancelTarget(d)}
                              title="Отменить"
                            >
                              <Ban size={14} />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(d)}
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

      <OutgoingDeliveryImportDialog open={importOpen} onClose={() => setImportOpen(false)} partners={partners} />

      {viewTarget && <ViewDialog delivery={viewTarget} onClose={() => setViewTarget(null)} />}
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
          <Button type="button" className="mt-4">
            <Upload size={16} />
            Выбрать файл
          </Button>
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
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Выбрать другой файл
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Партнёр" required htmlFor="oexp-partner">
              <Select
                id="oexp-partner"
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
            <Field label="Склад отгрузки">
              <Input value={parsed.warehouseCode ?? '—'} readOnly className="bg-gray-50 text-gray-500" />
            </Field>
            <Field label="Дата отгрузки">
              <Input value={parsed.shipDate ?? '—'} readOnly className="bg-gray-50 text-gray-500" />
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
                </THead>
                <TBody>
                  {parsed.items.map((item, i) => (
                    <TR key={i}>
                      <TD className="font-mono text-xs">{item.article}</TD>
                      <TD>{item.name ?? '—'}</TD>
                      <TD align="center">{item.quantity}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </div>

          <p className="text-xs text-gray-400">
            Каждой позиции автоматически присвоятся операции по умолчанию из справочника SKU —
            изменить их состав можно после создания.
          </p>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={handleClose} disabled={create.isPending}>
              Отмена
            </Button>
            <Button onClick={handleCreate} loading={create.isPending}>
              Создать ИСП
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function ViewDialog({ delivery, onClose }: { delivery: OutgoingDelivery; onClose: () => void }) {
  const total = outgoingTotal(delivery);
  return (
    <Dialog open onClose={onClose} title={`Позиции — ${delivery.number}`} size="xl">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
          <span>
            Партнёр: <span className="text-gray-900">{delivery.partner.name}</span>
          </span>
          <span>
            Статус: <Badge tone={statusTone(delivery.status)}>{delivery.status}</Badge>
          </span>
          <span>
            Дата отгрузки:{' '}
            <span className="text-gray-900">
              {delivery.shipDate ? formatDateShort(delivery.shipDate) : '—'}
            </span>
          </span>
        </div>

        <TableContainer>
          <Table>
            <THead>
              <TH>Артикул</TH>
              <TH>Наименование</TH>
              <TH align="center">План</TH>
              <TH align="center">Факт</TH>
              <TH align="right">Цена/ед.</TH>
              <TH align="right">Стоимость</TH>
            </THead>
            <TBody>
              {delivery.items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-mono text-xs whitespace-nowrap">{item.article}</TD>
                  <TD>{item.name ?? '—'}</TD>
                  <TD align="center">{item.quantity}</TD>
                  <TD align="center">
                    {item.factQuantity != null ? (
                      item.factQuantity
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TD>
                  <TD align="right" className="text-gray-500">
                    {item.unitCost != null ? `${Number(item.unitCost).toLocaleString('ru-RU')} ₽` : '—'}
                  </TD>
                  <TD align="right" className="font-mono text-[13px]">
                    {item.totalCost != null ? `${Number(item.totalCost).toLocaleString('ru-RU')} ₽` : '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            Итого: {total > 0 ? `${total.toLocaleString('ru-RU')} ₽` : '—'}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
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
        <TableContainer>
          <Table>
            <THead>
              <TH>Артикул</TH>
              <TH>Наименование</TH>
              <TH align="center">План</TH>
              <TH align="center">Факт</TH>
            </THead>
            <TBody>
              {delivery.items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-mono text-xs">{item.article}</TD>
                  <TD>{item.name ?? '—'}</TD>
                  <TD align="center" className="text-gray-500">{item.quantity}</TD>
                  <TD align="center" className="w-28">
                    <Input
                      aria-label={`Факт по ${item.article}`}
                      value={facts[item.id] ?? ''}
                      onChange={(e) => setFacts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      inputMode="numeric"
                      className="text-center py-1"
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={ship.isPending}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} loading={ship.isPending}>
            Подтвердить отгрузку
          </Button>
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
                          <Input
                            aria-label={`Количество для ${op.name}`}
                            value={selected.get(op.code) ?? ''}
                            onChange={(e) =>
                              setSelected((prev) => new Map(prev).set(op.code, e.target.value))
                            }
                            className="w-20 text-center text-sm py-1"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="secondary" onClick={onClose} disabled={updateOps.isPending}>
                  Закрыть
                </Button>
                <Button onClick={handleSave} loading={updateOps.isPending}>
                  Сохранить и пересчитать
                </Button>
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
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : !history?.length ? (
        <p className="text-sm text-gray-400 py-8 text-center">Изменений ещё не было</p>
      ) : (
        <ol className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="flex items-start gap-3 text-sm">
              <Badge tone={statusTone(h.status)}>{h.status}</Badge>
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
