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
import {
  Dialog,
  ConfirmDialog,
  PageHeader,
  Button,
  Input,
  Select,
  Textarea,
  Field,
  Badge,
  statusTone,
  EmptyState,
  Skeleton,
  SegmentedControl,
  TableContainer,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from '@/components/ui';
import { exportInv5ToExcel } from '@/lib/exportInv5';
import type { InventoryTask } from '@/types/inventory';
import { formatDate } from '@/lib/utils';

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
      <PageHeader
        title="Инвентаризация"
        subtitle={data?.total ? `${data.total} заданий` : 'Заданий нет'}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Создать задание
          </Button>
        }
      />

      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Заданий нет"
          description="Создайте задание по остаткам партнёра или по всему складу"
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Создать задание
            </Button>
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>№ ИНВ</TH>
              <TH>Партнёр</TH>
              <TH>Источник</TH>
              <TH align="center">Позиций</TH>
              <TH>Исполнители</TH>
              <TH>Статус</TH>
              <TH align="right">Действия</TH>
            </THead>
            <TBody>
              {tasks.map((t) => (
                <TR key={t.id}>
                  <TD className="font-mono text-[13px] font-medium text-gray-900 whitespace-nowrap">
                    {t.number}
                  </TD>
                  <TD className="text-gray-600">{t.partner?.name ?? 'Весь склад'}</TD>
                  <TD className="text-xs text-gray-500">
                    {t.source === 'PARTNER' ? 'По инициативе партнёра' : 'Внутренняя'}
                  </TD>
                  <TD align="center">{t.items.length}</TD>
                  <TD className="text-xs text-gray-500">
                    {t.executors.length ? t.executors.map((e) => e.employeeId).join(', ') : '—'}
                  </TD>
                  <TD>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </TD>
                  <TD align="right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => setHistoryTarget(t)} title="История">
                        <History size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => exportInv5ToExcel(t)} title="Экспорт ИНВ-5">
                        <FileDown size={14} />
                      </Button>
                      {t.status !== 'Выполнено' && t.status !== 'Отмена' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => setExecTarget(t)} title="Исполнители">
                            <UserPlus size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setCountTarget(t)} title="Пересчёт">
                            <ClipboardCheck size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-amber-600 hover:bg-amber-50"
                            onClick={() => setCancelTarget(t)}
                            title="Отменить"
                          >
                            <Ban size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
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
        <Field label="Источник">
          <SegmentedControl
            aria-label="Источник задания"
            value={source}
            onChange={setSource}
            segments={[
              { label: 'По инициативе партнёра', value: 'PARTNER' },
              { label: 'Внутренняя (весь склад)', value: 'INTERNAL' },
            ]}
          />
        </Field>

        {source === 'PARTNER' && (
          <Field label="Партнёр" required htmlFor="inv-partner">
            <Select
              id="inv-partner"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Выберите...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Артикулы (по одному в строке или через запятую)" htmlFor="inv-articles">
          <Textarea
            id="inv-articles"
            value={articlesText}
            onChange={(e) => setArticlesText(e.target.value)}
            rows={4}
            placeholder="Оставьте пустым, чтобы взять все артикулы на остатках"
          />
        </Field>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={handleClose} disabled={create.isPending}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} loading={create.isPending}>
            Создать
          </Button>
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
        <TableContainer>
          <Table>
            <THead>
              <TH>Артикул</TH>
              <TH>Место хранения</TH>
              <TH align="center">По учёту</TH>
              <TH align="center">Факт</TH>
            </THead>
            <TBody>
              {task.items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-mono text-xs">{item.article}</TD>
                  <TD className="text-gray-500">{item.address ?? '—'}</TD>
                  <TD align="center" className="text-gray-500">{item.expectedQty}</TD>
                  <TD align="center" className="w-28">
                    <Input
                      aria-label={`Факт по ${item.article}`}
                      value={counts[item.id] ?? ''}
                      onChange={(e) => setCounts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      inputMode="numeric"
                      className="text-center py-1"
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
        <p className="text-xs text-gray-400">
          Задание могут считать несколько исполнителей — каждый присылает факт по своим позициям.
          Когда факт указан по всем — задание переходит в «Выполнено».
        </p>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={count.isPending}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} loading={count.isPending}>
            Подтвердить пересчёт
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ExecutorsDialog({ task, onClose }: { task: InventoryTask; onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
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
                  onClick={() => setRemoveTarget(e.employeeId)}
                  aria-label={`Снять ${e.employeeId}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <ConfirmDialog
          open={removeTarget !== null}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => {
            if (removeTarget) remove.mutate(removeTarget);
            setRemoveTarget(null);
          }}
          title="Снять исполнителя"
          description={`Снять сотрудника ${removeTarget} с этого задания?`}
          confirmLabel="Снять"
          danger
          loading={remove.isPending}
        />
        <div className="flex gap-2">
          <Input
            aria-label="Табельный номер исполнителя"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Табельный номер / ШК"
            className="flex-1"
          />
          <Button onClick={handleAdd} loading={add.isPending}>
            Добавить
          </Button>
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
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : !history?.length ? (
        <p className="text-sm text-gray-400 py-8 text-center">Изменений ещё не было</p>
      ) : (
        <ol className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="flex items-start gap-3 text-sm">
              <Badge tone={statusTone(h.status)}>{h.status}</Badge>
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
