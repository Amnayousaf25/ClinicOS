import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePatientSearch } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { patientEmail, patientName, patientPhone, serviceName } from '@/lib/appointmentDisplay';
import dayjs from 'dayjs';
import type { Appointment, Patient } from '@/types';

const SEARCH_PAUSE_MS = 1500;

const useDebounced = (value: string, ms: number) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export type SearchMode = 'patient' | 'appointment';

interface Props {
  /** Picking a Patient row — required (the canonical mode). */
  onPick: (patient: Patient) => void;
  /**
   * Optional appointment-mode wiring. When supplied, a toggle appears
   * next to the search field that switches the source between patients
   * and the local appointments list. The appointments are filtered
   * client-side by the same query.
   */
  appointments?: Appointment[];
  onPickAppointment?: (appointment: Appointment) => void;
}

export const PatientSearchPanel = ({
  onPick,
  appointments,
  onPickAppointment,
}: Props) => {
  const [mode, setMode] = useState<SearchMode>('patient');
  const [query, setQuery] = useState('');
  // Committed query — only set after the user explicitly stops typing
  // for SEARCH_PAUSE_MS or hits Enter.
  const [committed, setCommitted] = useState('');
  const pausedQuery = useDebounced(query, SEARCH_PAUSE_MS);

  useEffect(() => {
    if (pausedQuery !== committed) setCommitted(pausedQuery);
  }, [pausedQuery, committed]);

  const supportsAppointmentMode =
    !!appointments && !!onPickAppointment && appointments.length > 0;

  // Patient search hits the backend; only enabled in patient mode.
  const { data: patients = [], isFetching } = usePatientSearch(
    mode === 'patient' ? committed : '',
  );

  // Appointment matches are filtered locally — the page already has
  // the data in cache and we don't have a server-side appointment
  // search endpoint.
  const appointmentMatches = useMemo(() => {
    if (mode !== 'appointment' || !appointments) return [];
    const q = committed.trim().toLowerCase();
    if (!q) return [];
    return appointments
      .filter(
        (a) =>
          a.intakeStatus !== 'confirmed' &&
          a.intakeStatus !== 'submitted' &&
          (patientName(a).toLowerCase().includes(q) ||
            patientEmail(a).toLowerCase().includes(q) ||
            patientPhone(a).includes(committed)),
      )
      .slice(0, 10);
  }, [mode, appointments, committed]);

  const handlePickPatient = (p: Patient) => {
    onPick(p);
    setQuery('');
    setCommitted('');
  };

  const handlePickAppointment = (a: Appointment) => {
    onPickAppointment?.(a);
    setQuery('');
    setCommitted('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setCommitted(query);
    }
  };

  const placeholder =
    mode === 'appointment'
      ? 'Search appointments by patient — press Enter to search'
      : 'Search by name, phone, or email — press Enter to search';

  const shouldShowResults = !!committed && committed.length >= 2;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <Label>Find Existing Patient</Label>
        {supportsAppointmentMode && (
          <button
            type="button"
            role="switch"
            aria-checked={mode === 'appointment'}
            onClick={() =>
              setMode((m) => (m === 'appointment' ? 'patient' : 'appointment'))
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'appointment'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            {mode === 'appointment' ? (
              <CalendarDays className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            {mode === 'appointment' ? 'Searching appointments' : 'Search appointments'}
          </button>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 rounded-xl"
        />
      </div>

      {shouldShowResults && (
        <div className="border border-border rounded-xl overflow-hidden bg-background max-h-48 overflow-y-auto">
          {mode === 'patient' && isFetching && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Searching…
            </div>
          )}
          {mode === 'patient' && !isFetching && patients.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No matching patients. Fill the form to register a new one.
            </div>
          )}
          {mode === 'patient' &&
            patients.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => handlePickPatient(p)}
                className="w-full text-left px-3 py-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <div className="text-sm font-medium text-foreground">
                  {p.name}
                  {p.mrn ? (
                    <span className="ml-2 text-[10px] font-semibold text-primary">
                      MRN {p.mrn}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.phone}
                  {p.email ? ` · ${p.email}` : ''}
                </div>
              </button>
            ))}

          {mode === 'appointment' && appointmentMatches.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No matching appointments.
            </div>
          )}
          {mode === 'appointment' &&
            appointmentMatches.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => handlePickAppointment(a)}
                className="w-full text-left px-3 py-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <div className="text-sm font-medium text-foreground">
                  {patientName(a)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {serviceName(a)} · {dayjs(a.date).format('MMM D')} {a.time}
                  {patientPhone(a) ? ` · ${patientPhone(a)}` : ''}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
