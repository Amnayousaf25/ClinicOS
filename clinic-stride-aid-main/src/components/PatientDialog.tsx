import { useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useCreatePatient, useUpdatePatient } from '@/hooks/useApi';
import { patientSchema } from '@/lib/patientValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DatePickerField from '@/components/DatePickerField';
import { FormDialogShell } from '@/components/FormDialogShell';
import { FormikFieldError } from '@/components/FormikFieldError';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import type { Patient } from '@/types';
import { PhoneInput } from '@/components/PhoneInput';

interface PatientDialogProps {
  mode?: 'create' | 'edit';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  /**
   * The Patient record to edit. Required in edit mode — the dialog reads
   * everything it needs (id, all profile fields) directly from this object.
   */
  patient?: Patient;
  onSuccess?: (patient: Patient) => void;
}

const EMPTY_FORM = {
  patientName: '',
  patientPhone: '',
  patientEmail: '',
  dateOfBirth: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  medicalNotes: '',
};

/** Map a Patient record into the dialog's form shape. */
const patientToForm = (p?: Patient) => {
  if (!p) return EMPTY_FORM;
  const notes = [p.allergies, p.medications].filter(Boolean).join(' | ');
  return {
    patientName: p.name || '',
    patientPhone: p.phone || '',
    patientEmail: p.email || '',
    dateOfBirth: p.dob || '',
    address: p.address || '',
    emergencyContact: p.emergencyContact || '',
    emergencyPhone: p.emergencyPhone || '',
    medicalNotes: notes,
  };
};

const PatientDialog = ({
  mode = 'create',
  open,
  onOpenChange,
  hideTrigger = false,
  patient,
  onSuccess,
}: PatientDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const dialogOpen = isControlled ? !!open : internalOpen;
  const setDialogOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const isEditMode = mode === 'edit';
  const todayDate = () => dayjs().format('YYYY-MM-DD');
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  const startingValues = useMemo(() => patientToForm(patient), [patient]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: startingValues,
    validationSchema: patientSchema,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        name: values.patientName.trim(),
        phone: values.patientPhone.trim() || undefined,
        email: values.patientEmail.trim() || undefined,
        dob: values.dateOfBirth || undefined,
        address: values.address.trim() || undefined,
        emergencyContact: values.emergencyContact.trim() || undefined,
        emergencyPhone: values.emergencyPhone.trim() || undefined,
        allergies: values.medicalNotes.trim() || undefined,
      };
      try {
        const result = isEditMode
          ? await updatePatientMutation.mutateAsync({
              id: patient!._id,
              payload,
            })
          : await createPatientMutation.mutateAsync(payload);
        onSuccess?.(result);
        resetForm();
        setDialogOpen(false);
      } catch {
        // Error toast handled by mutation hook
      }
    },
  });

  const isPending =
    createPatientMutation.isPending || updatePatientMutation.isPending;

  const trigger = hideTrigger ? undefined : (
    <Button className="btn-3d rounded-xl shadow-primary-glow">
      <Plus className="w-4 h-4 mr-2" />
      New Patient
    </Button>
  );

  const submitLabel = isEditMode
    ? isPending ? 'Saving...' : 'Save Changes'
    : isPending ? 'Adding...' : 'Add Patient';

  return (
    <form onSubmit={formik.handleSubmit}>
      <FormDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isEditMode ? 'Edit Patient' : 'Add New Patient'}
        trigger={trigger}
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              type="button"
              onClick={() => formik.submitForm()}
              disabled={isPending}
              className="flex-1 rounded-xl btn-3d shadow-primary-glow"
            >
              {submitLabel}
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="patientName">Full Name *</Label>
          <Input id="patientName" name="patientName" value={formik.values.patientName} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="Full name" className="rounded-xl" />
          <FormikFieldError error={formik.errors.patientName} touched={formik.touched.patientName} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <PhoneInput
              name="patientPhone"
              label="Phone"
              required
              value={formik.values.patientPhone}
              onChange={(val) => formik.setFieldValue('patientPhone', val)}
              onBlur={formik.handleBlur}
              error={formik.errors.patientPhone}
              touched={formik.touched.patientPhone}
            />
          </div>
          <div className="space-y-1.5 col-span-1">
            <Label htmlFor="patientEmail">Email *</Label>
            <Input id="patientEmail" name="patientEmail" type="email" value={formik.values.patientEmail} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="email@example.com" className="rounded-xl" />
            <FormikFieldError error={formik.errors.patientEmail} touched={formik.touched.patientEmail} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Date of Birth {isEditMode ? '' : '*'}</Label>
          <DatePickerField
            value={formik.values.dateOfBirth}
            onChange={(date) => {
              // Mark touched first (no validate), then set value WITH
              // validation. Reverse order causes Formik to validate
              // against the previous value and falsely report
              // "Date is required" right after selection.
              formik.setFieldTouched('dateOfBirth', true, false);
              formik.setFieldValue('dateOfBirth', date, true);
            }}
            maxDate={todayDate()}
            disableFuture
            showYearDropdown
            placeholder="Select date of birth"
          />
          <FormikFieldError error={formik.errors.dateOfBirth} touched={formik.touched.dateOfBirth} />
        </div>

        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input name="address" value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="Street address" className="rounded-xl" />
          <FormikFieldError error={formik.errors.address} touched={formik.touched.address} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-1">
            <Label>Emergency Contact</Label>
            <Input name="emergencyContact" value={formik.values.emergencyContact} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="Contact name" className="rounded-xl" />
            <FormikFieldError error={formik.errors.emergencyContact} touched={formik.touched.emergencyContact} />
          </div>
          <div className="col-span-1">
            <PhoneInput
              name="emergencyPhone"
              label="Emergency Phone"
              value={formik.values.emergencyPhone}
              onChange={(val) => formik.setFieldValue('emergencyPhone', val)}
              onBlur={formik.handleBlur}
              error={formik.errors.emergencyPhone}
              touched={formik.touched.emergencyPhone}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Medical Notes</Label>
          <textarea
            name="medicalNotes"
            value={formik.values.medicalNotes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Allergies, medications, conditions..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-20"
          />
          <FormikFieldError error={formik.errors.medicalNotes} touched={formik.touched.medicalNotes} />
        </div>
      </FormDialogShell>
    </form>
  );
};

export default PatientDialog;
