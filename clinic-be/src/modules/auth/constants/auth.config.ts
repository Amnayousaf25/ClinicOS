export enum CONFIG {
  OTP_SECRET = 'OTP_SECRET',
  JWT_SECRET = 'JWT_SECRET',
  MONGODB_URI = 'MONGODB_URI',
  FRONTEND_URL = 'FRONTEND_URL',

  GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET = 'GOOGLE_CLIENT_SECRET',
}

export const ACCESS_TOKEN_VALIDITY = '7d';
export const REFRESH_TOKEN_VALIDITY = '60d';
export const DEFAULT_TOKEN_VALIDITY = '7d';

export const EMAIL_TOKEN_VALIDITY = '30m';

// OTP Configuration
export const OTP_EXPIRY_MINUTES = 5; // OTP validity in minutes
export const OTP_LENGTH = 6; // OTP length
export const OTP_MAX_ATTEMPTS = 5; // Maximum OTP verification attempts
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // Cooldown between OTP resend requests

// Feature Flags
export const USE_REFRESH_TOKEN = true; // Set to true to use refresh token flow
export const USE_TOTP = true; // Set to true to use TOTP, false for simple secure OTP
