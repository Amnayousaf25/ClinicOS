import * as dayjsNs from 'dayjs';
import * as utcNs from 'dayjs/plugin/utc';
import * as customParseFormatNs from 'dayjs/plugin/customParseFormat';

const dayjs: typeof import('dayjs') = (dayjsNs as any).default || dayjsNs;
const utc: typeof import('dayjs/plugin/utc') = (utcNs as any).default || utcNs;
const customParseFormat: typeof import('dayjs/plugin/customParseFormat') =
  (customParseFormatNs as any).default || customParseFormatNs;

dayjs.extend(utc);
dayjs.extend(customParseFormat);

// Start of today in UTC (00:00:00.000Z).
export const todayUtc = (): Date => dayjs.utc().startOf('day').toDate();

// Start of the given day in UTC. Accepts Date, ISO string, or YYYY-MM-DD.
export const startOfUtcDay = (value: string | Date): Date =>
  dayjs.utc(value).startOf('day').toDate();

// End of the given day in UTC (23:59:59.999Z).
export const endOfUtcDay = (value: string | Date): Date =>
  dayjs.utc(value).endOf('day').toDate();

// YYYY-MM-DD key in UTC — used to group events by day.
export const formatUtcDateKey = (value: string | Date): string =>
  dayjs.utc(value).format('YYYY-MM-DD');

export const formatUtcTimeKey = (value: string | Date): string =>
  dayjs.utc(value).format('HH:mm');

// Add days in UTC (no local-calendar drift around DST).
export const addUtcDays = (value: string | Date, amount: number): Date =>
  dayjs.utc(value).add(amount, 'day').toDate();

export const addUtcMinutes = (value: string | Date, amount: number): Date =>
  dayjs.utc(value).add(amount, 'minute').toDate();

// Parse a caller-supplied date filter as a UTC instant. If the string has no
// timezone, it is assumed to be UTC (not server-local).
export const parseUtc = (value: string | Date): Date =>
  dayjs.utc(value).toDate();

// Strictly validate YYYY-MM-DD in UTC and normalize to canonical key.
export const normalizeUtcDateKey = (value: string): string | null => {
  const parsed = dayjs.utc(value, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.format('YYYY-MM-DD');
};

// Strictly validate HH:mm (24h) and normalize to canonical key.
export const normalizeTimeKey = (value: string): string | null => {
  const parsed = dayjs.utc(value, 'HH:mm', true);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.format('HH:mm');
};

// Monday, Tuesday... key used by availability map (lowercase).
export const utcWeekdayKey = (dateKey: string): string | null => {
  const parsed = dayjs.utc(dateKey, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.format('dddd').toLowerCase();
};

export const parseUtcDateTimeKey = (
  dateKey: string,
  timeKey: string,
): Date | null => {
  const parsed = dayjs.utc(`${dateKey} ${timeKey}`, 'YYYY-MM-DD HH:mm', true);
  if (!parsed.isValid()) {
    return null;
  }
  return parsed.toDate();
};
