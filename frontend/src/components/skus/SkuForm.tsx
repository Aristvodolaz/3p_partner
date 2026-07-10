import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Operation, PartnerTariff, Sku, SkuFormData } from '@/types/sku';
import { SPECIAL_MARKS_PRESETS } from '@/types/sku';
import { useCoefficients } from '@/hooks/useSkus';
import { calcEffectiveTariff, getSizeCoefficient } from '@/lib/tariffCalc';

const schema = z.object({
  article: z.string().min(1, 'Обязательное поле').max(100),
  name: z.string().min(1, 'Обязательное поле').max(500),
  barcode: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  shelfLife: z.string().max(100).optional(),
  sumOfSides: z.string().optional(),
  weight: z.string().optional(),
  boxQuant: z.string().optional(),
  palletQuant: z.string().optional(),
  packCostUnit: z.string().optional(),
  packCostBox: z.string().optional(),
  clientRequirements: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  operations: Operation[];
  partnerTariffs?: PartnerTariff[];
  defaultValues?: Sku;
  onSubmit: (data: SkuFormData) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  /** Вызывается при изменении признака «есть несохранённые правки» */
  onDirtyChange?: (dirty: boolean) => void;
  /** id атрибута <form>, чтобы кнопка "Сохранить" в шапке диалога могла сабмитить форму снаружи */
  formId?: string;
}

function numOrUndef(s?: string): number | undefined {
  if (!s?.trim()) return undefined;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function intOrUndef(s?: string): number | undefined {
  const n = numOrUndef(s);
  return n === undefined ? undefined : Math.round(n);
}

export function SkuForm({
  operations,
  partnerTariffs,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Сохранить',
  onDirtyChange,
  formId = 'sku-form',
}: Props) {
  const tariffByCode = useMemo(
    () => new Map(partnerTariffs?.map((t) => [t.operation.code, t.tariff]) ?? []),
    [partnerTariffs],
  );
  const { data: coefficients = [] } = useCoefficients();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      article: defaultValues?.article ?? '',
      name: defaultValues?.name ?? '',
      barcode: defaultValues?.barcode ?? '',
      color: defaultValues?.color ?? '',
      shelfLife: defaultValues?.shelfLife ?? '',
      sumOfSides: defaultValues?.sumOfSides ?? '',
      weight: defaultValues?.weight ?? '',
      boxQuant: defaultValues?.boxQuant != null ? String(defaultValues.boxQuant) : '',
      palletQuant: defaultValues?.palletQuant != null ? String(defaultValues.palletQuant) : '',
      packCostUnit: defaultValues?.packCostUnit ?? '',
      packCostBox: defaultValues?.packCostBox ?? '',
      clientRequirements: defaultValues?.clientRequirements ?? '',
    },
  });

  // Текущая ШДВ для расчёта коэффициента К
  const sumOfSidesNow = numOrUndef(watch('sumOfSides'));
  const activeCoef = getSizeCoefficient(sumOfSidesNow, coefficients);

  // Операции: code → value (чекбокс включён, если код есть в Map)
  const [selectedOps, setSelectedOps] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    defaultValues?.operations?.forEach((so) =>
      map.set(so.operation.code, so.value ?? '1'),
    );
    return map;
  });

  // Специальные отметки
  const initialMarks = useMemo(
    () =>
      (defaultValues?.specialMarks ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [defaultValues],
  );
  const [marks, setMarks] = useState<string[]>(initialMarks);
  const [customMark, setCustomMark] = useState('');

  // Отслеживание несохранённых изменений: RHF-поля + отметки + операции
  const initialMarksKey = useMemo(() => [...initialMarks].sort().join('|'), [initialMarks]);
  const marksDirty = [...marks].sort().join('|') !== initialMarksKey;

  const initialOpsKey = useMemo(
    () =>
      (defaultValues?.operations ?? [])
        .map((so) => `${so.operation.code}:${so.value ?? '1'}`)
        .sort()
        .join('|'),
    [defaultValues],
  );
  const opsDirty =
    Array.from(selectedOps.entries())
      .map(([code, value]) => `${code}:${value}`)
      .sort()
      .join('|') !== initialOpsKey;

  useEffect(() => {
    onDirtyChange?.(isDirty || marksDirty || opsDirty);
  }, [isDirty, marksDirty, opsDirty, onDirtyChange]);

  const toggleOp = (code: string) => {
    setSelectedOps((prev) => {
      const next = new Map(prev);
      if (next.has(code)) next.delete(code);
      else next.set(code, '1');
      return next;
    });
  };

  const setOpValue = (code: string, value: string) => {
    setSelectedOps((prev) => new Map(prev).set(code, value));
  };

  const toggleMark = (mark: string) => {
    setMarks((prev) =>
      prev.includes(mark) ? prev.filter((m) => m !== mark) : [...prev, mark],
    );
  };

  const addCustomMark = () => {
    const m = customMark.trim();
    if (m && !marks.includes(m)) setMarks((prev) => [...prev, m]);
    setCustomMark('');
  };

  const submit = (values: FormValues) => {
    // Явно отправляем null для очищенных полей, а не undefined — иначе
    // бэкенд/Prisma трактует undefined как «не менять» и старое значение остаётся.
    const data: SkuFormData = {
      article: values.article.trim(),
      name: values.name.trim(),
      barcode: values.barcode?.trim() || null,
      color: values.color?.trim() || null,
      shelfLife: values.shelfLife?.trim() || null,
      sumOfSides: numOrUndef(values.sumOfSides) ?? null,
      weight: numOrUndef(values.weight) ?? null,
      boxQuant: intOrUndef(values.boxQuant) ?? null,
      palletQuant: intOrUndef(values.palletQuant) ?? null,
      packCostUnit: numOrUndef(values.packCostUnit) ?? null,
      packCostBox: numOrUndef(values.packCostBox) ?? null,
      clientRequirements: values.clientRequirements?.trim() || null,
      specialMarks: marks.length ? marks.join(', ') : null,
      operations: Array.from(selectedOps.entries()).map(([code, value]) => ({
        code,
        value: value.trim() || '1',
      })),
    };
    return onSubmit(data);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Артикул *</label>
          <input
            {...register('article')}
            placeholder="123456"
            className={`input ${errors.article ? 'input-error' : ''}`}
          />
          {errors.article && (
            <p className="mt-1 text-xs text-red-500">{errors.article.message}</p>
          )}
        </div>

        <div>
          <label className="label">Штрих-код</label>
          <input {...register('barcode')} placeholder="4600000000000" className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Наименование товара *</label>
          <input
            {...register('name')}
            placeholder="Маска для сна"
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="label">Цвет</label>
          <input {...register('color')} placeholder="Синий" className="input" />
        </div>

        <div>
          <label className="label">Срок годности</label>
          <input {...register('shelfLife')} placeholder="24 мес." className="input" />
        </div>

        <div>
          <label className="label">Сумма трёх сторон, см (ШДВ)</label>
          <input {...register('sumOfSides')} placeholder="45" inputMode="decimal" className="input" />
          {activeCoef && Number(activeCoef.multiplier) !== 1 && (
            <p className="mt-1 text-xs text-amber-600">
              Коэффициент {activeCoef.code} ×{activeCoef.multiplier} ({activeCoef.label})
            </p>
          )}
        </div>

        <div>
          <label className="label">Вес, кг</label>
          <input {...register('weight')} placeholder="0.35" inputMode="decimal" className="input" />
        </div>

        <div>
          <label className="label">Квант коробочный</label>
          <input {...register('boxQuant')} placeholder="10" inputMode="numeric" className="input" />
        </div>

        <div>
          <label className="label">Квант паллетный</label>
          <input {...register('palletQuant')} placeholder="120" inputMode="numeric" className="input" />
        </div>

        <div>
          <label className="label">Затраты на допупаковку 1 ед., руб.</label>
          <input {...register('packCostUnit')} placeholder="5" inputMode="decimal" className="input" />
        </div>

        <div>
          <label className="label">Затраты на допупаковку 1 короб, руб.</label>
          <input {...register('packCostBox')} placeholder="20" inputMode="decimal" className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Требования заказчика</label>
          <textarea
            {...register('clientRequirements')}
            rows={2}
            className="input resize-none"
            placeholder="Особые требования к обработке товара"
          />
        </div>
      </div>

      {/* Специальные отметки */}
      <div>
        <label className="label">Специальные отметки</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SPECIAL_MARKS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => toggleMark(preset)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                marks.includes(preset)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset}
            </button>
          ))}
          {marks
            .filter((m) => !SPECIAL_MARKS_PRESETS.includes(m as never))
            .map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMark(m)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border bg-primary text-white border-primary"
                title="Нажмите, чтобы убрать"
              >
                {m} ×
              </button>
            ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={customMark}
            onChange={(e) => setCustomMark(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomMark();
              }
            }}
            placeholder="Своя отметка..."
            className="input flex-1"
          />
          <button type="button" className="btn-secondary" onClick={addCustomMark}>
            Добавить
          </button>
        </div>
      </div>

      {/* Операции */}
      <div>
        <label className="label">Операции по SKU</label>
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 mt-1 max-h-72 overflow-y-auto">
          {operations.map((op) => {
            const checked = selectedOps.has(op.code);
            return (
              <div key={op.code} className="flex items-center gap-3 px-3 py-2">
                <input
                  type="checkbox"
                  id={`op-${op.code}`}
                  checked={checked}
                  onChange={() => toggleOp(op.code)}
                  className="rounded border-gray-300 text-primary focus:ring-primary-500"
                />
                <label
                  htmlFor={`op-${op.code}`}
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {op.name}
                  {(() => {
                    const eff = calcEffectiveTariff(
                      op,
                      tariffByCode.get(op.code),
                      sumOfSidesNow,
                      coefficients,
                    );
                    if (!eff) return null;
                    return (
                      <span className="text-xs text-gray-400 ml-2">
                        {eff.total} руб. / {op.unit ?? 'ед.'}
                        {eff.coefCode && (
                          <span className="text-amber-600 ml-1">
                            ({eff.base} × {eff.multiplier}, {eff.coefCode})
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </label>
                {checked && (
                  <input
                    value={selectedOps.get(op.code) ?? ''}
                    onChange={(e) => setOpValue(op.code, e.target.value)}
                    className="input w-20 text-center text-sm py-1"
                    title="Значение (количество)"
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Отметьте утверждённые с партнёром операции. Значение — количество (по умолчанию 1).
        </p>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          Отмена
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
