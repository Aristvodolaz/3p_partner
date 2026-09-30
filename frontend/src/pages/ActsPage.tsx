import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { usePartners } from '@/hooks/usePartners';
import { useOutgoingDeliveries } from '@/hooks/useOutgoingDeliveries';
import { outgoingTotal } from '@/types/outgoingDelivery';
import { useActs, useGenerateAct } from '@/hooks/useActs';
import { exportActToExcel } from '@/lib/exportAct';
import {
  PageHeader,
  Button,
  Select,
  Input,
  Field,
  TableContainer,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from '@/components/ui';
import { ACT_TYPE_LABELS, type Act, type ActType } from '@/types/act';

const ACT_TYPES: ActType[] = ['REQUEST', 'ON_DEMAND', 'MONTHLY'];

export function ActsPage() {
  const [partnerId, setPartnerId] = useState<number | undefined>(undefined);
  const [type, setType] = useState<ActType>('REQUEST');
  const [requestIds, setRequestIds] = useState<number[]>([]);
  const [periodLabel, setPeriodLabel] = useState(() => new Date().toISOString().slice(0, 7));
  const [lastGenerated, setLastGenerated] = useState<Act | null>(null);

  const { data: partnersData } = usePartners();
  const partners = partnersData?.data ?? [];

  const { data: deliveriesData } = useOutgoingDeliveries({ partnerId, status: 'Выполнено' });
  const eligibleRequests = deliveriesData?.data ?? [];

  const { data: acts } = useActs(partnerId);
  const generate = useGenerateAct();

  const toggleRequest = (id: number) => {
    setRequestIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canGenerate = useMemo(() => {
    if (!partnerId) return false;
    if (type === 'MONTHLY') return !!periodLabel;
    return requestIds.length > 0;
  }, [partnerId, type, periodLabel, requestIds]);

  const handleGenerate = async () => {
    if (!partnerId) return;
    const act = await generate.mutateAsync({
      partnerId,
      type,
      requestIds: type === 'MONTHLY' ? undefined : requestIds,
      periodLabel: type === 'MONTHLY' ? periodLabel : undefined,
    });
    setLastGenerated(act);
    setRequestIds([]);
  };

  return (
    <div>
      <PageHeader
        title="Акты выполненных услуг"
        subtitle="Расчёт стоимости по ИСП, по запросу партнёра или за месяц"
      />

      <div className="card p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Партнёр" htmlFor="act-partner">
            <Select
              id="act-partner"
              value={partnerId ?? ''}
              onChange={(e) => {
                setPartnerId(e.target.value ? Number(e.target.value) : undefined);
                setRequestIds([]);
              }}
            >
              <option value="">Выберите партнёра</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Тип" htmlFor="act-type">
            <Select id="act-type" value={type} onChange={(e) => setType(e.target.value as ActType)}>
              {ACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACT_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          {type === 'MONTHLY' && (
            <Field label="Месяц" htmlFor="act-month">
              <Input
                id="act-month"
                type="month"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
              />
            </Field>
          )}
        </div>

        {type !== 'MONTHLY' && partnerId && (
          <div>
            <label className="label">
              ИСП (выполненные) {type === 'REQUEST' ? '— выберите одну' : '— можно несколько'}
            </label>
            {eligibleRequests.length === 0 ? (
              <p className="text-sm text-gray-400">
                У партнёра нет исходящих поставок в статусе «Выполнено»
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {eligibleRequests.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                    <input
                      type={type === 'REQUEST' ? 'radio' : 'checkbox'}
                      name="request"
                      checked={requestIds.includes(r.id)}
                      onChange={() =>
                        type === 'REQUEST' ? setRequestIds([r.id]) : toggleRequest(r.id)
                      }
                      className="h-4 w-4"
                    />
                    <span>
                      {r.number} · {r.status} · {outgoingTotal(r).toLocaleString('ru-RU')} ₽
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleGenerate} loading={generate.isPending} disabled={!canGenerate}>
          <FileSpreadsheet size={16} />
          Сформировать
        </Button>
      </div>

      {lastGenerated && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Акт от {new Date(lastGenerated.createdAt).toLocaleDateString('ru-RU')}
            </h3>
            <Button variant="secondary" size="sm" onClick={() => exportActToExcel(lastGenerated)}>
              <FileDown size={14} />
              Экспорт в Excel
            </Button>
          </div>
          <ActBreakdownTable act={lastGenerated} />
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">История актов</h3>
        {!acts || acts.length === 0 ? (
          <p className="text-sm text-gray-400">Актов пока нет</p>
        ) : (
          <TableContainer>
            <Table>
              <THead>
                <TH>Дата</TH>
                <TH>Партнёр</TH>
                <TH>Тип</TH>
                <TH>Период/заявки</TH>
                <TH align="right">Сумма</TH>
                <TH align="right">Действия</TH>
              </THead>
              <TBody>
                {acts.map((a) => (
                  <TR key={a.id}>
                    <TD className="whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                    </TD>
                    <TD>{a.partner?.name ?? a.breakdown.partnerName}</TD>
                    <TD>{ACT_TYPE_LABELS[a.type]}</TD>
                    <TD className="text-xs text-gray-500">
                      {a.periodLabel ?? a.requests.map((r) => r.requestNumber).join(', ')}
                    </TD>
                    <TD align="right" className="whitespace-nowrap">
                      {a.totalAmount.toLocaleString('ru-RU')} ₽
                    </TD>
                    <TD align="right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Экспорт в Excel"
                        onClick={() => exportActToExcel(a)}
                      >
                        <FileDown size={14} />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}

function ActBreakdownTable({ act }: { act: Act }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs text-gray-500">
            <th className="px-3 py-2 font-medium">№ ИСП</th>
            <th className="px-3 py-2 font-medium">Артикул</th>
            <th className="px-3 py-2 font-medium">Операция</th>
            <th className="px-3 py-2 font-medium text-center">Кол-во</th>
            <th className="px-3 py-2 font-medium text-right">Тариф</th>
            <th className="px-3 py-2 font-medium text-right">Сумма</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {act.breakdown.requests.flatMap((r) =>
            r.items.flatMap((item, itemIdx) => {
              const operations = item.operations ?? [];
              const rows =
                operations.length > 0
                  ? operations.map((op, opIdx) => (
                      <tr key={`${r.requestId}-${itemIdx}-${opIdx}`}>
                        <td className="px-3 py-1.5 text-gray-500">
                          {itemIdx === 0 && opIdx === 0 ? r.requestNumber : ''}
                        </td>
                        <td className="px-3 py-1.5">
                          {opIdx === 0 ? `${item.article} — ${item.name ?? ''}` : ''}
                        </td>
                        <td className="px-3 py-1.5 text-gray-600">
                          {op.operationName}
                          {op.unit ? ` (${op.unit})` : ''}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {opIdx === 0 ? item.quantity : ''}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {op.tariff.toLocaleString('ru-RU')} ₽ × {op.qty}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {op.amount.toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    ))
                  : [
                      <tr key={`${r.requestId}-${itemIdx}-noop`}>
                        <td className="px-3 py-1.5 text-gray-500">
                          {itemIdx === 0 ? r.requestNumber : ''}
                        </td>
                        <td className="px-3 py-1.5">
                          {item.article} — {item.name ?? ''}
                        </td>
                        <td className="px-3 py-1.5 text-gray-400" colSpan={2}>
                          операции не заведены в справочнике
                        </td>
                        <td className="px-3 py-1.5 text-right">—</td>
                        <td className="px-3 py-1.5 text-right">
                          {item.totalCost.toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>,
                    ];
              return rows;
            }),
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 font-semibold">
            <td className="px-3 py-2" colSpan={5}>
              Итого
            </td>
            <td className="px-3 py-2 text-right">{act.totalAmount.toLocaleString('ru-RU')} ₽</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
