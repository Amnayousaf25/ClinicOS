import { useEffect } from 'react';
import type { FormikProps } from 'formik';
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
import { FormikFieldError } from '@/components/FormikFieldError';
import { PatientSearchPanel } from '@/components/PatientSearchPanel';
import { PhoneInput } from '@/components/PhoneInput';
import type { Appointment, Patient, Provider, Service } from '@/types';
import { refId, patientEmail, patientPhone } from '@/lib/appointmentDisplay';

export interface AppointmentFormValues {
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientDob: string;
  serviceId: string;
  providerId: string;
  date: string;
  time: string;
  notes: string;
}

interface Props {
  formik: FormikProps<AppointmentFormValues>;
  services: Service[];
  providers: Provider[];
  appointments: Appointment[];
  onPatientPicked: (patient: Patient) => void;
  onAppointmentPicked: (appointment: Appointment) => void;
}

export const AppointmentPatientFields = ({
  formik,
  services,
  providers,
  appointments,
  onPatientPicked,
  onAppointmentPicked,
}: Props) => {


  const fe = (name: keyof AppointmentFormValues) => (
    <FormikFieldError
      error={formik.errors[name]}
      touched={formik.touched[name]}
    />
  );

  return (
    <>
      <PatientSearchPanel
        onPick={onPatientPicked}
        appointments={appointments}
        onPickAppointment={onAppointmentPicked}
      />

      <div className="space-y-1.5">
        <Label>Patient Name *</Label>
        <Input
          name="patientName"
          value={formik.values.patientName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Full name"
          className="rounded-xl"
        />
        {fe('patientName')}
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
          <Label>Email *</Label>
          <Input
            name="patientEmail"
            type="email"
            value={formik.values.patientEmail}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="patient@email.com"
            className="rounded-xl"
          />
          {fe('patientEmail')}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Date of Birth</Label>
        <DatePickerField
          value={formik.values.patientDob}
          onChange={(value) => {
            formik.setFieldTouched('patientDob', true, false);
            formik.setFieldValue('patientDob', value, true);
          }}
          disableFuture
          showYearDropdown
          placeholder="Select date of birth"
        />
        {fe('patientDob')}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Service *</Label>
          <Select
            value={formik.values.serviceId || '__all__'}
            onValueChange={(val) => {
              const serviceIdValue = val === '__all__' ? '' : val;
              formik.setFieldValue('serviceId', serviceIdValue);
              // Auto-refresh the doctor list: if current provider isn't assigned to this service, clear it.
              const matchedProvider = providers.find(p => p._id === formik.values.providerId);
              const pServiceId = matchedProvider ? (typeof matchedProvider.serviceId === 'object' && matchedProvider.serviceId ? matchedProvider.serviceId._id : matchedProvider.serviceId) : null;
              if (serviceIdValue && pServiceId !== serviceIdValue) {
                formik.setFieldValue('providerId', '');
              }
            }}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Services</SelectItem>
              {services.filter((s) => !s.name.toLowerCase().includes('follow-up')).map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name} ({s.duration}m · ${s.price})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fe('serviceId')}
        </div>
        <div className="space-y-1.5">
          <Label>Provider</Label>
          {(() => {
            const selectedServiceId = formik.values.serviceId;
            const filteredProviders = providers.filter((p) => {
              if (!selectedServiceId || selectedServiceId === '') return true;
              const pServiceId = typeof p.serviceId === 'object' && p.serviceId ? p.serviceId._id : p.serviceId;
              return pServiceId === selectedServiceId;
            });

            return (
              <Select
                value={formik.values.providerId || '__none__'}
                disabled={filteredProviders.length === 0}
                onValueChange={(val) =>
                  formik.setFieldValue(
                    'providerId',
                    val === '__none__' ? '' : val,
                  )
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue
                    placeholder={
                      filteredProviders.length === 0
                        ? 'No doctors available'
                        : 'Select provider'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredProviders.length > 0 && (
                    <SelectItem value="__none__">Unassigned</SelectItem>
                  )}
                  {filteredProviders.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                      {p.title ? ` — ${p.title}` : ''}
                    </SelectItem>
                  ))}
                  {filteredProviders.length === 0 && (
                    <SelectItem value="__none__" disabled>
                      No doctors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
      </div>
    </>
  );
};
