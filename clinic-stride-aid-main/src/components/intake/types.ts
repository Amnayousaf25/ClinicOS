export type Mode = 'appointment' | 'walk-in';

export interface IntakeFormValues {
  mode: Mode;
  appointmentId: string;
  patientId: string;
  serviceId: string;
  providerId: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  reasonForVisit: string;
  consent: boolean;
  insuranceNumber: string;
  insuranceProvider: string;
  allergies: string;
  medications: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export const initialIntakeValues: IntakeFormValues = {
  mode: 'appointment',
  appointmentId: '',
  patientId: '',
  serviceId: '',
  providerId: '',
  name: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  reasonForVisit: '',
  consent: false,
  insuranceNumber: '',
  insuranceProvider: '',
  allergies: '',
  medications: '',
  emergencyContact: '',
  emergencyPhone: '',
};
