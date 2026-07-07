import api from './api';
import type { ApiResponse, Appointment, ReminderConfig, SmsLogEntry } from '@/types';

export async function fetchReminderConfigs() {
  const { data } = await api.get<ApiResponse<ReminderConfig[]>>(
    '/reminders/configs',
  );
  return data.data;
}

export async function updateReminderConfig(id: string, update: { enabled?: boolean; message?: string }) {
  const { data } = await api.patch<ApiResponse<ReminderConfig>>(
    `/reminders/configs/${id}`,
    update,
  );
  return data.data;
}

export async function fetchReminderLog(): Promise<SmsLogEntry[]> {
  const { data } = await api.get<
    ApiResponse<{ data: SmsLogEntry[]; total: number }>
  >('/reminders/log', { params: { limit: 100 } });
  return data.data.data;
}

export async function sendAppointmentConfirmationSms(
  appointmentId: string,
): Promise<Appointment> {
  const { data } = await api.post<ApiResponse<Appointment>>(
    `/appointments/${appointmentId}/send-confirmation-sms`,
  );
  return data.data;
}
