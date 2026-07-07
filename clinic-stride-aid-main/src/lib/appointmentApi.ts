import api, { getOrgSlug } from './api';
import type {
  ApiResponse,
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  Service,
} from '@/types';

export async function fetchAppointments(period?: 'today' | 'week') {
  const { data } = await api.get<ApiResponse<Appointment[]>>('/appointments', { params: { period } });
  return data.data;
}

export async function fetchAppointmentStats(period?: 'today' | 'week') {
  const { data } = await api.get<ApiResponse<{
    total: number; confirmed: number; pending: number; noShow: number; cancelled: number;
  }>>('/appointments/stats', { params: { period } });
  return data.data;
}

export async function createAppointment(input: CreateAppointmentInput) {
  // Strip to DTO-accepted fields only; backend rejects unknown properties.
  const payload = {
    patientId: input.patientId || undefined,
    patientName: input.patientName,
    patientPhone: input.patientPhone,
    patientEmail: input.patientEmail || undefined,
    dob: input.dob || undefined,
    serviceId: input.serviceId,
    providerId: input.providerId || undefined,
    date: input.date,
    time: input.time,
    notes: input.notes || undefined,
  };
  const { data } = await api.post<ApiResponse<Appointment>>(
    '/appointments',
    payload,
  );
  return data.data;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const { data } = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
  return data.data;
}

export async function rescheduleAppointment(id: string, date: string, time: string) {
  const { data } = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, { date, time });
  return data.data;
}

export async function cancelAppointment(id: string) {
  const { data } = await api.delete<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data;
}

// Public booking
export async function fetchPublicServices() {
  const { data } = await api.get<ApiResponse<Service[]>>(
    `/booking/${getOrgSlug()}/services`,
  );
  return data.data;
}

export async function fetchPublicTimeSlots(date: string) {
  const { data } = await api.get<ApiResponse<{ time: string; available: boolean }[]>>(
    `/booking/${getOrgSlug()}/time-slots`,
    { params: { date } },
  );
  return data.data;
}

export async function createPublicBooking(req: {
  serviceId: string; date: string; time: string;
  firstName: string; lastName: string; phone: string; email?: string;
}) {
  const { data } = await api.post<ApiResponse<{
    bookingId: string; patientName: string; service: string; date: string; time: string; clinicName: string;
  }>>(`/booking/${getOrgSlug()}`, req);
  return data.data;
}
