import api from './api';
import dayjs from 'dayjs';
import type { ApiResponse, Appointment, IntakeAppointmentInfo, IntakeForm } from '@/types';
import type { QueryClient } from '@tanstack/react-query';

export async function fetchIntakeAppointmentInfo(appointmentId: string) {
  const { data } = await api.get<ApiResponse<IntakeAppointmentInfo>>(`/intake/${appointmentId}`);
  return data.data;
}

export async function submitIntakeForm(form: {
  appointmentId?: string;
  patientId?: string;
  serviceId?: string;
  providerId?: string;
  appointmentType?: 'scheduled' | 'walk-in';
  name: string;
  dob: string;
  phone: string;
  email: string;
  address?: string;
  reasonForVisit: string;
  consent: boolean;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}) {
  const { data } = await api.post<ApiResponse<IntakeForm>>('/intake', form);
  return data.data;
}

export async function fetchIntakeSubmission(appointmentId: string): Promise<IntakeForm | null> {
  try {
    const { data } = await api.get<ApiResponse<IntakeForm>>(`/intake/${appointmentId}/submission`);
    return data.data;
  } catch {
    return null;
  }
}

export async function updateIntakeSubmission(
  appointmentId: string,
  form: Partial<Pick<IntakeForm, 'name' | 'dob' | 'phone' | 'email' | 'reasonForVisit' | 'consent' | 'insuranceProvider'>>,
) {
  const { data } = await api.patch<ApiResponse<IntakeForm>>(`/intake/${appointmentId}/submission`, form);
  return data.data;
}

export function writeIntakeSubmissionCache(
  qc: QueryClient,
  intakeForm: IntakeForm,
) {
  qc.setQueryData(['intake-submission', intakeForm.appointmentId], intakeForm);
}

export function writeAppointmentIntakeCache(
  qc: QueryClient,
  intakeForm: IntakeForm,
) {
  qc.setQueriesData<Appointment[]>({ queryKey: ['appointments'] }, (current) => {
    if (!current) return current;
    return current.map((appointment) =>
      appointment._id === intakeForm.appointmentId
        ? {
            ...appointment,
            intakeStatus: 'confirmed',
            // Match backend rule: auto-arrive only on same-day intake.
            status:
              appointment.date === dayjs().format('YYYY-MM-DD') &&
              (appointment.status === 'pending' ||
                appointment.status === 'confirmed' ||
                appointment.status === 'rescheduled')
                ? 'arrived'
                : appointment.status,
          }
        : appointment,
    );
  });
}
