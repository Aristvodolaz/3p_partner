import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Доп. действия в шапке рядом с заголовком (например, кнопка «Сохранить») */
  headerActions?: React.ReactNode;
  /** Если true — при попытке закрыть (клик вне окна или на ✕) спросит подтверждение */
  isDirty?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'md',
  headerActions,
  isDirty = false,
}: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  const requestClose = () => {
    if (isDirty && !window.confirm('Есть несохранённые изменения. Закрыть без сохранения?')) {
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={requestClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]',
          sizeClass,
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={requestClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
