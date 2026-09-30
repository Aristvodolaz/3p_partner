import { cn } from '@/lib/utils';

/** Подчёркнутые вкладки уровня страницы (в отличие от pill-SegmentedControl). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-gray-200 overflow-x-auto', className)}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-t',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
