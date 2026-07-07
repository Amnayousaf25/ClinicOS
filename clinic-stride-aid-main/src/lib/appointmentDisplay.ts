import type { Appointment, Patient, PopulatedRef, Provider, Service } from '@/types';

export function populatedDoc<T>(ref: PopulatedRef<T>): T | null {
  return ref && typeof ref === 'object' ? ref : null;
}

export function refId<T extends { _id: string }>(ref: PopulatedRef<T>): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id;
}

export function appointmentPatient(appointment: Appointment): Patient | null {
  return populatedDoc<Patient>(appointment.patientId);
}

export function appointmentService(
  appointment: Appointment,
): Pick<Service, '_id' | 'name'> | null {
  return populatedDoc<Pick<Service, '_id' | 'name'>>(appointment.serviceId);
}

export function appointmentProvider(
  appointment: Appointment,
): Pick<Provider, '_id' | 'name' | 'title'> | null {
  return populatedDoc<Pick<Provider, '_id' | 'name' | 'title'>>(appointment.providerId);
}

export function patientName(appointment: Appointment): string {
  return appointmentPatient(appointment)?.name || '';
}

export function patientPhone(appointment: Appointment): string {
  return appointmentPatient(appointment)?.phone || '';
}

export function patientEmail(appointment: Appointment): string {
  return appointmentPatient(appointment)?.email || '';
}

export function patientMrn(appointment: Appointment): string {
  return appointmentPatient(appointment)?.mrn || '';
}

export function serviceName(appointment: Appointment): string {
  return appointmentService(appointment)?.name || '';
}
