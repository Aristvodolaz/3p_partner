import { cn } from '@/lib/utils';

/**
 * Единая шапка страницы: заголовок (serif, фирменный), подпись-счётчик и
 * зона основных действий справа. Раньше повторялась инлайном на каждой
 * странице с расхождениями в отступах и типографике.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 mb-6', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
