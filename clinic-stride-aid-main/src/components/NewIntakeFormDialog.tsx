import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Formik, Form } from 'formik';
import { toast } from '@/hooks/use-toast';
import { intakeSchema } from '@/lib/intakeValidation';
import {
  submitIntakeForm,
  writeAppointmentIntakeCache,
  writeIntakeSubmissionCache,
} from '@/lib/intakeApi';
import { fetchAppointments } from '@/lib/appointmentApi';
import { getPatient } from '@/lib/patientsApi';
import {
  patientEmail,
  patientName,
  patientPhone,
  refId,
} from '@/lib/appointmentDisplay';
import type { Appointment, Patient } from '@/types';
import { useMemo } from 'react';
import { usePatient } from '@/hooks/api/usePatients';
import { PatientSearchPanel } from './PatientSearchPanel';
import { WalkInFields } from './intake/WalkInFields';
import { PatientFormFields } from './intake/PatientFormFields';
import { ConsentBox } from './intake/ConsentBox';
import {
  initialIntakeValues,
  type IntakeFormValues,
} from './intake/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Optional appointment to lock the form to. When set, the dialog opens
   * in `appointment` mode with the appointment ID + patient summary
   * pre-filled, so staff can submit intake on behalf of the patient
   * without re-entering identity fields.
   */
  prefillAppointment?: Appointment | null;
}

const buildSubmitPayload = (values: IntakeFormValues) => {
  const isWalkIn = values.mode === 'walk-in';
  return {
    appointmentId: isWalkIn ? undefined : values.appointmentId || undefined,
    patientId: values.patientId || undefined,
    appointmentType: isWalkIn ? ('walk-in' as const) : ('scheduled' as const),
    serviceId: isWalkIn ? values.serviceId : undefined,
    providerId: isWalkIn ? values.providerId || undefined : undefined,
    name: values.name.trim(),
    dob: values.dob,
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim() || undefined,
    reasonForVisit: values.reasonForVisit.trim(),
    consent: values.consent,
    insuranceProvider: values.insuranceProvider.trim() || undefined,
    insuranceNumber: values.insuranceNumber.trim() || undefined,
    allergies: values.allergies.trim() || undefined,
    medications: values.medications.trim() || undefined,
    emergencyContact: values.emergencyContact.trim() || undefined,
    emergencyPhone: values.emergencyPhone.trim() || undefined,
  };
};

const NewIntakeFormDialog = ({
  open,
  onOpenChange,
  prefillAppointment,
}: Props) => {
  const qc = useQueryClient();
  const submitMutation = useMutation({
    mutationFn: submitIntakeForm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Pull the full Patient record (DOB, address, allergies, etc.) so
  // the dialog can pre-populate every known field — the appointment
  // row only carries name/phone/email summaries.
  const { data: patientDetail } = usePatient(
    prefillAppointment ? refId(prefillAppointment.patientId) : undefined,
  );

  // Appointments are searched client-side; only fetch while the dialog
  // is open and only when we don't already have a locked appointment.
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetchAppointments(),
    enabled: open && !prefillAppointment,
    staleTime: 30 * 1000,
  });

  const startingValues = useMemo<IntakeFormValues>(() => {
    if (!prefillAppointment) return initialIntakeValues;
    const p = patientDetail;
    return {
      ...initialIntakeValues,
      mode: 'appointment',
      appointmentId: prefillAppointment._id,
      patientId: refId(prefillAppointment.patientId) || p?._id || '',
      name: p?.name || patientName(prefillAppointment),
      phone: p?.phone || patientPhone(prefillAppointment),
      email: p?.email || patientEmail(prefillAppointment),
      dob: p?.dob || '',
      address: p?.address || '',
      insuranceProvider: p?.insuranceProvider || '',
      insuranceNumber: p?.insuranceNumber || '',
      allergies: p?.allergies || '',
      medications: p?.medications || '',
      emergencyContact: p?.emergencyContact || '',
      emergencyPhone: p?.emergencyPhone || '',
    };
  }, [prefillAppointment, patientDetail]);

  // When the dialog is launched from a specific appointment row, the
  // patient + visit type are already determined, so the search +
  // mode-toggle should be hidden.
  const hidePatientSearch = !!prefillAppointment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle className="text-lg font-bold">
            New Intake Form
          </DialogTitle>
          <DialogDescription className="sr-only">
            Submit a patient intake form, linked to an appointment or as a
            walk-in.
          </DialogDescription>
        </DialogHeader>
        <Formik
          enableReinitialize
          initialValues={startingValues}
          validationSchema={intakeSchema}
          onSubmit={(values, { resetForm, setSubmitting }) => {
            if (values.mode === 'walk-in' && !values.serviceId) {
              toast({
                title: 'Service required',
                description: 'Pick a service for the walk-in patient.',
                variant: 'destructive',
              });
              setSubmitting(false);
              return;
            }
            if (submitMutation.isPending) {
              setSubmitting(false);
              return;
            }
            submitMutation.mutate(buildSubmitPayload(values), {
              onSuccess: (createdForm) => {
                writeIntakeSubmissionCache(qc, createdForm);
                writeAppointmentIntakeCache(qc, createdForm);
                qc.invalidateQueries({ queryKey: ['appointments'] });
                toast({
                  title: 'Intake form submitted',
                  description: values.name,
                });
                resetForm();
                onOpenChange(false);
              },
              onError: (err: unknown) => {
                const e = err as {
                  response?: { status?: number; data?: { message?: string } };
                };
                const status = e?.response?.status;
                const message = e?.response?.data?.message;
                if (
                  status === 409 &&
                  message?.toLowerCase().includes('already submitted')
                ) {
                  qc.invalidateQueries({ queryKey: ['appointments'] });
                  qc.invalidateQueries({ queryKey: ['intake-submission'] });
                  toast({
                    title: 'Intake form already submitted',
                    description:
                      'This appointment already has an intake form on file.',
                  });
                  resetForm();
                  onOpenChange(false);
                  return;
                }
                toast({
                  title: 'Failed to submit intake form',
                  description: message ?? 'Please try again.',
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          {({ setFieldValue, setValues, values, errors, touched }) => {
            // Picking a Patient row → walk-in mode (no appointment yet).
            const applyPatient = async (p: Patient) => {
              setValues((current) => ({
                ...current,
                ...p,
                patientId: p._id,
                mode: 'walk-in',
                appointmentId: '',
              }));
              toast({
                title: 'Patient details prefilled',
                description: p.mrn ? `${p.name} (MRN ${p.mrn})` : p.name,
              });
            };

            // Picking an Appointment row → appointment mode, locked to
            // that appointment, identity hydrated from its Patient ref.
            const applyAppointment = async (a: Appointment) => {
              const patientId = refId(a.patientId);
              let detail: Patient | null = null;
              if (patientId) {
                try {
                  detail = await getPatient(patientId);
                } catch {
                  // Fall back to the summary fields on the appointment row.
                }
              }
              setValues((current) => ({
                ...current,
                mode: 'appointment',
                appointmentId: a._id,
                patientId,
                name: detail?.name || patientName(a),
                phone: detail?.phone || patientPhone(a),
                email: detail?.email || patientEmail(a),
                dob: detail?.dob || '',
                address: detail?.address || '',
                insuranceProvider: detail?.insuranceProvider || '',
                insuranceNumber: detail?.insuranceNumber || '',
                allergies: detail?.allergies || '',
                medications: detail?.medications || '',
                emergencyContact: detail?.emergencyContact || '',
                emergencyPhone: detail?.emergencyPhone || '',
              }));
              toast({
                title: 'Appointment selected',
                description: `${patientName(a)} — ${a.date} ${a.time}`,
              });
            };

            if (
              prefillAppointment &&
              (prefillAppointment.intakeStatus === 'confirmed' ||
                prefillAppointment.intakeStatus === 'submitted')
            ) {
              return (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Already Submitted
                    </p>
                    <p className="text-xs text-muted-foreground">
                      An intake form has already been completed for this appointment.
                    </p>
                  </div>
                  <Button type="button" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                </div>
              );
            }

            return (
              <Form className="flex flex-col max-h-[calc(90vh-74px)]">
                <div className="flex-1 overflow-y-auto px-6 pt-3 pb-4 space-y-4">
                  {!hidePatientSearch && (
                    <PatientSearchPanel
                      onPick={applyPatient}
                      appointments={appointments}
                      onPickAppointment={applyAppointment}
                    />
                  )}
                  {values.mode === 'walk-in' && (
                    <WalkInFields
                      values={values}
                      setFieldValue={setFieldValue}
                      isOpen={open}
                    />
                  )}
                  <PatientFormFields
                    values={values}
                    setFieldValue={setFieldValue}
                    errors={errors}
                    touched={touched}
                  />
                  <ConsentBox
                    checked={values.consent}
                    onChange={(next) => setFieldValue('consent', next)}
                    error={
                      touched.consent && errors.consent
                        ? errors.consent
                        : undefined
                    }
                  />
                </div>
                <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-background">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitMutation.isPending}>
                      {submitMutation.isPending
                        ? 'Submitting...'
                        : 'Submit Form'}
                    </Button>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default NewIntakeFormDialog;
