import { useMemo, useState } from 'react';
import {
  Coins,
  FileSpreadsheet,
  Package,
  Pencil,
  Plus,
  Save,
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
import {
  Dialog,
  ConfirmDialog,
  PageHeader,
  SearchInput,
  Button,
  Select,
  Badge,
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
import { SkuForm } from '@/components/skus/SkuForm';
import { SkuPhotos } from '@/components/skus/SkuPhotos';
import { SkuImportDialog } from '@/components/skus/SkuImportDialog';
import { PartnerTariffsDialog } from '@/components/skus/PartnerTariffsDialog';
import { SkuViewDialog } from '@/components/skus/SkuViewDialog';
import type { Sku, SkuFormData } from '@/types/sku';

export function SkusPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tariffsOpen, setTariffsOpen] = useState(false);
  const [viewSku, setViewSku] = useState<Sku | null>(null);
  const [editSku, setEditSku] = useState<Sku | null>(null);
  const [deleteSkuTarget, setDeleteSkuTarget] = useState<Sku | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const [editDirty, setEditDirty] = useState(false);

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

  // Актуальная версия редактируемого/просматриваемого SKU из кэша (для фото)
  const editSkuFresh = useMemo(
    () => (editSku ? skus.find((s) => s.id === editSku.id) ?? editSku : null),
    [skus, editSku],
  );
  const viewSkuFresh = useMemo(
    () => (viewSku ? skus.find((s) => s.id === viewSku.id) ?? viewSku : null),
    [skus, viewSku],
  );

  const partnerName = (id: number) =>
    partners.find((p) => p.id === id)?.name ?? `Партнёр #${id}`;

  const handleCreate = async (formData: SkuFormData) => {
    if (!partnerId) return;
    await createSku.mutateAsync({ ...formData, partnerId });
    setCreateOpen(false);
    setCreateDirty(false);
  };

  const handleUpdate = async (formData: SkuFormData) => {
    await updateSku.mutateAsync(formData);
    setEditSku(null);
    setEditDirty(false);
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
      <PageHeader
        title="Справочник SKU"
        subtitle={total > 0 ? pluralize(total, 'позиция', 'позиции', 'позиций') : 'Нет позиций'}
        actions={
          selectedPartner && (
            <>
              <Button variant="secondary" onClick={() => setTariffsOpen(true)}>
                <Coins size={16} />
                Тарифы
              </Button>
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <FileSpreadsheet size={16} />
                Импорт из Excel
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Добавить SKU
              </Button>
            </>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <Select
          aria-label="Партнёр"
          value={partnerId ?? ''}
          onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : undefined)}
          className="sm:max-w-xs"
        >
          <option value="">Все партнёры</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {!p.isActive ? '(деактивирован)' : ''}
            </option>
          ))}
        </Select>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по артикулу, ШК, наименованию, цвету..."
        />

        {selectedPartner && skus.length > 0 && (
          <Button
            variant="secondary"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 sm:ml-auto"
            onClick={() => setClearAllOpen(true)}
          >
            <Trash2 size={14} />
            Удалить справочник
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : skus.length === 0 ? (
        <EmptyState
          icon={Package}
          title="SKU не найдены"
          description={
            search
              ? 'Попробуйте изменить параметры поиска'
              : selectedPartner
                ? 'Загрузите справочник из Excel или добавьте SKU вручную'
                : 'Выберите партнёра, чтобы загрузить справочник'
          }
          action={
            selectedPartner &&
            !search && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  <FileSpreadsheet size={16} />
                  Импорт из Excel
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus size={16} />
                  Добавить SKU
                </Button>
              </div>
            )
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>Артикул</TH>
              <TH>Наименование</TH>
              {!partnerId && <TH>Партнёр</TH>}
              <TH>Спец. отметки</TH>
              <TH align="right">Стоимость упаковки на 1 ед.</TH>
              <TH>Операции</TH>
              <TH align="right">Действия</TH>
            </THead>
            <TBody>
              {skus.map((sku) => (
                <TR key={sku.id}>
                  <TD className="font-mono text-xs whitespace-nowrap">
                    {sku.article}
                    {sku.barcode && <div className="text-gray-400">{sku.barcode}</div>}
                  </TD>
                  <TD>
                    <button
                      type="button"
                      onClick={() => setViewSku(sku)}
                      className="font-medium text-gray-900 hover:text-primary hover:underline text-left"
                      title="Просмотреть карточку"
                    >
                      {sku.name}
                    </button>
                    <div className="text-xs text-gray-400">
                      {[
                        sku.color,
                        sku.shelfLife && `срок: ${sku.shelfLife}`,
                        sku.photos.length > 0 && `фото: ${sku.photos.length}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </TD>
                  {!partnerId && (
                    <TD className="text-xs text-gray-600">{partnerName(sku.partnerId)}</TD>
                  )}
                  <TD>
                    {sku.specialMarks ? (
                      <div className="flex flex-wrap gap-1">
                        {sku.specialMarks.split(',').map((m, i) => (
                          <Badge key={i} tone="amber" className="text-[11px]">
                            {m.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TD>
                  <TD align="right" className="font-mono text-[13px] whitespace-nowrap">
                    {sku.packCostUnit != null ? (
                      `${Number(sku.packCostUnit).toLocaleString('ru-RU')} ₽`
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TD>
                  <TD>
                    {sku.operations.length > 0 ? (
                      <div
                        className="flex flex-wrap gap-1 max-w-xs"
                        title={sku.operations.map((so) => so.operation.name).join('\n')}
                      >
                        {sku.operations.slice(0, 3).map((so) => (
                          <Badge key={so.id} tone="primary" className="text-[11px]">
                            {shortOpName(so.operation.name)}
                          </Badge>
                        ))}
                        {sku.operations.length > 3 && (
                          <Badge tone="gray" className="text-[11px]">
                            +{sku.operations.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TD>
                  <TD align="right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditSku(sku)}
                        title="Редактировать"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteSkuTarget(sku)}
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}

      {/* Просмотр карточки (без редактирования) */}
      <SkuViewDialog
        sku={viewSkuFresh}
        onClose={() => setViewSku(null)}
        onEdit={(sku) => {
          setViewSku(null);
          setEditSku(sku);
        }}
      />

      {/* Создание */}
      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDirty(false);
        }}
        title={`Добавить SKU — ${selectedPartner?.name ?? ''}`}
        size="xl"
        isDirty={createDirty}
        headerActions={
          <Button type="submit" form="sku-form-create" size="sm" loading={createSku.isPending}>
            <Save size={14} />
            Сохранить
          </Button>
        }
      >
        <SkuForm
          formId="sku-form-create"
          operations={operations}
          partnerTariffs={partnerTariffs}
          onSubmit={handleCreate}
          onCancel={() => {
            setCreateOpen(false);
            setCreateDirty(false);
          }}
          onDirtyChange={setCreateDirty}
          isLoading={createSku.isPending}
          submitLabel="Создать SKU"
        />
      </Dialog>

      {/* Редактирование */}
      <Dialog
        open={!!editSkuFresh}
        onClose={() => {
          setEditSku(null);
          setEditDirty(false);
        }}
        title={`SKU ${editSkuFresh?.article ?? ''} — ${editSkuFresh ? partnerName(editSkuFresh.partnerId) : ''}`}
        size="xl"
        isDirty={editDirty}
        headerActions={
          editSkuFresh && (
            <Button type="submit" form="sku-form-edit" size="sm" loading={updateSku.isPending}>
              <Save size={14} />
              Сохранить
            </Button>
          )
        }
      >
        {editSkuFresh && (
          <div className="space-y-4">
            <SkuPhotos sku={editSkuFresh} />
            <SkuForm
              formId="sku-form-edit"
              operations={operations}
              partnerTariffs={partnerTariffs}
              defaultValues={editSkuFresh}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditSku(null);
                setEditDirty(false);
              }}
              onDirtyChange={setEditDirty}
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
