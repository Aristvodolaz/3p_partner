import { Dialog } from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Отмена
        </button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
