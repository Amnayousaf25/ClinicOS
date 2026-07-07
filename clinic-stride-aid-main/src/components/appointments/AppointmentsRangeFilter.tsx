import { Calendar, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppointmentRange = 'today' | 'week' | 'all';

interface Props {
  value: AppointmentRange;
  onChange: (next: AppointmentRange) => void;
  /** Which range options to show — defaults to all three. */
  options?: ReadonlyArray<AppointmentRange>;
  /** Show a calendar icon next to each label. */
  withIcons?: boolean;
}

const LABEL: Record<AppointmentRange, string> = {
  today: 'Today',
  week: 'This Week',
  all: 'All',
};

const ICON: Record<AppointmentRange, typeof Calendar> = {
  today: Calendar,
  week: CalendarRange,
  all: Calendar,
};

const ALL_OPTIONS: ReadonlyArray<AppointmentRange> = ['today', 'week', 'all'];

export const AppointmentsRangeFilter = ({
  value,
  onChange,
  options = ALL_OPTIONS,
  withIcons = false,
}: Props) => (
  <div className="flex gap-1 bg-muted rounded-xl p-1">
    {options.map((r) => {
      const Icon = ICON[r];
      return (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            'flex items-center gap-2 rounded-lg text-sm font-medium transition-all',
            withIcons ? 'px-4 py-1.5' : 'px-3 py-1.5',
            value === r
              ? 'bg-card text-foreground shadow-3d'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {withIcons && <Icon className="w-4 h-4" />}
          {LABEL[r]}
        </button>
      );
    })}
  </div>
);
