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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ZONE_TYPES, ZONE_TYPE_LABELS, type ZoneType } from '@/types/storage';
import { formatDate } from '@/lib/utils';

const TABS = [
  { key: 'report', label: 'Отчёт по остаткам' },
  { key: 'zones', label: 'Зоны и адреса' },
  { key: 'tasks', label: 'Задания на перемещение' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_STYLES: Record<string, string> = {
  Создана: 'bg-gray-100 text-gray-600 ring-gray-500/10',
  Процесс: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  Выполнено: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  Отмена: 'bg-red-50 text-red-600 ring-red-600/15',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/10';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  );
}

export function StoragePage() {
  const [tab, setTab] = useState<TabKey>('report');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">Остатки</h1>
        <p className="text-sm text-gray-500 mt-1">Остатки по адресам хранения, зоны склада, задания на перемещение</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
        <select
          value={partnerId ?? ''}
          onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : undefined)}
          className="input sm:max-w-xs"
        >
          <option value="">Все партнёры</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          placeholder="Артикул..."
          className="input sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ) : !rows?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Остатков нет</h3>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Партнёр</th>
                  <th className="px-4 py-3 font-medium">Артикул</th>
                  <th className="px-4 py-3 font-medium">Партия</th>
                  <th className="px-4 py-3 font-medium">Адрес</th>
                  <th className="px-4 py-3 font-medium">Зона</th>
                  <th className="px-4 py-3 font-medium text-right">Кол-во</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{r.partnerName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.article}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.batchNumber ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.address}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.zoneType ? ZONE_TYPE_LABELS[r.zoneType] : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
          <input
            value={zoneForm.code}
            onChange={(e) => setZoneForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Код"
            className="input w-24 text-sm"
          />
          <input
            value={zoneForm.name}
            onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Наименование"
            className="input flex-1 text-sm"
          />
          <select
            value={zoneForm.type}
            onChange={(e) => setZoneForm((f) => ({ ...f, type: e.target.value as ZoneType }))}
            className="input w-28 text-sm"
          >
            {ZONE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} — {ZONE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button className="btn-primary text-sm px-3" onClick={handleCreateZone} disabled={createZone.isPending}>
            <Plus size={14} />
          </button>
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
          <input
            value={addressForm.code}
            onChange={(e) => setAddressForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Код адреса"
            className="input flex-1 text-sm"
          />
          <select
            value={addressForm.zoneId}
            onChange={(e) => setAddressForm((f) => ({ ...f, zoneId: e.target.value }))}
            className="input w-36 text-sm"
          >
            <option value="">Зона...</option>
            {(zones ?? []).map((z) => (
              <option key={z.id} value={z.id}>
                {z.code}
              </option>
            ))}
          </select>
          <button className="btn-primary text-sm px-3" onClick={handleCreateAddress} disabled={createAddress.isPending}>
            <Plus size={14} />
          </button>
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
                {!a.isActive && <span className="badge-gray badge text-[10px]">неактивен</span>}
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
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      ) : !tasks.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Заданий нет</h3>
          <p className="text-sm text-gray-400 mt-1">
            Формируются автоматически при создании ИСП и выполняются на ТСД
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">№ ПРМ</th>
                  <th className="px-4 py-3 font-medium text-center">Позиций</th>
                  <th className="px-4 py-3 font-medium text-center">Перемещено</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t) => {
                  const done = t.items.filter((i) => i.status === 'Перемещено').length;
                  return (
                    <Fragment key={t.id}>
                      <tr
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      >
                        <td className="px-4 py-3 font-mono text-[13px] font-medium text-gray-900 whitespace-nowrap">
                          {t.number}
                        </td>
                        <td className="px-4 py-3 text-center">{t.items.length}</td>
                        <td className="px-4 py-3 text-center">
                          {done}/{t.items.length}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            {t.status !== 'Выполнено' && t.status !== 'Отмена' && (
                              <button
                                className="btn-ghost text-xs p-2 text-amber-600 hover:bg-amber-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelTarget(t.id);
                                }}
                                title="Отменить"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
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
              </tbody>
            </table>
          </div>
        </div>
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
