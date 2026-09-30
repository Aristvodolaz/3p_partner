import { cn } from '@/lib/utils';

export interface Segment<T> {
  label: string;
  value: T;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

/**
 * Единый переключатель-сегменты: фильтры статусов, вид (grid/list) и пр.
 * Раньше на каждой странице собирался вручную из кнопок с разными стилями.
 */
export function SegmentedControl<T extends string | number | boolean | undefined>({
  segments,
  value,
  onChange,
  size = 'md',
  'aria-label': ariaLabel,
}: {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1"
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={String(s.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800',
            )}
          >
            {s.icon && <s.icon size={size === 'sm' ? 14 : 16} />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
