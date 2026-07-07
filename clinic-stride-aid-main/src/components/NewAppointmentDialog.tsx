import { useState } from 'react';
import { useFormik } from 'formik';
import {
  useCreateAppointment,
  useAppointments,
  useServices,
  useClinicSettings,
  useProviders,
  useBlockedSlots,
} from '@/hooks/useApi';
import { getPatient } from '@/lib/patientsApi';
import {
  patientEmail,
  patientName,
  patientPhone,
  refId,
  serviceName,
} from '@/lib/appointmentDisplay';
import { appointmentFormSchema } from '@/lib/patientValidation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormDialogShell } from '@/components/FormDialogShell';
import { FormikFieldError } from '@/components/FormikFieldError';
import { AppointmentDateTimeFields } from '@/components/appointments/AppointmentDateTimeFields';
import {
  AppointmentPatientFields,
  type AppointmentFormValues,
} from '@/components/appointments/AppointmentPatientFields';
import type { Appointment, Patient } from '@/types';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';

const today = () => dayjs().format('YYYY-MM-DD');

const INITIAL_VALUES: AppointmentFormValues = {
  patientId: '',
  patientName: '',
  patientPhone: '',
  patientEmail: '',
  patientDob: '',
  serviceId: '',
  providerId: '',
  date: today(),
  time: '',
  notes: '',
};

const NewAppointmentDialog = () => {
  const [open, setOpen] = useState(false);
  const { data: services = [] } = useServices({ enabled: open });
  const { data: settings } = useClinicSettings({ enabled: open });
  const { data: providers = [] } = useProviders({ enabled: open });
  const { data: blockedSlots = [] } = useBlockedSlots({ enabled: open });
  const createMutation = useCreateAppointment();
  const { data: appointments = [] } = useAppointments(undefined, { enabled: open });

  const workingHours = settings?.workingHours ?? { start: '08:00', end: '17:00' };
  const slotDuration = settings?.slotDuration ?? 30;

  const formik = useFormik<AppointmentFormValues>({
    initialValues: INITIAL_VALUES,
    validationSchema: appointmentFormSchema,
    onSubmit: async (values, { resetForm, setFieldError }) => {
      const isTaken = appointments.some(
        (a) =>
          a.date === values.date &&
          a.time === values.time &&
          a.providerId === values.providerId &&
          a.status !== 'cancelled',
      );
      const isBlocked = blockedSlots.some(
        (b) => b.date === values.date && b.time === values.time,
      );
      if (isTaken || isBlocked) {
        setFieldError(
          'time',
          isBlocked ? 'This slot is blocked' : 'This slot is already booked',
        );
        return;
      }
      try {
        await createMutation.mutateAsync({
          patientId: values.patientId || undefined,
          patientName: values.patientName,
          patientPhone: values.patientPhone.replace(/[\s()-]/g, ''),
          patientEmail: values.patientEmail || undefined,
          dob: values.patientDob || undefined,
          serviceId: values.serviceId,
          providerId: values.providerId || undefined,
          date: values.date,
          time: values.time,
          notes: values.notes,
        });
        resetForm();
        setOpen(false);
      } catch {
        // Error toast handled by mutation hook
      }
    },
  });

  // Pull the canonical Patient record so DOB / address etc. flow into
  // the form even when the search row only carried the summary fields.
  const hydratePatientDetail = async (id: string) => {
    try {
      const full = await getPatient(id);
      formik.setFieldValue('patientDob', full.dob || '');
    } catch {
      // Silent — the form already has the basics from the picked row.
    }
  };

  const handlePatientPicked = (patient: Patient) => {
    formik.setFieldValue('patientId', patient._id);
    formik.setFieldValue('patientName', patient.name);
    formik.setFieldValue('patientPhone', patient.phone);
    formik.setFieldValue('patientEmail', patient.email);
    formik.setFieldValue('patientDob', patient.dob || '');
  };

  const handleAppointmentPicked = (apt: Appointment) => {
    const pickedPatientId = refId(apt.patientId);
    formik.setFieldValue('patientId', pickedPatientId);
    formik.setFieldValue('patientName', patientName(apt));
    formik.setFieldValue('patientPhone', patientPhone(apt));
    formik.setFieldValue('patientEmail', patientEmail(apt));
    if (apt.providerId) formik.setFieldValue('providerId', refId(apt.providerId));
    const matchedService = services.find((s) => s.name === serviceName(apt));
    if (matchedService) formik.setFieldValue('serviceId', matchedService._id);
    if (pickedPatientId) hydratePatientDetail(pickedPatientId);
  };

  const bookedTimes = appointments
    .filter(
      (a) =>
        a.date === formik.values.date &&
        a.providerId === formik.values.providerId &&
        a.status !== 'cancelled',
    )
    .map((a) => a.time);
  const blockedTimes = blockedSlots
    .filter((b) => b.date === formik.values.date)
    .map((b) => b.time);

  return (
    <form onSubmit={formik.handleSubmit}>
      <FormDialogShell
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) formik.resetForm();
        }}
        title="New Appointment"
        trigger={
          <Button className="btn-3d rounded-xl shadow-primary-glow">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        }
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => formik.submitForm()}
              disabled={createMutation.isPending}
              className="flex-1 rounded-xl btn-3d shadow-primary-glow"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        }
      >
        <AppointmentPatientFields
          formik={formik}
          services={services}
          providers={providers}
          appointments={appointments}
          onPatientPicked={handlePatientPicked}
          onAppointmentPicked={handleAppointmentPicked}
        />

        <AppointmentDateTimeFields
          date={formik.values.date}
          time={formik.values.time}
          dateError={typeof formik.errors.date === 'string' ? formik.errors.date : undefined}
          dateTouched={formik.touched.date}
          timeError={typeof formik.errors.time === 'string' ? formik.errors.time : undefined}
          timeTouched={formik.touched.time}
          workingHours={workingHours}
          slotDuration={slotDuration}
          bookedTimes={bookedTimes}
          blockedTimes={blockedTimes}
          onDateChange={(date) => {
            formik.setFieldValue('date', date);
            formik.setFieldValue('time', '');
            formik.setFieldTouched('date', true, true);
          }}
          onTimeChange={(val) => formik.setFieldValue('time', val)}
        />

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <textarea
            name="notes"
            value={formik.values.notes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Optional notes..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-20"
          />
          <FormikFieldError error={formik.errors.notes} touched={formik.touched.notes} />
        </div>
      </FormDialogShell>
    </form>
  );
};

export default NewAppointmentDialog;
