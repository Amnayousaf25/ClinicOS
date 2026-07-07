import { useMemo, useState } from 'react';
import { PageSpinner } from '@/components/Spinner';
import { useAppointments } from '@/hooks/useApi';
import { Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import NewAppointmentDialog from '@/components/NewAppointmentDialog';
import { AppointmentsTable } from '@/components/appointments/AppointmentsTable';
import {
  AppointmentsRangeFilter,
  type AppointmentRange,
} from '@/components/appointments/AppointmentsRangeFilter';
import { filterAppointments } from '@/lib/appointmentFilters';

const Appointments = () => {
  const [filter, setFilter] = useState<AppointmentRange>('today');
  const [search, setSearch] = useState('');
  // Server-side `period` filtering is intentionally skipped — see
  // appointmentFilters.ts. Client-side filter handles TZ correctly.
  const { data: appointments = [], isLoading } = useAppointments(undefined, { refetchInterval: 3000 });

  const filtered = useMemo(
    () => filterAppointments(appointments, { range: filter, search }),
    [appointments, filter, search],
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Calendar}
        title="Appointments"
        subtitle={`${filtered.length} total`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} width="w-48" />
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
