import { cn } from '@/design-revamp/lib/utils';

interface StatusMetricCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'success' | 'info' | 'danger';
  active?: boolean;
  onClick?: () => void;
}

const toneStyles = {
  default: 'border-border',
  warning: 'border-amber-300 dark:border-amber-800',
  success: 'border-green-300 dark:border-green-800',
  info: 'border-blue-300 dark:border-blue-800',
  danger: 'border-red-300 dark:border-red-800',
};

const valueToneStyles = {
  default: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-green-600 dark:text-green-400',
  info: 'text-blue-600 dark:text-blue-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function StatusMetricCard({ label, value, tone = 'default', active, onClick }: StatusMetricCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[48px] flex-col items-start gap-1 rounded-lg border bg-card p-4 text-left transition-all',
        'hover:shadow-md active:scale-[0.98]',
        toneStyles[tone],
        active && 'ring-2 ring-primary/40',
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-2xl font-bold tabular-nums', valueToneStyles[tone])}>
        {value}
      </span>
    </button>
  );
}
