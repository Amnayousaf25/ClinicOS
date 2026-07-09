export type IntakeStatus = 'confirmed' | 'submitted' | 'pending' | 'not-sent';

export interface IntakeForm {
  _id?: string;
  appointmentId: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  reasonForVisit: string;
  consent: boolean;
  submittedAt?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
}

export interface IntakeAppointmentInfo {
  appointmentId: string;
  patientName: string;
  service: string;
  date: string;
  time: string;
  clinicName: string;
  intakeFormSubmitted: boolean;
}
