import { useState } from 'react';
import {
  Ban,
  ClipboardCheck,
  FileDown,
  History,
  ListChecks,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePartners } from '@/hooks/usePartners';
import {
  useAddExecutor,
  useCancelInventoryTask,
  useCountInventoryTask,
  useCreateInventoryTask,
  useInventoryHistory,
  useInventoryTasks,
  useRemoveExecutor,
} from '@/hooks/useInventory';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportInv5ToExcel } from '@/lib/exportInv5';
import type { InventoryTask } from '@/types/inventory';
import { formatDate } from '@/lib/utils';

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

export function InventoryPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [countTarget, setCountTarget] = useState<InventoryTask | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryTask | null>(null);
  const [execTarget, setExecTarget] = useState<InventoryTask | null>(null);
  const [cancelTarget, setCancelTarget] = useState<InventoryTask | null>(null);

  const { data, isLoading } = useInventoryTasks();
  const cancelTask = useCancelInventoryTask();

  const tasks = data?.data ?? [];

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await cancelTask.mutateAsync(cancelTarget.id);
    setCancelTarget(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">Инвентаризация</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ? `${data.total} заданий` : 'Заданий нет'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Создать задание
        </button>
      </div>

      {isLoading ? (
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ListChecks size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Заданий нет</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Создайте задание по остаткам партнёра или по всему складу
          </p>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Создать задание
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">№ ИНВ</th>
                  <th className="px-4 py-3 font-medium">Партнёр</th>
                  <th className="px-4 py-3 font-medium">Источник</th>
                  <th className="px-4 py-3 font-medium text-center">Позиций</th>
                  <th className="px-4 py-3 font-medium">Исполнители</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[13px] font-medium text-gray-900 whitespace-nowrap">
                      {t.number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.partner?.name ?? 'Весь склад'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {t.source === 'PARTNER' ? 'По инициативе партнёра' : 'Внутренняя'}
                    </td>
                    <td className="px-4 py-3 text-center">{t.items.length}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {t.executors.length ? t.executors.map((e) => e.employeeId).join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button className="btn-ghost text-xs p-2" onClick={() => setHistoryTarget(t)} title="История">
                          <History size={14} />
                        </button>
                        <button className="btn-ghost text-xs p-2" onClick={() => exportInv5ToExcel(t)} title="Экспорт ИНВ-5">
                          <FileDown size={14} />
                        </button>
                        {t.status !== 'Выполнено' && t.status !== 'Отмена' && (
                          <>
                            <button className="btn-ghost text-xs p-2" onClick={() => setExecTarget(t)} title="Исполнители">
                              <UserPlus size={14} />
                            </button>
                            <button className="btn-ghost text-xs p-2" onClick={() => setCountTarget(t)} title="Пересчёт">
                              <ClipboardCheck size={14} />
                            </button>
                            <button
                              className="btn-ghost text-xs p-2 text-amber-600 hover:bg-amber-50"
                              onClick={() => setCancelTarget(t)}
                              title="Отменить"
                            >
                              <Ban size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {countTarget && <CountDialog task={countTarget} onClose={() => setCountTarget(null)} />}
      {execTarget && <ExecutorsDialog task={execTarget} onClose={() => setExecTarget(null)} />}
      {historyTarget && <HistoryDialog task={historyTarget} onClose={() => setHistoryTarget(null)} />}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Отменить задание?"
        description={`Задание «${cancelTarget?.number}» перейдёт в статус «Отмена».`}
        confirmLabel="Отменить"
        danger
        loading={cancelTask.isPending}
      />
    </div>
  );
}

function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: partnersData } = usePartners();
  const [source, setSource] = useState<'PARTNER' | 'INTERNAL'>('PARTNER');
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const [articlesText, setArticlesText] = useState('');
  const create = useCreateInventoryTask();

  const partners = partnersData?.data ?? [];

  const handleClose = () => {
    setSource('PARTNER');
    setPartnerId('');
    setArticlesText('');
    onClose();
  };

  const handleSubmit = async () => {
    if (source === 'PARTNER' && !partnerId) {
      toast.error('Выберите партнёра');
      return;
    }
    const articles = articlesText
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    await create.mutateAsync({
      source,
      partnerId: source === 'PARTNER' ? Number(partnerId) : undefined,
      articles: articles.length ? articles : undefined,
      all: articles.length === 0,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Создать задание на инвентаризацию" size="md">
      <div className="space-y-4">
        <div>
          <label className="label">Источник</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn text-sm px-4 py-2 flex-1 ${source === 'PARTNER' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
              onClick={() => setSource('PARTNER')}
            >
              По инициативе партнёра
            </button>
            <button
              type="button"
              className={`btn text-sm px-4 py-2 flex-1 ${source === 'INTERNAL' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
              onClick={() => setSource('INTERNAL')}
            >
              Внутренняя (весь склад)
            </button>
          </div>
        </div>

        {source === 'PARTNER' && (
          <div>
            <label className="label">Партнёр *</label>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')} className="input">
              <option value="">Выберите...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Артикулы (по одному в строке или через запятую)</label>
          <textarea
            value={articlesText}
            onChange={(e) => setArticlesText(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Оставьте пустым, чтобы взять все артикулы на остатках"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={create.isPending}>
            Отмена
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function CountDialog({ task, onClose }: { task: InventoryTask; onClose: () => void }) {
  const [counts, setCounts] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      task.items.map((i) => [i.id, i.countedQty != null ? String(i.countedQty) : String(i.expectedQty)]),
    ),
  );
  const count = useCountInventoryTask(task.id);

  const handleSubmit = async () => {
    const items = Object.entries(counts)
      .map(([itemId, v]) => ({ itemId: Number(itemId), countedQty: Number(v) }))
      .filter((i) => Number.isFinite(i.countedQty) && i.countedQty >= 0);
    if (!items.length) {
      toast.error('Укажите факт хотя бы по одной позиции');
      return;
    }
    await count.mutateAsync(items);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={`Пересчёт — ${task.number}`} size="lg">
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">Артикул</th>
                <th className="px-3 py-2 font-medium">Место хранения</th>
                <th className="px-3 py-2 font-medium text-center">По учёту</th>
                <th className="px-3 py-2 font-medium text-center w-28">Факт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {task.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-mono text-xs">{item.article}</td>
                  <td className="px-3 py-2 text-gray-500">{item.address ?? '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{item.expectedQty}</td>
                  <td className="px-3 py-2">
                    <input
                      value={counts[item.id] ?? ''}
                      onChange={(e) => setCounts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      inputMode="numeric"
                      className="input text-center py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          Задание могут считать несколько исполнителей — каждый присылает факт по своим позициям.
          Когда факт указан по всем — задание переходит в «Выполнено».
        </p>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={count.isPending}>
            Отмена
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={count.isPending}>
            {count.isPending ? 'Сохранение...' : 'Подтвердить пересчёт'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function ExecutorsDialog({ task, onClose }: { task: InventoryTask; onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const add = useAddExecutor(task.id);
  const remove = useRemoveExecutor(task.id);

  const handleAdd = async () => {
    if (!employeeId.trim()) return;
    await add.mutateAsync(employeeId.trim());
    setEmployeeId('');
  };

  return (
    <Dialog open onClose={onClose} title={`Исполнители — ${task.number}`} size="sm">
      <div className="space-y-4">
        <div className="space-y-1">
          {task.executors.length === 0 ? (
            <p className="text-sm text-gray-400">Исполнители не назначены</p>
          ) : (
            task.executors.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
                <span>{e.employeeId}</span>
                <button
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  onClick={() => remove.mutate(e.employeeId)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Табельный номер / ШК"
            className="input flex-1"
          />
          <button className="btn-primary" onClick={handleAdd} disabled={add.isPending}>
            Добавить
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function HistoryDialog({ task, onClose }: { task: InventoryTask; onClose: () => void }) {
  const { data: history, isLoading } = useInventoryHistory(task.id);

  return (
    <Dialog open onClose={onClose} title={`История статусов — ${task.number}`} size="sm">
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ) : !history?.length ? (
        <p className="text-sm text-gray-400 py-8 text-center">Изменений ещё не было</p>
      ) : (
        <ol className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="flex items-start gap-3 text-sm">
              <StatusBadge status={h.status} />
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
