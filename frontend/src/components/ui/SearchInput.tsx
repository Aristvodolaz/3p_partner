import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Поле поиска с иконкой и кнопкой очистки — единый вид на всех страницах. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск...',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative flex-1 max-w-md', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        role="searchbox"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Очистить поиск"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
