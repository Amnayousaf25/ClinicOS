import * as Yup from 'yup';

import { phoneYupValidation } from './utils';

// Strict regex jo email ke har character ko step-by-step validate karega
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const emailRule = Yup.string()
  .matches(emailRegex, 'Invalid email address')
  .required('Email is required');

const passwordRule = Yup.string()
  .min(8, 'Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]+$/, 'password must be atleast 8 characters,one upper case , one lower case , one number, one special character.')
  .required('Password is required');

export const loginSchema = Yup.object({
  email: emailRule,
  password: Yup.string().required('Password is required'),
});

export const registerSchema = Yup.object({
  fullName: Yup.string().trim().required('Full name is required'),
  email: emailRule,
  phone: phoneYupValidation(true),
  password: passwordRule,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  role: Yup.mixed<'admin' | 'staff'>().oneOf(['admin', 'staff']).required('Role is required'),
  termsAccepted: Yup.boolean().oneOf([true], 'Please accept the terms and conditions'),
});

export const forgotEmailSchema = Yup.object({
  email: emailRule,
});

export const forgotOtpSchema = Yup.object({
  otp: Yup.string().trim().required('OTP is required'),
});

export const forgotResetSchema = Yup.object({
  password: passwordRule,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export const acceptInviteSchema = Yup.object({
  password: passwordRule,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});