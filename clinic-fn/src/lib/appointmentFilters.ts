import dayjs from 'dayjs';
import { patientEmail, patientName, patientPhone, serviceName } from './appointmentDisplay';
import type { Appointment } from '@/types';
import type { AppointmentRange } from '@/components/appointments/AppointmentsRangeFilter';

/**
 * Whether an appointment falls in the chosen date range. All comparisons
 * use the user's LOCAL date (via dayjs) to avoid TZ-related off-by-one
 * bugs that surfaced when the server filtered using UTC.
 */
export const inRange = (date: string, range: AppointmentRange): boolean => {
  if (range === 'all') return true;
  const today = dayjs().format('YYYY-MM-DD');
  if (range === 'today') return date === today;
  // range === 'week'
  const weekEnd = dayjs().add(7, 'day').format('YYYY-MM-DD');
  return date >= today && date <= weekEnd;
};

/**
 * Free-text match across patient name / email / phone / service.
 * Empty query passes everything through.
 */
export const matchesSearch = (apt: Appointment, search: string): boolean => {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    patientName(apt).toLowerCase().includes(q) ||
    patientEmail(apt).toLowerCase().includes(q) ||
    patientPhone(apt).includes(search) ||
    serviceName(apt).toLowerCase().includes(q)
  );
};

/**
 * Sort newest-first by date+time. Both fields are 'YYYY-MM-DD' /
 * 'HH:mm' strings so a lexical compare is correct.
 */
export const sortNewestFirst = (a: Appointment, b: Appointment): number =>
  (b.date + b.time).localeCompare(a.date + a.time);

/** Convenience: filter + sort in one call. */
export const filterAppointments = (
  appointments: Appointment[],
  opts: { range: AppointmentRange; search: string },
): Appointment[] =>
  appointments
    .filter((a) => inRange(a.date, opts.range))
    .filter((a) => matchesSearch(a, opts.search))
    .sort(sortNewestFirst);
