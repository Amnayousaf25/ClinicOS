import * as Yup from 'yup';
import dayjs from 'dayjs';

const todayKey = () => dayjs().format('YYYY-MM-DD');

import { phoneYupValidation } from './utils';

export const intakeBaseValidationShape = {
  appointmentIdInput: Yup.string().trim(),
  name: Yup.string().trim().required('Name is required'),
  dob: Yup.string()
    .required('Date of birth is required')
    .test('not-in-future', 'Date of birth cannot be in the future', (value) => {
      if (!value) return false;
      return value <= todayKey();
    }),
  phone: phoneYupValidation(true),
  email: Yup.string().email('Invalid email').required('Email is required'),
  reasonForVisit: Yup.string().trim().required('Reason for visit is required'),
  insuranceProvider: Yup.string(),
};

export const intakeSchema = Yup.object({
  ...intakeBaseValidationShape,
  consent: Yup.boolean().oneOf([true], 'Consent is required'),
});