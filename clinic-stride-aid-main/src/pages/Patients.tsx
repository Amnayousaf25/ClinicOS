import { useState, useMemo } from 'react';
import { PageSpinner } from '@/components/Spinner';
import { useAppointments } from '@/hooks/useApi';
import { Users } from 'lucide-react';
import PatientDialog from '@/components/PatientDialog';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { PatientCard } from '@/components/patients/PatientCard';
import { PatientDetailDialog } from '@/components/patients/PatientDetailDialog';
import { searchPatients } from '@/lib/patientsApi';
import { patientEmail, patientName, patientPhone, serviceName } from '@/lib/appointmentDisplay';
import { toast } from 'sonner';
import type { Patient } from '@/types';

const Patients = () => {
  const { data: appointments = [], isLoading } = useAppointments();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  /**
   * Look up the real Patient record for the row the user clicked, then
   * open the Edit dialog with it. The Patients page derives its rows
   * from appointments, which don't carry the full profile (DOB, address,
   * etc) — those live on the Patient collection.
   */
  const openEdit = async (query: string) => {
    if (!query) {
      toast.error('Patient has no email or phone to look up');
      return;
    }
    setEditLoading(true);
    try {
      const [match] = await searchPatients(query);
      if (!match) {
        toast.error('No matching patient record found');
        return;
      }
      setEditPatient(match);
      setSelectedEmail(null);
    } catch {
      toast.error('Could not load patient details');
    } finally {
      setEditLoading(false);
    }
  };

  const allPatients = useMemo(() => {
    const uniquePatients = Array.from(
      new Map(
        appointments
          .filter((a) => serviceName(a) !== 'Registration')
          .map((a) => [patientEmail(a), a] as const),
      ).values(),
    );
    const registered = appointments.filter((a) => serviceName(a) === 'Registration');
    return [
      ...uniquePatients,
      ...registered.filter(
        (r) => !uniquePatients.some((u) => patientEmail(u) === patientEmail(r)),
      ),
    ];
  }, [appointments]);

  const q = search.toLowerCase();
  const searchedPatients = allPatients.filter(
    (p) =>
      !search ||
      patientName(p).toLowerCase().includes(q) ||
      patientEmail(p).toLowerCase().includes(q) ||
      patientPhone(p).includes(search),
  );

  const selectedPatient = allPatients.find((p) => patientEmail(p) === selectedEmail);
  const patientAppointments = selectedEmail
    ? appointments
        .filter(
          (a) =>
            patientEmail(a) === selectedEmail && serviceName(a) !== 'Registration',
        )
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
        )
    : [];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Users}
        title="Patients"
        subtitle={`${allPatients.length} registered`}
        actions={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, phone..."
            />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {searchedPatients.map((p, i) => (
          <PatientCard
            key={patientEmail(p)}
            patient={p}
            totalVisits={
              appointments.filter(
                (a) =>
                  patientEmail(a) === patientEmail(p) &&
                  serviceName(a) !== 'Registration',
              ).length
            }
            index={i}
            onClick={() => setSelectedEmail(patientEmail(p))}
          />
        ))}
      </div>

      <PatientDetailDialog
        patient={selectedPatient ?? null}
        appointments={patientAppointments}
        open={!!selectedEmail && !!selectedPatient}
        onOpenChange={(open) => {
          if (!open) setSelectedEmail(null);
        }}
        editLoading={editLoading}
        onEdit={() => {
          if (!selectedPatient) return;
          openEdit(
            patientEmail(selectedPatient) || patientPhone(selectedPatient),
          );
        }}
      />

      {editPatient && (
        <PatientDialog
          mode="edit"
          hideTrigger
          open={!!editPatient}
          onOpenChange={(open) => {
            if (!open) setEditPatient(null);
          }}
          patient={editPatient}
          onSuccess={(updated) => {
            if (updated.email) setSelectedEmail(updated.email);
          }}
        />
      )}
    </div>
  );
};

export default Patients;
