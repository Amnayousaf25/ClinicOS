import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { DataTableHead } from '@/components/DataTableHead';
import { IntakeStatusBadge } from '@/components/StatusBadge';
import { StatusDropdown } from '@/components/StatusDropdown';
import { QuickActions } from '@/components/QuickActions';
import { PatientCell } from './PatientCell';
import { RemindersDots } from './RemindersDots';
import { refId, serviceName } from '@/lib/appointmentDisplay';
import type { Appointment } from '@/types';

interface Props {
  appointments: Appointment[];
  /** Show a leading Date column — useful for week views. */
  showDate?: boolean;
  /** Show a Provider column. Requires `providerName` resolver. */
  showProvider?: boolean;
  /** Show a Reminders column with the 3-dot indicator. */
  showReminders?: boolean;
  /** Resolver from providerId to display name (for the Provider column). */
  providerName?: (id?: string) => string;
  /** Per-cell padding override (defaults `px-5 py-3.5` — Dashboard density). */
  cellPadding?: string;
  /** Empty-state message shown inside the table body when there are no rows. */
  emptyMessage?: string;
}

const DEFAULT_PADDING = 'px-5 py-3.5';

/**
 * Shared appointments table — used by both Dashboard and Appointments
 * pages. Render desktop table + mobile card stack from one component so
 * both surfaces stay visually consistent.
 *
 * The mobile card view always renders patient/time/service/status/intake/
 * reminders/actions; column toggles only affect the desktop table.
 */
export const AppointmentsTable = ({
  appointments,
  showDate = false,
  showProvider = false,
  showReminders = false,
  providerName,
  cellPadding = DEFAULT_PADDING,
  emptyMessage = 'No appointments found',
}: Props) => {
  const columns = [
    { label: 'Date', show: showDate },
    { label: 'Time' },
    { label: 'Patient' },
    { label: 'Service' },
    ...(showProvider ? [{ label: 'Provider' }] : []),
    { label: 'Status' },
    { label: 'Intake Form Status' },
    ...(showReminders
      ? [{ label: 'Reminders', align: 'center' as const }]
      : []),
    { label: 'Actions', align: 'center' as const },
  ];

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Calendar className="w-12 h-12 opacity-30" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile cards ────────────────────────────────────────── */}
      <div className="sm:hidden divide-y divide-border">
        {appointments.map((apt) => (
          <div key={apt._id} className="px-4 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <PatientCell appointment={apt} />
              </div>
              <StatusDropdown appointment={apt} />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {dayjs(apt.date).format('MMM D')} · {apt.time} · {serviceName(apt)}
              {showProvider && providerName && ` · ${providerName(refId(apt.providerId))}`}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IntakeStatusBadge status={apt.intakeStatus} />
                {showReminders && <RemindersDots reminders={apt.smsReminders} />}
              </div>
              <QuickActions appointment={apt} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table ───────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <DataTableHead cellClassName={cellPadding} columns={columns} />
          <tbody>
            {appointments.map((apt) => (
              <tr
                key={apt._id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                {showDate && (
                  <td className={cellPadding}>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {dayjs(apt.date).format('ddd, MMM D')}
                    </span>
                  </td>
                )}
                <td className={`${cellPadding} whitespace-nowrap`}>
                  <div>
                    <p className="text-sm font-bold text-foreground">{apt.time}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {dayjs(apt.date).format('MMM D')}
                    </p>
                  </div>
                </td>
                <td className={`${cellPadding} whitespace-nowrap`}>
                  <PatientCell appointment={apt} dense />
                </td>
                <td className={`${cellPadding} whitespace-nowrap`}>
                  <span className="text-sm text-foreground">{serviceName(apt)}</span>
                </td>
                {showProvider && (
                  <td className={`${cellPadding} whitespace-nowrap`}>
                    <span className="text-xs text-muted-foreground">
                      {providerName?.(refId(apt.providerId)) ?? '—'}
                    </span>
                  </td>
                )}
                <td className={`${cellPadding} whitespace-nowrap`}>
                  <StatusDropdown appointment={apt} />
                </td>
                <td className={`${cellPadding} whitespace-nowrap`}>
                  <IntakeStatusBadge status={apt.intakeStatus} />
                </td>
                {showReminders && (
                  <td className={cellPadding}>
                    <RemindersDots
                      reminders={apt.smsReminders}
                      className="justify-center"
                    />
                  </td>
                )}
                <td className={cellPadding}>
                  <div className="flex justify-center">
                    <QuickActions appointment={apt} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
