import { useMemo, useState } from 'react';
import { PageSpinner } from '@/components/Spinner';
import { useAppointments, useProviders } from '@/hooks/useApi';
import { Activity } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import dayjs from 'dayjs';
import { StatCards } from '@/components/dashboard/StatCards';
import { AppointmentsTable } from '@/components/appointments/AppointmentsTable';
import {
  AppointmentsRangeFilter,
  type AppointmentRange,
} from '@/components/appointments/AppointmentsRangeFilter';
import { filterAppointments } from '@/lib/appointmentFilters';

const Dashboard = () => {
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<AppointmentRange>('today');

  // Server-side `period` filtering is intentionally skipped — local-date
  // filtering avoids TZ off-by-one bugs around midnight.
  const { data: appointments = [], isLoading: aptsLoading } = useAppointments(undefined, { refetchInterval: 3000 });
  const { data: providers = [] } = useProviders();

  const providerName = (id?: string) =>
    providers.find((p) => p._id === id)?.name ?? '—';

  // Range-filtered (no search) — drives stat cards.
  const rangeAppointments = useMemo(
    () => filterAppointments(appointments, { range, search: '' }),
    [appointments, range],
  );

  // Range + search — drives the table.
  const filtered = useMemo(
    () => filterAppointments(appointments, { range, search }),
    [appointments, range, search],
  );

  const rangeLabel =
    range === 'today'
      ? 'Today'
      : range === 'week'
        ? 'This Week'
        : 'All';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <AppointmentsRangeFilter
          value={range}
          onChange={setRange}
          options={['today', 'week', 'all']}
          withIcons
        />

        <p className="text-xs text-muted-foreground hidden sm:block">
          {range === 'today'
            ? dayjs().format('dddd, MMM D')
            : range === 'week'
              ? `${dayjs().format('MMM D')} – ${dayjs()
                .add(7, 'day')
                .format('MMM D')}`
              : 'All Appointments'}
        </p>
      </div>

      <StatCards appointments={rangeAppointments} rangeLabel={rangeLabel} />

      {aptsLoading && <PageSpinner padding="sm" />}

      <div className="bg-card rounded-2xl card-3d overflow-hidden border border-border/50">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">
              {rangeLabel}'s Schedule
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {filtered.length}
            </span>
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search patients..."
            width="w-full sm:w-64"
          />
        </div>

        <AppointmentsTable
          appointments={filtered}
          showDate={range !== 'today'}
          showProvider
          showReminders
          providerName={providerName}
        />
      </div>
    </div>
  );
};

export default Dashboard;