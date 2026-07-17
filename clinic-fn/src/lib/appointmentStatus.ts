import type { AppointmentStatus } from '@/types';

/**
 * Tailwind background-color class per appointment status. Used by the
 * Reports breakdown bars and the Calendar dot indicators — consolidated
 * here so the two views stay in sync.
 */
export const statusBgColor: Record<AppointmentStatus, string> = {
  confirmed: 'bg-success',
  pending: 'bg-warning',
  cancelled: 'bg-destructive',
  'no-show': 'bg-muted-foreground',
  arrived: 'bg-info',
  rescheduled: 'bg-secondary',
  'intake-submitted': 'bg-teal-500',
};
