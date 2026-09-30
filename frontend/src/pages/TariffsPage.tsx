import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Coins,
  FileSpreadsheet,
  History,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePartners } from '@/hooks/usePartners';
import {
  useCoefficients,
  useCreateOperation,
  useDeleteOperation,
  useDeletePartnerTariffs,
  useImportTariffs,
  useOperations,
  usePartnerTariffs,
  useSetPartnerTariffs,
  useTariffHistory,
  useUpdateOperation,
} from '@/hooks/useSkus';
import {
  Dialog,
  ConfirmDialog,
  PageHeader,
  Button,
  Input,
  Select,
  Textarea,
  Field,
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
import { parseTariffsExcel, type TariffParseResult } from '@/lib/importTariffsExcel';
import { formatDateShort } from '@/lib/utils';
import type { Operation } from '@/types/sku';

export function TariffsPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [createOpOpen, setCreateOpOpen] = useState(false);
  const [deleteOpTarget, setDeleteOpTarget] = useState<Operation | null>(null);

  // Черновики правок: тарифы (code → строка), описания и этап (opId → строка)
  const [tariffDraft, setTariffDraft] = useState<Record<string, string>>({});
  const [descDraft, setDescDraft] = useState<Record<number, string>>({});
  const [phaseDraft, setPhaseDraft] = useState<Record<number, 'INCOMING' | 'OUTGOING' | 'BOTH'>>({});

  const { data: partnersData } = usePartners();
  const { data: operations = [] } = useOperations();
  const { data: tariffs } = usePartnerTariffs(partnerId);
  const { data: coefficients = [] } = useCoefficients();

  const setTariffs = useSetPartnerTariffs(partnerId ?? 0);
  const deleteTariffs = useDeletePartnerTariffs();
  const updateOperation = useUpdateOperation();
  const createOperation = useCreateOperation();
  const deleteOperation = useDeleteOperation();

  const partners = partnersData?.data ?? [];
  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === partnerId),
    [partners, partnerId],
  );

  const tariffByCode = useMemo(
    () => new Map(tariffs?.map((t) => [t.operation.code, t.tariff]) ?? []),
    [tariffs],
  );

  // Сброс черновиков при смене партнёра / приходе данных
  useEffect(() => {
    setTariffDraft({});
    setDescDraft({});
    setPhaseDraft({});
  }, [partnerId, tariffs]);

  const dirtyTariffs = Object.entries(tariffDraft).filter(([code, v]) => {
    const current = tariffByCode.get(code) ?? '';
    return v.trim() !== '' && v.replace(',', '.') !== String(current);
  });
  const dirtyDescs = Object.entries(descDraft).filter(([id, v]) => {
    const op = operations.find((o) => o.id === Number(id));
    return op && v !== (op.description ?? '');
  });
  const dirtyPhases = Object.entries(phaseDraft).filter(([id, v]) => {
    const op = operations.find((o) => o.id === Number(id));
    return op && v !== op.phase;
  });
  const hasChanges = dirtyTariffs.length > 0 || dirtyDescs.length > 0 || dirtyPhases.length > 0;

  const handleSave = async () => {
    if (!partnerId) return;
    // Тарифы
    if (dirtyTariffs.length) {
      const payload = dirtyTariffs
        .map(([code, v]) => ({ code, tariff: Number(v.replace(',', '.')) }))
        .filter((t) => Number.isFinite(t.tariff) && t.tariff >= 0);
      if (payload.length !== dirtyTariffs.length) {
        toast.error('Некорректное значение тарифа');
        return;
      }
      await setTariffs.mutateAsync(payload);
    }
    // Описания операций
    for (const [id, description] of dirtyDescs) {
      await updateOperation.mutateAsync({ id: Number(id), description });
    }
    // Этап (приёмка/отгрузка/обе)
    for (const [id, phase] of dirtyPhases) {
      await updateOperation.mutateAsync({ id: Number(id), phase });
    }
    setTariffDraft({});
    setDescDraft({});
    setPhaseDraft({});
  };

  const handleClear = async () => {
    if (!partnerId) return;
    await deleteTariffs.mutateAsync(partnerId);
    setClearOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Тарифы по операциям"
        subtitle="Цены за каждую операцию по партнёрам"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCreateOpOpen(true)}>
              <Plus size={16} />
              Добавить операцию
            </Button>
            {selectedPartner && (
              <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
                <History size={16} />
                История
              </Button>
            )}
            {selectedPartner && (
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <FileSpreadsheet size={16} />
                Импорт из Excel
              </Button>
            )}
            {selectedPartner && hasChanges && (
              <Button
                onClick={handleSave}
                loading={setTariffs.isPending || updateOperation.isPending}
              >
                Сохранить изменения
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          aria-label="Партнёр"
          value={partnerId ?? ''}
          onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : undefined)}
          className="sm:max-w-xs"
        >
          <option value="">Выберите партнёра...</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {!p.isActive ? '(деактивирован)' : ''}
            </option>
          ))}
        </Select>

        {selectedPartner && (tariffs?.length ?? 0) > 0 && (
          <Button
            variant="secondary"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 sm:ml-auto"
            onClick={() => setClearOpen(true)}
          >
            <Trash2 size={14} />
            Удалить все тарифы
          </Button>
        )}
      </div>

      {!selectedPartner ? (
        <EmptyState
          icon={Coins}
          title="Выберите партнёра"
          description="Тарифы ведутся отдельно по каждому партнёру"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TH className="w-1/3">Операция</TH>
                <TH>Описание</TH>
                <TH>Относится к</TH>
                <TH>Ед. измерения</TH>
                <TH align="right">Тариф, руб. с НДС</TH>
                <TH className="w-8" />
              </THead>
              <TBody>
                {operations.map((op) => {
                  const saved = tariffByCode.get(op.code);
                  const draft = tariffDraft[op.code];
                  return (
                    <TR key={op.id}>
                      <TD className="text-gray-900">
                        {op.name}
                        {op.applySizeCoef && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold align-middle"
                            title="К тарифу применяется коэффициент К0-К5 по сумме трёх сторон (ШДВ)"
                          >
                            К
                          </span>
                        )}
                      </TD>
                      <TD>
                        <input
                          aria-label={`Описание операции ${op.name}`}
                          value={descDraft[op.id] ?? op.description ?? ''}
                          onChange={(e) =>
                            setDescDraft((prev) => ({ ...prev, [op.id]: e.target.value }))
                          }
                          placeholder="Описание операции..."
                          className="w-full bg-transparent text-gray-600 text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none focus:ring-0 py-1"
                        />
                      </TD>
                      <TD>
                        <select
                          aria-label={`Этап операции ${op.name}`}
                          value={phaseDraft[op.id] ?? op.phase}
                          onChange={(e) =>
                            setPhaseDraft((prev) => ({
                              ...prev,
                              [op.id]: e.target.value as 'INCOMING' | 'OUTGOING' | 'BOTH',
                            }))
                          }
                          className="bg-transparent text-gray-600 text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none focus:ring-0 py-1"
                        >
                          <option value="OUTGOING">Отгрузке</option>
                          <option value="INCOMING">Приёмке</option>
                          <option value="BOTH">Обеим</option>
                        </select>
                      </TD>
                      <TD className="text-gray-500 whitespace-nowrap">{op.unit ?? '—'}</TD>
                      <TD align="right">
                        <Input
                          aria-label={`Тариф операции ${op.name}`}
                          value={draft ?? saved ?? ''}
                          onChange={(e) =>
                            setTariffDraft((prev) => ({ ...prev, [op.code]: e.target.value }))
                          }
                          placeholder={op.tariff ?? '—'}
                          inputMode="decimal"
                          className="w-24 text-right text-sm py-1 ml-auto"
                        />
                      </TD>
                      <TD align="right">
                        <button
                          type="button"
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          onClick={() => setDeleteOpTarget(op)}
                          title="Удалить операцию из справочника"
                          aria-label={`Удалить операцию ${op.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
          <div className="px-4 py-2.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
            Пустое поле — тариф для партнёра не задан (серым показан тариф по умолчанию).
            Изменения применяются кнопкой «Сохранить изменения».
          </div>
        </div>
      )}

      {/* Справочник коэффициентов */}
      {selectedPartner && coefficients.length > 0 && (
        <div className="card mt-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Коэффициенты по сумме трёх сторон (ШДВ)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Применяются к операциям с пометкой «К»: итоговый тариф = базовый × коэффициент.
              Коэффициент подбирается автоматически по ШДВ из карточки SKU.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TH>Коэффициент</TH>
                <TH>Тариф</TH>
                <TH>Сумма трёх сторон</TH>
              </THead>
              <TBody>
                {coefficients.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.code}</TD>
                    <TD>{Number(c.multiplier) === 1 ? 'Базовый' : `×${c.multiplier}`}</TD>
                    <TD className="text-gray-500">{c.label}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

      {selectedPartner && (
        <TariffImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          partnerId={selectedPartner.id}
          partnerName={selectedPartner.name}
        />
      )}

      {selectedPartner && (
        <TariffHistoryDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          partnerId={selectedPartner.id}
          partnerName={selectedPartner.name}
        />
      )}

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClear}
        title="Удалить все тарифы?"
        description={`Все тарифы партнёра «${selectedPartner?.name}» будут удалены. Изменение попадёт в историю. Обычно это делается перед загрузкой нового файла.`}
        confirmLabel="Удалить всё"
        danger
        loading={deleteTariffs.isPending}
      />

      <CreateOperationDialog
        open={createOpOpen}
        onClose={() => setCreateOpOpen(false)}
        onSubmit={(data) => createOperation.mutateAsync(data)}
        isLoading={createOperation.isPending}
      />

      <ConfirmDialog
        open={!!deleteOpTarget}
        onClose={() => setDeleteOpTarget(null)}
        onConfirm={async () => {
          if (!deleteOpTarget) return;
          await deleteOperation.mutateAsync(deleteOpTarget.id);
          setDeleteOpTarget(null);
        }}
        title="Удалить операцию?"
        description={`Операция «${deleteOpTarget?.name}» будет удалена из общего справочника для всех партнёров. Нельзя удалить операцию, которая уже где-то используется.`}
        confirmLabel="Удалить"
        danger
        loading={deleteOperation.isPending}
      />
    </div>
  );
}

function CreateOperationDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    unit?: string;
    description?: string;
    tariff?: number;
    applySizeCoef?: boolean;
    phase?: 'INCOMING' | 'OUTGOING' | 'BOTH';
  }) => Promise<unknown>;
  isLoading?: boolean;
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [tariff, setTariff] = useState('');
  const [applySizeCoef, setApplySizeCoef] = useState(false);
  const [phase, setPhase] = useState<'INCOMING' | 'OUTGOING' | 'BOTH'>('OUTGOING');

  const reset = () => {
    setName('');
    setUnit('');
    setDescription('');
    setTariff('');
    setApplySizeCoef(false);
    setPhase('OUTGOING');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Укажите название операции');
      return;
    }
    const parsedTariff = tariff.trim() ? Number(tariff.replace(',', '.')) : undefined;
    if (tariff.trim() && !Number.isFinite(parsedTariff)) {
      toast.error('Некорректный тариф');
      return;
    }
    await onSubmit({
      name: name.trim(),
      unit: unit.trim() || undefined,
      description: description.trim() || undefined,
      tariff: parsedTariff,
      applySizeCoef,
      phase,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Добавить операцию в справочник" size="sm">
      <div className="space-y-4">
        <Field label="Название" required htmlFor="op-name">
          <Input
            id="op-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Упаковка в стрейч-плёнку"
            autoFocus
          />
        </Field>
        <Field label="Единица измерения" htmlFor="op-unit">
          <Input id="op-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="шт." />
        </Field>
        <Field label="Описание" htmlFor="op-desc">
          <Textarea
            id="op-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="Тариф по умолчанию, руб. с НДС" htmlFor="op-tariff">
          <Input
            id="op-tariff"
            value={tariff}
            onChange={(e) => setTariff(e.target.value)}
            inputMode="decimal"
            placeholder="10"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={applySizeCoef}
            onChange={(e) => setApplySizeCoef(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          Применять размерный коэффициент К по ШДВ
        </label>
        <Field label="Относится к" htmlFor="op-phase">
          <Select id="op-phase" value={phase} onChange={(e) => setPhase(e.target.value as typeof phase)}>
            <option value="OUTGOING">Отгрузке (ИСП)</option>
            <option value="INCOMING">Приёмке (ВХП)</option>
            <option value="BOTH">Обеим</option>
          </Select>
        </Field>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            Добавить
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function TariffImportDialog({
  open,
  onClose,
  partnerId,
  partnerName,
}: {
  open: boolean;
  onClose: () => void;
  partnerId: number;
  partnerName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<TariffParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [replace, setReplace] = useState(false);
  const importTariffs = useImportTariffs();

  const reset = () => {
    setParsed(null);
    setFileName('');
    setReplace(false);
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
      const result = parseTariffsExcel(await file.arrayBuffer());
      if (!result.items.length) {
        toast.error('В файле не найдено ни одного тарифа');
        return;
      }
      setParsed(result);
      setFileName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось прочитать файл');
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    await importTariffs.mutateAsync({ partnerId, replace, items: parsed.items });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Импорт тарифов — ${partnerName}`}
      size="lg"
    >
      {!parsed ? (
        <div
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={40} className="text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Выберите Excel-файл с листом «Операции и описание»
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Колонки: Операция, Единица измерения, Тариф руб. с НДС
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
              <span className="text-gray-400">— {parsed.items.length} операций</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Выбрать другой файл
            </Button>
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

          <div className="max-h-64 overflow-auto">
            <TableContainer>
              <Table>
                <THead>
                  <TH>Операция</TH>
                  <TH>Ед. изм.</TH>
                  <TH align="right">Тариф</TH>
                </THead>
                <TBody>
                  {parsed.items.map((item, i) => (
                    <TR key={i}>
                      <TD>{item.name}</TD>
                      <TD className="text-xs text-gray-500">{item.unit ?? '—'}</TD>
                      <TD align="right" className="font-mono text-xs">{item.tariff}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={!replace}
                onChange={() => setReplace(false)}
                className="text-primary focus:ring-primary-500"
              />
              <span>
                <b>Обновление</b> — тарифы из файла обновят существующие
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={replace}
                onChange={() => setReplace(true)}
                className="text-primary focus:ring-primary-500"
              />
              <span>
                <b>Полная замена</b> — текущие тарифы партнёра будут удалены и загружены заново
              </span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={handleClose} disabled={importTariffs.isPending}>
              Отмена
            </Button>
            <Button onClick={handleImport} loading={importTariffs.isPending}>
              {`Загрузить ${parsed.items.length} тарифов`}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function TariffHistoryDialog({
  open,
  onClose,
  partnerId,
  partnerName,
}: {
  open: boolean;
  onClose: () => void;
  partnerId: number;
  partnerName: string;
}) {
  const { data: history, isLoading } = useTariffHistory(open ? partnerId : undefined);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`История тарифов — ${partnerName}`}
      size="lg"
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : !history?.length ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Изменений тарифов ещё не было
        </p>
      ) : (
        <div className="max-h-96 overflow-auto">
          <TableContainer>
            <Table>
              <THead>
                <TH>Дата</TH>
                <TH>Операция</TH>
                <TH align="right">Было</TH>
                <TH align="right">Стало</TH>
              </THead>
              <TBody>
                {history.map((h) => (
                  <TR key={h.id}>
                    <TD className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateShort(h.changedAt)}
                    </TD>
                    <TD>{h.operation.name}</TD>
                    <TD align="right" className="font-mono text-xs text-gray-400">
                      {h.oldTariff ?? '—'}
                    </TD>
                    <TD align="right" className="font-mono text-xs">
                      {h.newTariff != null ? h.newTariff : <span className="text-red-500">удалён</span>}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </Dialog>
  );
}
