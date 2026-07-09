import { getInitials } from '@/lib/utils';
import { patientMrn, patientName, patientPhone } from '@/lib/appointmentDisplay';
import type { Appointment } from '@/types';

interface Props {
  appointment: Appointment;
  /** Slightly tighter typography for the dashboard's denser table. */
  dense?: boolean;
}

/**
 * Patient identity cell — avatar + name + walk-in badge + phone.
 * Shared between the Appointments and Dashboard tables so the visual
 * identity of a patient row is consistent across the app.
 */
export const PatientCell = ({ appointment, dense = false }: Props) => (
  // NB: Tailwind purges dynamically-built class names like
  // `gap-${...}`, so the static class strings below are intentional.
  <div
    className={
      dense ? 'flex items-center gap-3' : 'flex items-center gap-3.5'
    }
  >
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
      {getInitials(patientName(appointment))}
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-sm font-medium text-foreground truncate">
          {patientName(appointment)}
        </p>
        {patientMrn(appointment) && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary shrink-0">
            MRN {patientMrn(appointment)}
          </span>
        )}
        {appointment.appointmentType === 'walk-in' && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-accent text-accent-foreground shrink-0">
            Walk-in
          </span>
        )}
      </div>
      <p className={`${dense ? 'text-[11px]' : 'text-xs'} text-muted-foreground truncate`}>
        {patientPhone(appointment)}
      </p>
    </div>
  </div>
);
