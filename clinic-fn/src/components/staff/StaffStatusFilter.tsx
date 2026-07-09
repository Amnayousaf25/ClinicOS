import { cn } from '@/lib/utils';
import type { StatusFilter } from './types';

interface Props {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
  total: number;
  active: number;
  inactive: number;
}

const TABS: ReadonlyArray<readonly [StatusFilter, string]> = [
  ['all', 'All'],
  ['active', 'Active'],
  ['inactive', 'Inactive'],
];

export const StaffStatusFilter = ({
  value,
  onChange,
  total,
  active,
  inactive,
}: Props) => {
  const counts: Record<StatusFilter, number> = {
    all: total,
    active,
    inactive,
  };

  return (
    <div className="flex gap-1 bg-muted rounded-xl p-1">
      {TABS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            value === key
              ? 'bg-card text-foreground shadow-3d'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label} <span className="ml-1 opacity-70">({counts[key]})</span>
        </button>
      ))}
    </div>
  );
};
