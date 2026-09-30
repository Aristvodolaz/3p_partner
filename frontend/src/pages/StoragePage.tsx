import { Fragment, useMemo, useState } from 'react';
import { Ban, MapPin, Package, Plus, Trash2 } from 'lucide-react';
import { usePartners } from '@/hooks/usePartners';
import { useStorageReport } from '@/hooks/useStorage';
import {
  useCreateStorageAddress,
  useCreateWarehouseZone,
  useDeleteStorageAddress,
  useDeleteWarehouseZone,
  useStorageAddresses,
  useWarehouseZones,
} from '@/hooks/useWarehouseZones';
import { useCancelMovementTask, useMovementTasks } from '@/hooks/useMovementTasks';
import {
  ConfirmDialog,
  PageHeader,
  Button,
  Input,
  Select,
  Badge,
  statusTone,
  EmptyState,
  Skeleton,
  Tabs,
  TableContainer,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from '@/components/ui';
import { ZONE_TYPES, ZONE_TYPE_LABELS, type ZoneType } from '@/types/storage';
import { formatDate } from '@/lib/utils';

const TABS = [
  { key: 'report', label: 'Отчёт по остаткам' },
  { key: 'zones', label: 'Зоны и адреса' },
  { key: 'tasks', label: 'Задания на перемещение' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function StoragePage() {
  const [tab, setTab] = useState<TabKey>('report');

  return (
    <div>
      <PageHeader
        title="Остатки"
        subtitle="Остатки по адресам хранения, зоны склада, задания на перемещение"
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'report' && <ReportTab />}
      {tab === 'zones' && <ZonesTab />}
      {tab === 'tasks' && <TasksTab />}
    </div>
  );
}

function ReportTab() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [article, setArticle] = useState('');

  const { data: partnersData } = usePartners();
  const { data: rows, isLoading } = useStorageReport({ partnerId, article: article || undefined });
  const partners = partnersData?.data ?? [];

  return (
    <div>
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
        <Input
          aria-label="Артикул"
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          placeholder="Артикул..."
          className="sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : !rows?.length ? (
        <EmptyState icon={Package} title="Остатков нет" />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>Партнёр</TH>
              <TH>Артикул</TH>
              <TH>Партия</TH>
              <TH>Адрес</TH>
              <TH>Зона</TH>
              <TH align="right">Кол-во</TH>
            </THead>
            <TBody>
              {rows.map((r, i) => (
                <TR key={i}>
                  <TD className="text-gray-600">{r.partnerName}</TD>
                  <TD className="font-mono text-xs">{r.article}</TD>
                  <TD className="text-xs text-gray-500">{r.batchNumber ?? '—'}</TD>
                  <TD className="font-mono text-xs">{r.address}</TD>
                  <TD className="text-xs text-gray-500">
                    {r.zoneType ? ZONE_TYPE_LABELS[r.zoneType] : '—'}
                  </TD>
                  <TD align="right" className="font-medium">{r.quantity}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

function ZonesTab() {
  const { data: zones } = useWarehouseZones();
  const { data: addresses } = useStorageAddresses();
  const createZone = useCreateWarehouseZone();
  const deleteZone = useDeleteWarehouseZone();
  const createAddress = useCreateStorageAddress();
  const deleteAddress = useDeleteStorageAddress();

  const [zoneForm, setZoneForm] = useState({ code: '', name: '', type: 'S' as ZoneType });
  const [addressForm, setAddressForm] = useState({ code: '', zoneId: '' });
  const [deleteZoneTarget, setDeleteZoneTarget] = useState<number | null>(null);
  const [deleteAddressTarget, setDeleteAddressTarget] = useState<number | null>(null);

  const handleCreateZone = async () => {
    if (!zoneForm.code.trim() || !zoneForm.name.trim()) return;
    await createZone.mutateAsync(zoneForm);
    setZoneForm({ code: '', name: '', type: 'S' });
  };

  const handleCreateAddress = async () => {
    if (!addressForm.code.trim() || !addressForm.zoneId) return;
    await createAddress.mutateAsync({ code: addressForm.code.trim(), zoneId: Number(addressForm.zoneId) });
    setAddressForm({ code: '', zoneId: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Зоны</h3>
        <div className="flex gap-2 mb-4">
          <Input
            aria-label="Код зоны"
            value={zoneForm.code}
            onChange={(e) => setZoneForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Код"
            className="w-24 text-sm"
          />
          <Input
            aria-label="Наименование зоны"
            value={zoneForm.name}
            onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Наименование"
            className="flex-1 text-sm"
          />
          <Select
            aria-label="Тип зоны"
            value={zoneForm.type}
            onChange={(e) => setZoneForm((f) => ({ ...f, type: e.target.value as ZoneType }))}
            className="w-28 text-sm"
          >
            {ZONE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} — {ZONE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Button size="sm" className="px-3" onClick={handleCreateZone} loading={createZone.isPending}>
            <Plus size={14} />
          </Button>
        </div>
        <div className="divide-y divide-gray-100">
          {(zones ?? []).map((z) => (
            <div key={z.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-mono text-xs text-gray-500 mr-2">{z.code}</span>
                <span className="text-gray-800">{z.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  ({z.type} — {ZONE_TYPE_LABELS[z.type]})
                </span>
              </div>
              <button
                className="text-gray-300 hover:text-red-500 transition-colors"
                onClick={() => setDeleteZoneTarget(z.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!zones?.length && <p className="text-sm text-gray-400 py-4">Зон пока нет</p>}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Адреса</h3>
        <div className="flex gap-2 mb-4">
          <Input
            aria-label="Код адреса"
            value={addressForm.code}
            onChange={(e) => setAddressForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Код адреса"
            className="flex-1 text-sm"
          />
          <Select
            aria-label="Зона адреса"
            value={addressForm.zoneId}
            onChange={(e) => setAddressForm((f) => ({ ...f, zoneId: e.target.value }))}
            className="w-36 text-sm"
          >
            <option value="">Зона...</option>
            {(zones ?? []).map((z) => (
              <option key={z.id} value={z.id}>
                {z.code}
              </option>
            ))}
          </Select>
          <Button size="sm" className="px-3" onClick={handleCreateAddress} loading={createAddress.isPending}>
            <Plus size={14} />
          </Button>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {(addresses ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-gray-300" />
                <span className="font-mono text-xs">{a.code}</span>
                <span className="text-xs text-gray-400">
                  ({a.zone.code} — {ZONE_TYPE_LABELS[a.zone.type]})
                </span>
                {!a.isActive && <Badge tone="gray" className="text-[10px]">неактивен</Badge>}
              </div>
              <button
                className="text-gray-300 hover:text-red-500 transition-colors"
                onClick={() => setDeleteAddressTarget(a.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!addresses?.length && <p className="text-sm text-gray-400 py-4">Адресов пока нет</p>}
        </div>
      </div>

      <ConfirmDialog
        open={deleteZoneTarget != null}
        onClose={() => setDeleteZoneTarget(null)}
        onConfirm={async () => {
          if (deleteZoneTarget != null) await deleteZone.mutateAsync(deleteZoneTarget);
          setDeleteZoneTarget(null);
        }}
        title="Удалить зону?"
        description="Зону можно удалить только если у неё нет адресов."
        confirmLabel="Удалить"
        danger
        loading={deleteZone.isPending}
      />
      <ConfirmDialog
        open={deleteAddressTarget != null}
        onClose={() => setDeleteAddressTarget(null)}
        onConfirm={async () => {
          if (deleteAddressTarget != null) await deleteAddress.mutateAsync(deleteAddressTarget);
          setDeleteAddressTarget(null);
        }}
        title="Удалить адрес?"
        description="Адрес можно удалить только если по нему ещё не было движений — иначе деактивируйте его."
        confirmLabel="Удалить"
        danger
        loading={deleteAddress.isPending}
      />
    </div>
  );
}

function TasksTab() {
  const { data: addresses } = useStorageAddresses();
  const { data, isLoading } = useMovementTasks();
  const cancelTask = useCancelMovementTask();
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const addressById = useMemo(() => new Map((addresses ?? []).map((a) => [a.id, a.code])), [addresses]);
  const tasks = data?.data ?? [];

  return (
    <div>
      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !tasks.length ? (
        <EmptyState
          icon={Package}
          title="Заданий нет"
          description="Формируются автоматически при создании ИСП и выполняются на ТСД"
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>№ ПРМ</TH>
              <TH align="center">Позиций</TH>
              <TH align="center">Перемещено</TH>
              <TH>Статус</TH>
              <TH align="right">Действия</TH>
            </THead>
            <TBody>
              {tasks.map((t) => {
                const done = t.items.filter((i) => i.status === 'Перемещено').length;
                return (
                  <Fragment key={t.id}>
                    <TR onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                      <TD className="font-mono text-[13px] font-medium text-gray-900 whitespace-nowrap">
                        {t.number}
                      </TD>
                      <TD align="center">{t.items.length}</TD>
                      <TD align="center">
                        {done}/{t.items.length}
                      </TD>
                      <TD>
                        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                      </TD>
                      <TD align="right">
                        {t.status !== 'Выполнено' && t.status !== 'Отмена' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-amber-600 hover:bg-amber-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelTarget(t.id);
                            }}
                            title="Отменить"
                          >
                            <Ban size={14} />
                          </Button>
                        )}
                      </TD>
                    </TR>
                    {expanded === t.id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 bg-gray-50">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-gray-500">
                                  <th className="py-1 pr-3 font-medium">Артикул</th>
                                  <th className="py-1 pr-3 font-medium">Адрес-источник</th>
                                  <th className="py-1 pr-3 font-medium text-center">Кол-во</th>
                                  <th className="py-1 pr-3 font-medium">Статус</th>
                                  <th className="py-1 pr-3 font-medium">Адрес назначения</th>
                                  <th className="py-1 font-medium">Исполнитель</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {t.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="py-1.5 pr-3 font-mono">{item.article}</td>
                                    <td className="py-1.5 pr-3 font-mono">
                                      {item.sourceAddressId ? addressById.get(item.sourceAddressId) ?? '—' : '—'}
                                    </td>
                                    <td className="py-1.5 pr-3 text-center">{item.quantity}</td>
                                    <td className="py-1.5 pr-3">{item.status}</td>
                                    <td className="py-1.5 pr-3 font-mono">
                                      {item.targetAddressId ? addressById.get(item.targetAddressId) ?? '—' : '—'}
                                    </td>
                                    <td className="py-1.5">
                                      {item.confirmedBy ? `${item.confirmedBy} · ${formatDate(item.confirmedAt!)}` : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </TBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={cancelTarget != null}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (cancelTarget != null) await cancelTask.mutateAsync(cancelTarget);
          setCancelTarget(null);
        }}
        title="Отменить задание?"
        description="Задание перейдёт в статус «Отмена»."
        confirmLabel="Отменить"
        danger
        loading={cancelTask.isPending}
      />
    </div>
  );
}
