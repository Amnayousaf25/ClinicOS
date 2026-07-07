import type { IntakeStatus } from './intake.types';
import type { Patient } from './patient.types';
import type { Provider, Service } from './service.types';
import type { PopulatedRef } from './api.types';

export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'no-show'
  | 'arrived'
  | 'rescheduled';

export type AppointmentType = 'scheduled' | 'walk-in';

export interface Appointment {
  _id: string;
  patientId?: PopulatedRef<Patient>;
  serviceId?: PopulatedRef<Pick<Service, '_id' | 'name'>>;
  providerId?: PopulatedRef<Pick<Provider, '_id' | 'name' | 'title'>>;
  date: string;
  time: string;
  status: AppointmentStatus;
  intakeStatus: IntakeStatus;
  intakeFormSubmitted?: boolean;
  smsReminders?: { type: string; sent: boolean }[];
  remindersSent?: number;
  remindersTotal?: number;
  notes?: string;
  appointmentType?: AppointmentType;
  bookingId?: string;
  rescheduleCount?: number;
}

export interface BlockedSlot {
  _id?: string;
  date: string;
  time: string;
  reason?: string;
}

export interface CreateAppointmentInput {
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  dob?: string;
  serviceId: string;
  providerId?: string;
  date: string;
  time: string;
  notes?: string;
}
