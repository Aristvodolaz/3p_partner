import { cn } from '@/lib/utils';

/**
 * Композируемые примитивы таблицы для B2B-данных: карточка-обёртка с
 * горизонтальным скроллом, липкая шапка, компактные строки с hover.
 * Страницы сохраняют полный контроль над колонками.
 */
export function TableContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn('w-full text-sm border-collapse', className)}>{children}</table>;
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-50/80 sticky top-0 z-10">
      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
        {children}
      </tr>
    </thead>
  );
}

export function TH({
  children,
  align = 'left',
  className,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-4 py-3 font-medium whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      scope="col"
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TR({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer',
        'hover:bg-gray-50',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  align = 'left',
  className,
  onClick,
  title,
  colSpan,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  onClick?: () => void;
  title?: string;
  colSpan?: number;
}) {
  return (
    <td
      onClick={onClick}
      title={title}
      colSpan={colSpan}
      className={cn(
        'px-4 py-2.5 text-gray-700 align-middle',
        align === 'right' && 'text-right tabular-nums',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}
