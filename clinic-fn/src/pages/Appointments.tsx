import { useMemo, useState } from 'react';
import { PageSpinner } from '@/components/Spinner';
import { useAppointments } from '@/hooks/useApi';
import { Calendar, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import NewAppointmentDialog from '@/components/NewAppointmentDialog';
import { AppointmentsTable } from '@/components/appointments/AppointmentsTable';
import {
  AppointmentsRangeFilter,
  type AppointmentRange,
} from '@/components/appointments/AppointmentsRangeFilter';
import { filterAppointments } from '@/lib/appointmentFilters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const Appointments = () => {
  const [filter, setFilter] = useState<AppointmentRange>('today');
  const [search, setSearch] = useState('');
  const [lateOnly, setLateOnly] = useState(false);

  // Server-side `period` filtering is intentionally skipped — see
  // appointmentFilters.ts. Client-side filter handles TZ correctly.
  const { data: appointments = [], isLoading } = useAppointments(undefined, { refetchInterval: 3000 });

  const filtered = useMemo(() => {
    let list = filterAppointments(appointments, { range: filter, search });
    if (lateOnly) {
      const now = dayjs();
      list = list.filter((apt) => {
        if (apt.status !== 'pending' && apt.status !== 'confirmed') return false;
        const aptDateTime = dayjs(`${apt.date}T${apt.time}`);
        return now.isAfter(aptDateTime);
      });
    }
    return list;
  }, [appointments, filter, search, lateOnly]);

  const lateCount = useMemo(() => {
    const now = dayjs();
    return appointments.filter((apt) => {
      if (apt.status !== 'pending' && apt.status !== 'confirmed') return false;
      const aptDateTime = dayjs(`${apt.date}T${apt.time}`);
      return now.isAfter(aptDateTime);
    }).length;
  }, [appointments]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Calendar}
        title="Appointments"
        subtitle={`${filtered.length} total`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} width="w-48" />
            <Button
              variant="outline"
              onClick={() => setLateOnly(!lateOnly)}
              className={cn(
                'rounded-xl border border-border h-9 text-xs font-semibold gap-1.5 transition-all duration-300 px-3 shrink-0',
                lateOnly
                  ? 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20 hover:text-destructive shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                  : lateCount > 0
                  ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/15 hover:text-warning'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              <AlertTriangle className={cn('w-3.5 h-3.5', lateOnly ? 'text-destructive' : 'text-warning')} />
              <span>{lateOnly ? 'Showing Late' : `Late Patients (${lateCount})`}</span>
            </Button>
            <AppointmentsRangeFilter value={filter} onChange={setFilter} />
            <NewAppointmentDialog />
          </>
        }
      />

      {isLoading && <PageSpinner padding="sm" />}

      <div className="bg-card rounded-2xl card-3d overflow-hidden border border-border/50">
        <AppointmentsTable appointments={filtered} cellPadding="px-4 py-3" />
      </div>
    </div>
  );
};

export default Appointments;
