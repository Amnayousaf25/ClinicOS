import { useMemo, useState } from 'react';
import { PageSpinner } from '@/components/Spinner';
import { useAppointments } from '@/hooks/useApi';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import {
  IntakeFormDetailDialog,
  type IntakeRowSummary,
} from '@/components/intakeforms/IntakeFormDetailDialog';
import { IntakeFormsTable } from '@/components/intakeforms/IntakeFormsTable';
import { patientEmail, patientName, patientPhone, serviceName } from '@/lib/appointmentDisplay';

const IntakeForms = () => {
  const { data: appointments = [], isLoading } = useAppointments(undefined, { staleTime: 0, refetchInterval: 3000 });
  const [selected, setSelected] = useState<IntakeRowSummary | null>(null);
  const [search, setSearch] = useState('');

  const intakeItems = useMemo<IntakeRowSummary[]>(
    () =>
      appointments
        .filter((a) => a.intakeStatus === 'confirmed' || a.intakeStatus === 'submitted')
        .map((a) => ({
          id: a._id,
          appointmentId: a._id,
          patientName: patientName(a),
          patientEmail: patientEmail(a),
          patientPhone: patientPhone(a),
          service: serviceName(a),
          date: a.date,
          time: a.time,
        })),
    [appointments],
  );

  const q = search.toLowerCase();
  const filtered = intakeItems.filter(
    (f) =>
      !search ||
      f.patientName.toLowerCase().includes(q) ||
      f.patientEmail.toLowerCase().includes(q) ||
      f.patientPhone.includes(search),
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Intake Forms"
        subtitle={`${intakeItems.length} submissions`}
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search forms..."
          />
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : (
        <IntakeFormsTable rows={filtered} onSelect={setSelected} />
      )}

      <IntakeFormDetailDialog
        selected={selected}
        onClose={() => setSelected(null)}
        onUpdated={setSelected}
      />
    </div>
  );
};

export default IntakeForms;
