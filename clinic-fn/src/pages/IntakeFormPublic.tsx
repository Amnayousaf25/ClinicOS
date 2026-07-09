import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DatePickerField from '@/components/DatePickerField';
import Logo from '@/components/Logo';
import { CheckCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/PhoneInput';
import { intakeBaseValidationShape, intakeSchema } from '@/lib/intakeValidation';
import { IntakeAppointmentLinker } from '@/components/intakeforms/IntakeAppointmentLinker';

interface BookingInfo {
  appointmentId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  service: string;
  date: string;
  time: string;
  clinicName: string;
  intakeFormSubmitted: boolean;
  insuranceProviders?: string[];
}

const validationSchema = intakeSchema.concat(
  Yup.object({
    appointmentIdInput: intakeBaseValidationShape.appointmentIdInput.required(
      'Appointment ID is required',
    ),
  }),
);

const IntakeFormPublic = () => {
  const [params] = useSearchParams();
  const appointmentIdParam = params.get('apt') || '';
  const [submitted, setSubmitted] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(appointmentIdParam);

  const {
    data: bookingInfo,
    isFetching: bookingInfoLoading,
    isError: bookingInfoError,
  } = useQuery({
    queryKey: ['intake-booking', selectedAppointmentId],
    queryFn: async () => {
      if (!selectedAppointmentId) return null;
      const { data } = await api.get<{ data: BookingInfo }>(
        `/intake/${selectedAppointmentId}`,
      );
      return data.data;
    },
    enabled: !!selectedAppointmentId,
  });

  const insuranceProviders = bookingInfo?.insuranceProviders || [];

  const submitMutation = useMutation({
    mutationFn: (formData: Record<string, unknown>) => api.post('/intake', formData),
    onSuccess: () => setSubmitted(true),
    onError: () => toast.error('Failed to submit form. Please try again.'),
  });

  const formik = useFormik({
    initialValues: {
      appointmentIdInput: appointmentIdParam,
      name: '',
      dob: '',
      phone: '',
      email: '',
      reasonForVisit: '',
      consent: false,
      insuranceProvider: '',
    },
    validationSchema,
    onSubmit: (values) => {
      if (!selectedAppointmentId || !bookingInfo) {
        formik.setFieldError(
          'appointmentIdInput',
          'Load an appointment before submitting',
        );
        toast.error('Please link to an appointment first.');
        return;
      }
      submitMutation.mutate({
        appointmentId: selectedAppointmentId,
        name: values.name,
        dob: values.dob,
        phone: values.phone,
        email: values.email,
        reasonForVisit: values.reasonForVisit,
        consent: values.consent,
        insuranceProvider: values.insuranceProvider || undefined,
      });
    },
  });

  useEffect(() => {
    if (!bookingInfo) return;
    formik.setFieldValue('name', bookingInfo.patientName || formik.values.name);
    formik.setFieldValue('phone', bookingInfo.patientPhone || formik.values.phone);
    formik.setFieldValue('email', bookingInfo.patientEmail || formik.values.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingInfo]);

  useEffect(() => {
    if (!bookingInfoError || !selectedAppointmentId) return;
    toast.error('Appointment not found. Please check the appointment ID.');
  }, [bookingInfoError, selectedAppointmentId]);

  const handleLoadAppointment = () => {
    const cleaned = formik.values.appointmentIdInput.trim();
    if (!cleaned) {
      formik.setFieldTouched('appointmentIdInput', true, true);
      toast.error('Please enter an appointment ID.');
      return;
    }
    setSelectedAppointmentId(cleaned);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-lg bg-card rounded-2xl p-8 card-3d">
        {submitted || (bookingInfo && bookingInfo.intakeFormSubmitted) ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {bookingInfo?.intakeFormSubmitted ? 'Already Completed' : 'Form Submitted!'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {bookingInfo?.intakeFormSubmitted
                ? 'An intake form has already been completed for this appointment.'
                : 'Thank you. Your clinic has received your information.'}
            </p>
            {bookingInfo?.intakeFormSubmitted && (
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => {
                  setSelectedAppointmentId('');
                  formik.setFieldValue('appointmentIdInput', '');
                }}
              >
                Link another appointment
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Patient Intake Form</h2>

            <IntakeAppointmentLinker
              appointmentIdInput={formik.values.appointmentIdInput}
              onInputChange={(value) => {
                formik.setFieldValue('appointmentIdInput', value);
                if (selectedAppointmentId && value.trim() !== selectedAppointmentId) {
                  setSelectedAppointmentId('');
                }
              }}
              onBlur={() => formik.setFieldTouched('appointmentIdInput', true)}
              onLoad={handleLoadAppointment}
              loading={bookingInfoLoading}
              inputError={formik.errors.appointmentIdInput}
              inputTouched={formik.touched.appointmentIdInput}
              bookingSummary={bookingInfo ?? undefined}
              noBookingFound={
                !bookingInfo && !!selectedAppointmentId && !bookingInfoLoading
              }
            />

            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input name="name" required value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} className="rounded-xl" />
              {formik.touched.name && formik.errors.name && (
                <p className="text-xs text-destructive">{formik.errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth *</Label>
              <DatePickerField
                value={formik.values.dob}
                onChange={(value) => {
                  formik.setFieldTouched('dob', true, false);
                  formik.setFieldValue('dob', value, true);
                }}
                placeholder="Select date of birth"
                disableFuture
                showYearDropdown
              />
              {formik.touched.dob && formik.errors.dob && (
                <p className="text-xs text-destructive">{formik.errors.dob}</p>
              )}
            </div>
            <PhoneInput
              name="phone"
              label="Phone"
              required
              value={formik.values.phone}
              onChange={(val) => formik.setFieldValue('phone', val)}
              onBlur={formik.handleBlur}
              error={formik.errors.phone}
              touched={formik.touched.phone}
            />
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input name="email" type="email" required value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} className="rounded-xl" />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs text-destructive">{formik.errors.email}</p>
              )}
            </div>

            {insuranceProviders.length > 0 && (
              <div className="space-y-1.5">
                <Label>Insurance Provider</Label>
                <Select
                  value={formik.values.insuranceProvider || '__none__'}
                  onValueChange={(val) =>
                    formik.setFieldValue(
                      'insuranceProvider',
                      val === '__none__' ? '' : val,
                    )
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select insurance provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-- None --</SelectItem>
                    {insuranceProviders.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Reason for Visit *</Label>
              <textarea
                required
                name="reasonForVisit"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground resize-none h-24"
                value={formik.values.reasonForVisit}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.reasonForVisit && formik.errors.reasonForVisit && (
                <p className="text-xs text-destructive">
                  {formik.errors.reasonForVisit}
                </p>
              )}
            </div>

            <div
              onClick={() => formik.setFieldValue('consent', !formik.values.consent)}
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                formik.values.consent
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:border-muted-foreground/30'
              }`}
            >
              <div
                className={`absolute top-3 right-3 w-5 h-5 rounded flex items-center justify-center transition-all ${
                  formik.values.consent
                    ? 'bg-primary text-primary-foreground'
                    : 'border-2 border-muted-foreground/40'
                }`}
              >
                {formik.values.consent && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-sm text-muted-foreground pr-8">
                I consent to the collection of my personal information for treatment purposes.
              </p>
              <input
                type="checkbox"
                checked={formik.values.consent}
                onChange={(e) => formik.setFieldValue('consent', e.target.checked)}
                required
                className="sr-only"
                tabIndex={-1}
              />
            </div>
            {formik.touched.consent && formik.errors.consent && (
              <p className="text-xs text-destructive">{formik.errors.consent}</p>
            )}

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full rounded-xl btn-3d shadow-primary-glow h-12 text-base font-semibold"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Form'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default IntakeFormPublic;
