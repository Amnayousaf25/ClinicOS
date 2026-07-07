import * as Yup from 'yup';
import dayjs from 'dayjs';

const todayDate = () => dayjs().format('YYYY-MM-DD');

import { phoneYupValidation } from './utils';

// Core patient field validations (reusable across forms)
export const patientCoreFields = {
  patientName: Yup.string()
    .required('Name is required')
    .min(2, 'Name too short')
    .max(100, 'Name too long'),
  patientPhone: phoneYupValidation(true),
  patientEmail: Yup.string()
    .required('Email is required')
    .email('Invalid email'),
  dateOfBirth: Yup.string()
    .required('Date of birth is required')
    .test('not-in-future', 'Date of birth cannot be in the future', (value) => {
      if (!value) return false;
      return value <= todayDate();
    }),
};

// Optional patient fields
export const patientOptionalFields = {
  address: Yup.string().max(200, 'Address too long'),
  emergencyContact: Yup.string().max(100, 'Emergency contact name too long'),
  emergencyPhone: phoneYupValidation(false),
  medicalNotes: Yup.string().max(500, 'Notes too long'),
};

// Unified patient schema (used for both create and edit)
export const patientSchema = Yup.object({
  patientName: patientCoreFields.patientName,
  patientPhone: patientCoreFields.patientPhone,
  patientEmail: patientCoreFields.patientEmail,
  dateOfBirth: patientCoreFields.dateOfBirth,
  ...patientOptionalFields,
});



// Appointment form schema (core patient fields + appointment-specific fields)
export const appointmentFormSchema = Yup.object({
  patientName: patientCoreFields.patientName,
  patientPhone: patientCoreFields.patientPhone,
  patientEmail: patientCoreFields.patientEmail,
  serviceId: Yup.string().required('Service is required'),
  date: Yup.string()
    .required('Date is required')
    .test('not-past', 'Cannot select a past date', (val) => {
      if (!val) return false;
      return val >= todayDate();
    }),
  time: Yup.string().required('Time is required'),
  notes: Yup.string().max(500, 'Notes too long'),
});
