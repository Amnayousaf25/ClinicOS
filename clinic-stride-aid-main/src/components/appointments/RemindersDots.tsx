import type { Appointment } from '@/types';
import { cn } from '@/lib/utils';

const TYPES = ['confirmation', '24h', '2h'] as const;

interface Props {
  reminders: Appointment['smsReminders'];
  className?: string;
}

/**
 * Three-dot indicator showing confirmation / 24h / 2h reminder state.
 * Filled (success) = sent, faded = pending. Used in dashboard cards
 * + table to give an at-a-glance view of reminder progress.
 */
export const RemindersDots = ({ reminders, className }: Props) => (
  <div
    className={cn('flex items-center gap-1', className)}
    title="Confirmation · 24h · 2h"
  >
    {TYPES.map((t) => {
      const r = reminders.find((x) => x.type === t);
      return (
        <div
          key={t}
          className={cn(
            'w-2 h-2 rounded-full',
            r?.sent ? 'bg-success' : 'bg-muted-foreground/30',
          )}
          title={`${t}: ${r?.sent ? 'sent' : 'pending'}`}
        />
      );
    })}
  </div>
);
