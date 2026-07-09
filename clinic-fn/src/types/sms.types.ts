export type ReminderType = 'confirmation' | '24h' | '2h';

export interface ReminderConfig {
  _id: string;
  type: string;
  label: string;
  enabled: boolean;
  message: string;
}

export interface SmsLogEntry {
  _id: string;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  type: ReminderType;
  body: string;
  status: 'sent' | 'scheduled' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  reply?: 'YES' | 'NO';
}
