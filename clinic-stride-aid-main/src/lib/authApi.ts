import api, { getApiErrorMessage } from './api';
import type { InviteValidateResponse, LoginResponse, Role } from '@/types';

function mapRole(beRole: string): Role {
  if (beRole === 'admin' || beRole === 'superadmin') return 'admin';
  return 'staff';
}

export async function loginApi(email: string, password: string, rememberMe: boolean) {
  const { data } = await api.post<{ data: LoginResponse }>('/auth/login', { email, password, rememberMe });
  const r = data.data;
  if (rememberMe) {
    sessionStorage.removeItem('clinicos_token');
    sessionStorage.removeItem('clinicos_refresh_token');
    localStorage.setItem('clinicos_token', r.accessToken);
    localStorage.setItem('clinicos_refresh_token', r.refreshToken);
  } else {
    localStorage.removeItem('clinicos_token');
    localStorage.removeItem('clinicos_refresh_token');
    sessionStorage.setItem('clinicos_token', r.accessToken);
    sessionStorage.setItem('clinicos_refresh_token', r.refreshToken);
  }
  return { email: r.user.email, role: mapRole(r.user.role) };
}

export async function registerApi(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role?: 'admin' | 'staff';
  termsAccepted: boolean;
}) {
  const { fullName, confirmPassword, termsAccepted, ...rest } = payload;
  const bePayload = {
    name: fullName,
    ...rest,
  };
  const { data } = await api.post<{ data: LoginResponse | { authenticated?: boolean; message?: string } }>('/auth/register', bePayload);
  const r = data.data as Partial<LoginResponse> | undefined;
  if (r?.accessToken && r?.refreshToken) {
    sessionStorage.removeItem('clinicos_token');
    sessionStorage.removeItem('clinicos_refresh_token');
    localStorage.setItem('clinicos_token', r.accessToken);
    localStorage.setItem('clinicos_refresh_token', r.refreshToken);
  }
  return data.data;
}

export function getRegistrationErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string | string[] } } };
    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message;

    if (import.meta.env.DEV) {
      console.error('Registration API Error:', error);
    }

    if (message) {
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      return message;
    }

    if (status === 409) {
      return 'An account with this email or phone number already exists.';
    }

    if (status === 400) {
      return 'Please check your input and try again.';
    }

    if (status === 404) {
      return 'Registration is not available right now. Please contact the administrator.';
    }
  }

  return 'Unable to create your account right now. Please check your connection and try again.';
}

export async function getMeApi() {
  const { data } = await api.get<{ data: { user: LoginResponse['user'] } }>('/auth/me');
  return { _id: data.data.user._id, email: data.data.user.email, role: mapRole(data.data.user.role) };
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function forgotPasswordApi(email: string) {
  await api.post('/auth/forgot-password', { email });
}

/**
 * Step 2 of the OTP-based reset flow. Returns a short-lived JWT that the
 * caller passes to {@link resetPasswordApi} when setting the new password.
 */
export async function verifyForgotPasswordOtpApi(email: string, otp: string) {
  const { data } = await api.post<{ data: { token: string; message: string } }>(
    '/auth/verify-forgot-password-otp',
    { email, otp },
  );
  return data.data.token;
}

export async function resetPasswordApi(email: string, token: string, password: string) {
  await api.post('/auth/verify-reset-password', { email, token, password });
}

export async function validateInviteApi(token: string): Promise<InviteValidateResponse> {
  const { data } = await api.get<{ data: InviteValidateResponse }>(`/auth/invite/${token}`);
  return data.data;
}

export async function acceptInviteApi(token: string, email: string, password: string) {
  const { data } = await api.post<{ data: LoginResponse }>('/auth/invite/accept', { token, email, password });
  sessionStorage.removeItem('clinicos_token');
  sessionStorage.removeItem('clinicos_refresh_token');
  localStorage.setItem('clinicos_token', r.accessToken);
  localStorage.setItem('clinicos_refresh_token', r.refreshToken);
  return { _id: r.user._id, email: r.user.email, role: mapRole(r.user.role) };
}

export { getApiErrorMessage };
