export interface Patient {
  _id: string;
  mrn: string;
  phone: string;
  name: string;
  email?: string;
  dob?: string;
  address?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  lastVisitAt?: string | null;
}

/**
 * Mutable patient profile fields. Used by both the create and update
 * flows — `CreatePatientPayload` requires `name`, `UpdatePatientPayload`
 * makes everything optional. Keep these in lockstep with the backend's
 * CreatePatientDto / UpdatePatientDto.
 */
export interface PatientProfileFields {
  name: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export type CreatePatientPayload = PatientProfileFields;

export type UpdatePatientPayload = Partial<PatientProfileFields>;
