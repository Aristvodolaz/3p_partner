import { Clock, X } from 'lucide-react';
import { usePartnerHistory } from '@/hooks/usePartners';
import { FIELD_LABELS } from '@/types/partner';
import { formatDate } from '@/lib/utils';

interface Props {
  partnerId: number;
  partnerName: string;
  onClose: () => void;
}

export function PartnerHistoryDrawer({ partnerId, partnerName, onClose }: Props) {
  const { data: history, isLoading } = usePartnerHistory(partnerId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">История изменений</h2>
            <p className="text-xs text-gray-500 mt-0.5">{partnerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (!history || history.length === 0) && (
            <div className="text-center py-10 text-gray-400">
              <Clock size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">История изменений отсутствует</p>
            </div>
          )}

          {history && history.length > 0 && (
            <ol className="relative border-l border-gray-200 space-y-6 ml-2">
              {history.map((entry) => (
                <li key={entry.id} className="ml-5">
                  <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 ring-4 ring-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <div className="card p-3">
                    <p className="text-xs text-gray-400 mb-1">{formatDate(entry.changedAt)}</p>
                    <p className="text-sm font-medium text-gray-800">
                      {FIELD_LABELS[entry.fieldName] ?? entry.fieldName}
                    </p>
                    {entry.fieldName !== 'CREATE' && (
                      <div className="mt-2 space-y-1">
                        {entry.oldValue !== null && (
                          <p className="text-xs text-red-500 line-through">
                            {entry.oldValue}
                          </p>
                        )}
                        {entry.newValue !== null && (
                          <p className="text-xs text-green-600">{entry.newValue}</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Изменил: {entry.changedBy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
