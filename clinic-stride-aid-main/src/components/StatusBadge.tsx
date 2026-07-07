import { cn } from '@/lib/utils';
import type { AppointmentStatus, IntakeStatus } from '@/types';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  cancelled: 'bg-destructive/15 text-destructive',
  'no-show': 'bg-muted text-muted-foreground',
  arrived: 'bg-info/15 text-info',
  rescheduled: 'bg-primary/15 text-primary',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  'no-show': 'No-show',
  arrived: 'Arrived',
  rescheduled: 'Rescheduled',
};

export const AppointmentStatusBadge = ({ status }: { status: AppointmentStatus }) => (
  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', statusStyles[status] || 'bg-muted text-muted-foreground')}>
    {statusLabels[status] || status}
  </span>
);

const intakeStyles: Record<IntakeStatus, string> = {
  confirmed: 'bg-success/15 text-success',
  submitted: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  'not-sent': 'bg-muted text-muted-foreground',
};

export const IntakeStatusBadge = ({ status }: { status: IntakeStatus }) => (
  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', intakeStyles[status])}>
    {status === 'confirmed' || status === 'submitted' ? 'Confirmed' : status === 'pending' ? 'Pending' : 'Not Sent'}
  </span>
);
