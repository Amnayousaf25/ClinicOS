import { useState } from 'react';
import { type AppointmentStatus, type Appointment } from '@/types';
import { useUpdateStatus } from '@/hooks/useApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, UserCheck, UserX, XCircle, RefreshCw } from 'lucide-react';
import RescheduleDialog from './RescheduleDialog';

const statusOptions: { value: AppointmentStatus; label: string; icon: typeof CheckCircle; bg: string; text: string }[] = [
  { value: 'pending', label: 'Pending', icon: Clock, bg: 'bg-warning/10', text: 'text-warning' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, bg: 'bg-success/10', text: 'text-success' },
  { value: 'arrived', label: 'Arrived', icon: UserCheck, bg: 'bg-info/10', text: 'text-info' },
  { value: 'no-show', label: 'No-show', icon: UserX, bg: 'bg-destructive/10', text: 'text-destructive' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, bg: 'bg-muted', text: 'text-muted-foreground' },
  { value: 'rescheduled', label: 'Rescheduled', icon: RefreshCw, bg: 'bg-primary/10', text: 'text-primary' },
];

const getStatus = (status: AppointmentStatus) => statusOptions.find(s => s.value === status) || statusOptions[0];

// Statuses that finalize the appointment — no further state changes allowed.
const TERMINAL_STATUSES: AppointmentStatus[] = [
  'arrived',
  'cancelled',
  'no-show',
];

export const StatusDropdown = ({ appointment }: { appointment: Appointment }) => {
  const updateStatus = useUpdateStatus();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  if (!appointment) return null;
  const current = getStatus(appointment.status);

  // Lock the dropdown once the appointment is in a terminal state OR the
  // patient has submitted/confirmed intake.
  const isLocked =
    TERMINAL_STATUSES.includes(appointment.status) ||
    appointment.intakeStatus === 'confirmed' ||
    appointment.intakeStatus === 'submitted';

  const handleChange = (value: string) => {
    const next = value as AppointmentStatus;
    if (next === appointment.status) return;
    if (next === 'rescheduled') {
      setRescheduleOpen(true);
      return;
    }
    updateStatus.mutate({ id: appointment._id, status: next });
  };

  return (
    <>
      <Select value={appointment.status} onValueChange={handleChange} disabled={isLocked}>
        <SelectTrigger
          className={cn(
            'h-7 w-[130px] text-xs rounded-full border-0 font-semibold gap-1.5 [&>span]:flex [&>span]:items-center [&>span]:gap-1.5',
            current.bg,
            current.text,
            isLocked && 'cursor-not-allowed opacity-80',
          )}
          title={
            isLocked
              ? appointment.intakeStatus === 'confirmed' || appointment.intakeStatus === 'submitted'
                ? 'Status locked — intake submitted'
                : `Status locked — appointment is ${appointment.status}`
              : undefined
          }
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <opt.icon className={cn('w-3.5 h-3.5', opt.text)} />
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {rescheduleOpen && (
        <RescheduleDialog
          appointment={appointment}
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
        />
      )}
    </>
  );
};

export const StatusBadgeSimple = ({ status }: { status: AppointmentStatus }) => {
  const s = getStatus(status);
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', s.bg, s.text)}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
};
