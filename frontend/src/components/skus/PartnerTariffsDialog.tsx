import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useOperations, usePartnerTariffs, useSetPartnerTariffs } from '@/hooks/useSkus';
import type { Partner } from '@/types/partner';

interface Props {
  open: boolean;
  onClose: () => void;
  partner: Partner;
}

export function PartnerTariffsDialog({ open, onClose, partner }: Props) {
  const { data: operations = [] } = useOperations();
  const { data: tariffs, isLoading } = usePartnerTariffs(open ? partner.id : undefined);
  const setTariffs = useSetPartnerTariffs(partner.id);

  // code → строка ввода
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !tariffs) return;
    const map: Record<string, string> = {};
    tariffs.forEach((t) => {
      map[t.operation.code] = t.tariff;
    });
    setValues(map);
  }, [open, tariffs]);

  const handleSave = async () => {
    const payload = Object.entries(values)
      .map(([code, v]) => ({ code, tariff: Number(String(v).replace(',', '.')) }))
      .filter((t) => Number.isFinite(t.tariff) && t.tariff >= 0 && String(values[t.code]).trim() !== '');
    await setTariffs.mutateAsync(payload);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Тарифы — ${partner.name}`}
      size="lg"
    >
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Расценки этого партнёра. Заполняются автоматически при импорте
            справочника из Excel, здесь можно скорректировать вручную.
          </p>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {operations.map((op) => (
              <div key={op.code} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1 text-sm text-gray-700">
                  {op.name}
                  <span className="text-xs text-gray-400 ml-2">{op.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    value={values[op.code] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [op.code]: e.target.value }))
                    }
                    placeholder={op.tariff ?? '—'}
                    inputMode="decimal"
                    className="input w-24 text-right text-sm py-1"
                  />
                  <span className="text-xs text-gray-400 w-8">руб.</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={setTariffs.isPending}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={setTariffs.isPending}
            >
              {setTariffs.isPending ? 'Сохранение...' : 'Сохранить тарифы'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
