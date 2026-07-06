import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Coins,
  FileSpreadsheet,
  History,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePartners } from '@/hooks/usePartners';
import {
  useCoefficients,
  useDeletePartnerTariffs,
  useImportTariffs,
  useOperations,
  usePartnerTariffs,
  useSetPartnerTariffs,
  useTariffHistory,
  useUpdateOperation,
} from '@/hooks/useSkus';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { parseTariffsExcel, type TariffParseResult } from '@/lib/importTariffsExcel';
import { formatDateShort } from '@/lib/utils';

export function TariffsPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  // Черновики правок: тарифы (code → строка) и описания (opId → строка)
  const [tariffDraft, setTariffDraft] = useState<Record<string, string>>({});
  const [descDraft, setDescDraft] = useState<Record<number, string>>({});

  const { data: partnersData } = usePartners();
  const { data: operations = [] } = useOperations();
  const { data: tariffs } = usePartnerTariffs(partnerId);
  const { data: coefficients = [] } = useCoefficients();

  const setTariffs = useSetPartnerTariffs(partnerId ?? 0);
  const deleteTariffs = useDeletePartnerTariffs();
  const updateOperation = useUpdateOperation();

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
  }, [partnerId, tariffs]);

  const dirtyTariffs = Object.entries(tariffDraft).filter(([code, v]) => {
    const current = tariffByCode.get(code) ?? '';
    return v.trim() !== '' && v.replace(',', '.') !== String(current);
  });
  const dirtyDescs = Object.entries(descDraft).filter(([id, v]) => {
    const op = operations.find((o) => o.id === Number(id));
    return op && v !== (op.description ?? '');
  });
  const hasChanges = dirtyTariffs.length > 0 || dirtyDescs.length > 0;

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
    setTariffDraft({});
    setDescDraft({});
  };

  const handleClear = async () => {
    if (!partnerId) return;
    await deleteTariffs.mutateAsync(partnerId);
    setClearOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Тарифы по операциям</h1>
          <p className="text-sm text-gray-500 mt-1">
            Цены за каждую операцию по партнёрам
          </p>
        </div>
        {selectedPartner && (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setHistoryOpen(true)}>
              <History size={16} />
              История
            </button>
            <button className="btn-secondary" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet size={16} />
              Импорт из Excel
            </button>
            {hasChanges && (
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={setTariffs.isPending || updateOperation.isPending}
              >
                {setTariffs.isPending || updateOperation.isPending
                  ? 'Сохранение...'
                  : 'Сохранить изменения'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={partnerId ?? ''}
          onChange={(e) =>
            setPartnerId(e.target.value ? Number(e.target.value) : undefined)
          }
          className="input sm:max-w-xs"
        >
          <option value="">Выберите партнёра...</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {!p.isActive ? '(деактивирован)' : ''}
            </option>
          ))}
        </select>

        {selectedPartner && (tariffs?.length ?? 0) > 0 && (
          <button
            className="btn text-sm px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 sm:ml-auto"
            onClick={() => setClearOpen(true)}
          >
            <Trash2 size={14} />
            Удалить все тарифы
          </button>
        )}
      </div>

      {!selectedPartner ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Coins size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Выберите партнёра</h3>
          <p className="text-sm text-gray-400 mt-1">
            Тарифы ведутся отдельно по каждому партнёру
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium w-1/3">Операция</th>
                  <th className="px-4 py-3 font-medium">Описание</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Ед. измерения</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                    Тариф, руб. с НДС
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {operations.map((op) => {
                  const saved = tariffByCode.get(op.code);
                  const draft = tariffDraft[op.code];
                  return (
                    <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-900">
                        {op.name}
                        {op.applySizeCoef && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold align-middle"
                            title="К тарифу применяется коэффициент К0-К5 по сумме трёх сторон (ШДВ)"
                          >
                            К
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={descDraft[op.id] ?? op.description ?? ''}
                          onChange={(e) =>
                            setDescDraft((prev) => ({ ...prev, [op.id]: e.target.value }))
                          }
                          placeholder="Описание операции..."
                          className="w-full bg-transparent text-gray-600 text-sm border-0 border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none focus:ring-0 py-1"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                        {op.unit ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <input
                          value={draft ?? saved ?? ''}
                          onChange={(e) =>
                            setTariffDraft((prev) => ({
                              ...prev,
                              [op.code]: e.target.value,
                            }))
                          }
                          placeholder={op.tariff ?? '—'}
                          inputMode="decimal"
                          className="input w-24 text-right text-sm py-1 ml-auto"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Коэффициент</th>
                  <th className="px-4 py-2 font-medium">Тариф</th>
                  <th className="px-4 py-2 font-medium">Сумма трёх сторон</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coefficients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-medium">{c.code}</td>
                    <td className="px-4 py-2">
                      {Number(c.multiplier) === 1 ? 'Базовый' : `×${c.multiplier}`}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{c.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
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
              <span className="text-gray-400">— {parsed.items.length} операций</span>
            </div>
            <button type="button" className="btn-ghost text-xs" onClick={reset}>
              Выбрать другой файл
            </button>
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
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-3 py-2 font-medium">Операция</th>
                    <th className="px-3 py-2 font-medium">Ед. изм.</th>
                    <th className="px-3 py-2 font-medium text-right">Тариф</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsed.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {item.unit ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {item.tariff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={importTariffs.isPending}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={importTariffs.isPending}
            >
              {importTariffs.isPending
                ? 'Импорт...'
                : `Загрузить ${parsed.items.length} тарифов`}
            </button>
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
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ) : !history?.length ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Изменений тарифов ещё не было
        </p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2 font-medium">Дата</th>
                  <th className="px-3 py-2 font-medium">Операция</th>
                  <th className="px-3 py-2 font-medium text-right">Было</th>
                  <th className="px-3 py-2 font-medium text-right">Стало</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateShort(h.changedAt)}
                    </td>
                    <td className="px-3 py-2">{h.operation.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-gray-400">
                      {h.oldTariff ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {h.newTariff != null ? (
                        h.newTariff
                      ) : (
                        <span className="text-red-500">удалён</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Dialog>
  );
}
