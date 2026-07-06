import { useMemo, useState } from 'react';
import {
  Coins,
  FileSpreadsheet,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { usePartners } from '@/hooks/usePartners';
import {
  useCreateSku,
  useDeletePartnerSkus,
  useDeleteSku,
  useOperations,
  usePartnerTariffs,
  useSkus,
  useUpdateSku,
} from '@/hooks/useSkus';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkuForm } from '@/components/skus/SkuForm';
import { SkuPhotos } from '@/components/skus/SkuPhotos';
import { SkuImportDialog } from '@/components/skus/SkuImportDialog';
import { PartnerTariffsDialog } from '@/components/skus/PartnerTariffsDialog';
import type { Sku, SkuFormData } from '@/types/sku';

export function SkusPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tariffsOpen, setTariffsOpen] = useState(false);
  const [editSku, setEditSku] = useState<Sku | null>(null);
  const [deleteSkuTarget, setDeleteSkuTarget] = useState<Sku | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const { data: partnersData } = usePartners();
  const { data: operations = [] } = useOperations();
  const { data: partnerTariffs } = usePartnerTariffs(partnerId);
  const { data, isLoading } = useSkus({
    partnerId,
    search: search || undefined,
  });

  const createSku = useCreateSku();
  const updateSku = useUpdateSku(editSku?.id ?? 0);
  const deleteSku = useDeleteSku();
  const deleteAll = useDeletePartnerSkus();

  const partners = partnersData?.data ?? [];
  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === partnerId),
    [partners, partnerId],
  );
  const skus = data?.data ?? [];
  const total = data?.total ?? 0;

  // Актуальная версия редактируемого SKU из кэша (для фото)
  const editSkuFresh = useMemo(
    () => (editSku ? skus.find((s) => s.id === editSku.id) ?? editSku : null),
    [skus, editSku],
  );

  const partnerName = (id: number) =>
    partners.find((p) => p.id === id)?.name ?? `Партнёр #${id}`;

  const handleCreate = async (formData: SkuFormData) => {
    if (!partnerId) return;
    await createSku.mutateAsync({ ...formData, partnerId });
    setCreateOpen(false);
  };

  const handleUpdate = async (formData: SkuFormData) => {
    await updateSku.mutateAsync(formData);
    setEditSku(null);
  };

  const handleDelete = async () => {
    if (!deleteSkuTarget) return;
    await deleteSku.mutateAsync(deleteSkuTarget.id);
    setDeleteSkuTarget(null);
  };

  const handleClearAll = async () => {
    if (!partnerId) return;
    await deleteAll.mutateAsync(partnerId);
    setClearAllOpen(false);
  };

  return (
    <div>
      {/* Page title */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Справочник SKU</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0
              ? pluralize(total, 'позиция', 'позиции', 'позиций')
              : 'Нет позиций'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedPartner && (
            <>
              <button
                className="btn-secondary"
                onClick={() => setTariffsOpen(true)}
              >
                <Coins size={16} />
                Тарифы
              </button>
              <button
                className="btn-secondary"
                onClick={() => setImportOpen(true)}
              >
                <FileSpreadsheet size={16} />
                Импорт из Excel
              </button>
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Добавить SKU
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
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
              {p.name} {!p.isActive ? '(деактивирован)' : ''}
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
            placeholder="Поиск по артикулу, ШК, наименованию, цвету..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {selectedPartner && skus.length > 0 && (
          <button
            className="btn text-sm px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 sm:ml-auto"
            onClick={() => setClearAllOpen(true)}
          >
            <Trash2 size={14} />
            Удалить справочник
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ) : skus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">SKU не найдены</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            {search
              ? 'Попробуйте изменить параметры поиска'
              : selectedPartner
                ? 'Загрузите справочник из Excel или добавьте SKU вручную'
                : 'Выберите партнёра, чтобы загрузить справочник'}
          </p>
          {selectedPartner && !search && (
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setImportOpen(true)}>
                <FileSpreadsheet size={16} />
                Импорт из Excel
              </button>
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Добавить SKU
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Артикул</th>
                  <th className="px-4 py-3 font-medium">Наименование</th>
                  {!partnerId && <th className="px-4 py-3 font-medium">Партнёр</th>}
                  <th className="px-4 py-3 font-medium">Спец. отметки</th>
                  <th className="px-4 py-3 font-medium">Операции</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {skus.map((sku) => (
                  <tr key={sku.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {sku.article}
                      {sku.barcode && (
                        <div className="text-gray-400">{sku.barcode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{sku.name}</div>
                      <div className="text-xs text-gray-400">
                        {[
                          sku.color,
                          sku.shelfLife && `срок: ${sku.shelfLife}`,
                          sku.photos.length > 0 && `фото: ${sku.photos.length}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </td>
                    {!partnerId && (
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {partnerName(sku.partnerId)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {sku.specialMarks ? (
                        <div className="flex flex-wrap gap-1">
                          {sku.specialMarks.split(',').map((m, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium whitespace-nowrap"
                            >
                              {m.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sku.operations.length > 0 ? (
                        <div
                          className="flex flex-wrap gap-1 max-w-xs"
                          title={sku.operations
                            .map((so) => so.operation.name)
                            .join('\n')}
                        >
                          {sku.operations.slice(0, 3).map((so) => (
                            <span
                              key={so.id}
                              className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-[11px] font-medium whitespace-nowrap"
                            >
                              {shortOpName(so.operation.name)}
                            </span>
                          ))}
                          {sku.operations.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
                              +{sku.operations.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          className="btn-ghost text-xs p-2"
                          onClick={() => setEditSku(sku)}
                          title="Редактировать"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-ghost text-xs p-2 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteSkuTarget(sku)}
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Создание */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`Добавить SKU — ${selectedPartner?.name ?? ''}`}
        size="xl"
      >
        <SkuForm
          operations={operations}
          partnerTariffs={partnerTariffs}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={createSku.isPending}
          submitLabel="Создать SKU"
        />
      </Dialog>

      {/* Редактирование */}
      <Dialog
        open={!!editSkuFresh}
        onClose={() => setEditSku(null)}
        title={`SKU ${editSkuFresh?.article ?? ''} — ${editSkuFresh ? partnerName(editSkuFresh.partnerId) : ''}`}
        size="xl"
      >
        {editSkuFresh && (
          <div className="space-y-4">
            <SkuPhotos sku={editSkuFresh} />
            <SkuForm
              operations={operations}
              partnerTariffs={partnerTariffs}
              defaultValues={editSkuFresh}
              onSubmit={handleUpdate}
              onCancel={() => setEditSku(null)}
              isLoading={updateSku.isPending}
              submitLabel="Сохранить изменения"
            />
          </div>
        )}
      </Dialog>

      {/* Импорт */}
      {selectedPartner && (
        <SkuImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          partner={selectedPartner}
        />
      )}

      {/* Тарифы партнёра */}
      {selectedPartner && (
        <PartnerTariffsDialog
          open={tariffsOpen}
          onClose={() => setTariffsOpen(false)}
          partner={selectedPartner}
        />
      )}

      {/* Удаление одного SKU */}
      <ConfirmDialog
        open={!!deleteSkuTarget}
        onClose={() => setDeleteSkuTarget(null)}
        onConfirm={handleDelete}
        title="Удалить SKU?"
        description={`Артикул «${deleteSkuTarget?.article}» (${deleteSkuTarget?.name}) будет удалён вместе с операциями и фото.`}
        confirmLabel="Удалить"
        danger
        loading={deleteSku.isPending}
      />

      {/* Полное удаление справочника */}
      <ConfirmDialog
        open={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={handleClearAll}
        title="Удалить весь справочник?"
        description={`Все SKU партнёра «${selectedPartner?.name}» будут удалены. Обычно это делается перед загрузкой нового файла.`}
        confirmLabel="Удалить всё"
        danger
        loading={deleteAll.isPending}
      />
    </div>
  );
}

function shortOpName(name: string): string {
  return name.length > 28 ? `${name.slice(0, 26)}…` : name;
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}
