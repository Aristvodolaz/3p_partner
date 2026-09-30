import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ring-1 ring-inset',
  {
    variants: {
      tone: {
        gray: 'bg-gray-100 text-gray-600 ring-gray-500/10',
        green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
        red: 'bg-red-50 text-red-700 ring-red-600/15',
        amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
        blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
        primary: 'bg-primary-50 text-primary-700 ring-primary-600/15',
      },
    },
    defaultVariants: { tone: 'gray' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Единое соответствие статусов документов → тон бейджа (ВХП/ИСП/Инвентаризация). */
export function statusTone(status: string): NonNullable<BadgeProps['tone']> {
  switch (status) {
    case 'Выполнено':
      return 'green';
    case 'Отмена':
      return 'red';
    case 'Процесс':
      return 'amber';
    case 'Создана':
      return 'blue';
    default:
      return 'gray';
  }
}
