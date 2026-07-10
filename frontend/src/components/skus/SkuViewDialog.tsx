import { Pencil } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import type { Sku } from '@/types/sku';
import { photoUrl } from '@/types/sku';
import { formatDate } from '@/lib/utils';

interface Props {
  sku: Sku | null;
  onClose: () => void;
  onEdit: (sku: Sku) => void;
}

export function SkuViewDialog({ sku, onClose, onEdit }: Props) {
  return (
    <Dialog
      open={!!sku}
      onClose={onClose}
      title={sku ? `Карточка SKU — ${sku.article}` : 'Карточка SKU'}
      size="lg"
      headerActions={
        sku && (
          <button
            type="button"
            className="btn-secondary text-xs px-3 py-1.5"
            onClick={() => onEdit(sku)}
          >
            <Pencil size={14} />
            Редактировать
          </button>
        )
      }
    >
      {sku && (
        <div className="space-y-5">
          {sku.photos.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {sku.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photoUrl(photo)}
                  alt={sku.name}
                  className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                />
              ))}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900">{sku.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{sku.article}</p>
          </div>

          {sku.specialMarks && (
            <div className="flex flex-wrap gap-1.5">
              {sku.specialMarks.split(',').map((m, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium"
                >
                  {m.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <ViewField label="Штрих-код" value={sku.barcode} />
            <ViewField label="Цвет" value={sku.color} />
            <ViewField label="Срок годности" value={sku.shelfLife} />
            <ViewField label="Сумма трёх сторон (ШДВ)" value={sku.sumOfSides ? `${sku.sumOfSides} см` : null} />
            <ViewField label="Вес" value={sku.weight ? `${sku.weight} кг` : null} />
            <ViewField label="Квант коробочный" value={sku.boxQuant} />
            <ViewField label="Квант паллетный" value={sku.palletQuant} />
            <ViewField
              label="Допупаковка, 1 ед."
              value={sku.packCostUnit ? `${sku.packCostUnit} руб.` : null}
            />
            <ViewField
              label="Допупаковка, 1 короб"
              value={sku.packCostBox ? `${sku.packCostBox} руб.` : null}
            />
          </div>

          {sku.clientRequirements && (
            <ViewField label="Требования заказчика" value={sku.clientRequirements} block />
          )}

          <div>
            <p className="label mb-2">Операции по SKU</p>
            {sku.operations.length > 0 ? (
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                {sku.operations.map((so) => (
                  <div
                    key={so.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">{so.operation.name}</span>
                    <span className="text-gray-400 text-xs">
                      {so.operation.unit ?? 'ед.'}
                      {so.value && so.value !== '1' ? ` · кол-во: ${so.value}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Операции не назначены</p>
            )}
          </div>

          <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
            <span>Создан: {formatDate(sku.createdAt)}</span>
            <span>Обновлён: {formatDate(sku.updatedAt)}</span>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function ViewField({
  label,
  value,
  block,
}: {
  label: string;
  value: string | number | null | undefined;
  block?: boolean;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={block ? 'sm:col-span-2' : undefined}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-700">{value}</p>
    </div>
  );
}
