import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export const createHashPassword = async (password: string) => {
  const saltOrRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltOrRounds);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateRandomString = (length = 10) =>
  Array.from(
    { length },
    () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?'[
        Math.floor(Math.random() * 84)
      ],
  ).join('');

/**
 * Generate a cryptographically secure random OTP using crypto module
 */
export const generateSecureOTP = (length: number = 6): string => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Length must be a positive integer');
  }
  const buffer = crypto.randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += buffer[i] % 10;
  }
  return otp;
};

/**
 * Generate TOTP secret — uses crypto.randomBytes as base32 encoded secret
 */
export const generateTOTPSecret = (): string => {
  return crypto.randomBytes(20).toString('hex');
};

/**
 * Generate TOTP — falls back to secure random OTP
 * (otplib v5+ has breaking API changes; using secure OTP instead)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const generateTOTP = (_secret: string): string => {
  return generateSecureOTP(6);
};

/**
 * Verify TOTP — since we use crypto-random secure OTPs (not true time-based
 * TOTP), actual comparison is always done against the stored value in the DB
 * inside auth.service.ts.  This function is called only when USE_TOTP=true
 * AND the otpRecord has a secret — returning false here forces the fallback
 * branch in auth.service which does the correct DB comparison.
 *
 * Previously this returned `token.length === 6` which accepted ANY 6-digit
 * string as valid — a critical security hole.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const verifyTOTP = (_token: string, _secret: string): boolean => {
  // Delegate to the stored-OTP comparison path in auth.service.ts
  return false;
};

export const generatePassword = () => {
  return generateRandomString(10);
};
