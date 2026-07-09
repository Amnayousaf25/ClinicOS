import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.trim();
const baseURL = API_URL ? `${API_URL}/api/v1` : '/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinicos_token') || sessionStorage.getItem('clinicos_token');
  if (token && config.headers) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isAuthRequest = /\/auth\/(login|refresh|forgot-password|verify-forgot-password-otp|verify-reset-password|invite)/.test(requestUrl);

      if (!isAuthRequest) {
        localStorage.removeItem('clinicos_token');
        localStorage.removeItem('clinicos_refresh_token');
        sessionStorage.removeItem('clinicos_token');
        sessionStorage.removeItem('clinicos_refresh_token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getOrgSlug(): string {
  const slug = import.meta.env.VITE_ORG_SLUG?.trim();
  if (!slug) throw new Error('Missing required environment variable: VITE_ORG_SLUG');
  return slug;
}
