import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  partnerName: string;
  loading?: boolean;
}

/**
 * Безвозвратное удаление — в отличие от «Деактивировать» стирает партнёра
 * и всё связанное (заявки, SKU, тарифы, акты, история), поэтому вместо
 * обычного ConfirmDialog просим набрать название партнёра.
 */
export function DeletePartnerDialog({ open, onClose, onConfirm, partnerName, loading }: Props) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === partnerName;

  const handleClose = () => {
    setTyped('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Удалить партнёра безвозвратно" size="sm">
      <div className="flex gap-3 mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          Будут безвозвратно удалены партнёр «{partnerName}», все его заявки, справочник SKU,
          тарифы, акты и история изменений. Это нельзя отменить — если нужно временно скрыть
          партнёра, используйте «Деактивировать».
        </p>
      </div>
      <label className="label">
        Чтобы подтвердить, введите название партнёра: <b>{partnerName}</b>
      </label>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="input mb-4"
        autoFocus
      />
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={handleClose} disabled={loading}>
          Отмена
        </button>
        <button
          className="btn-danger"
          onClick={onConfirm}
          disabled={!matches || loading}
        >
          {loading ? 'Удаление...' : 'Удалить безвозвратно'}
        </button>
      </div>
    </Dialog>
  );
}
