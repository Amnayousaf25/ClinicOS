import api from './api';
import type { ApiResponse, ClinicSettings, Service, Provider, BlockedSlot, InsuranceProvider } from '@/types';

// ─── Clinic Settings ───────────────────────────────────────────────────────

export async function fetchSettings(): Promise<ClinicSettings> {
  const { data } = await api.get<ApiResponse<ClinicSettings>>(
    '/clinic-settings',
  );
  return data.data;
}

export async function updateSettings(settings: Partial<ClinicSettings>) {
  const { data } = await api.patch<ApiResponse<ClinicSettings>>(
    '/clinic-settings',
    settings,
  );
  return data.data;
}

// ─── Services ──────────────────────────────────────────────────────────────

export async function fetchServices(): Promise<Service[]> {
  const { data } = await api.get<ApiResponse<Service[]>>('/services');
  return data.data;
}

export async function addService(service: Omit<Service, '_id'>) {
  const { data } = await api.post<ApiResponse<Service>>(
    '/services',
    service,
  );
  return data.data;
}

export async function updateService(id: string, updates: Partial<Omit<Service, '_id'>>) {
  const { data } = await api.patch<ApiResponse<Service>>(
    `/services/${id}`,
    updates,
  );
  return data.data;
}

export async function removeService(id: string) {
  await api.delete(`/services/${id}`);
}

// ─── Providers ─────────────────────────────────────────────────────────────

export async function fetchProviders(): Promise<Provider[]> {
  const { data } = await api.get<ApiResponse<Provider[]>>('/providers');
  return data.data;
}

export async function addProvider(provider: { name: string; title?: string; serviceId?: string }) {
  const { data } = await api.post<ApiResponse<Provider>>(
    '/providers',
    provider,
  );
  return data.data;
}

export async function updateProvider(id: string, updates: Partial<{ name: string; title: string; serviceId: string }>) {
  const { data } = await api.patch<ApiResponse<Provider>>(
    `/providers/${id}`,
    updates,
  );
  return data.data;
}

export async function removeProvider(id: string) {
  await api.delete(`/providers/${id}`);
}

// ─── Blocked Slots ─────────────────────────────────────────────────────────

export async function fetchBlockedSlots(): Promise<BlockedSlot[]> {
  const { data } = await api.get<
    ApiResponse<{ blockedSlots?: BlockedSlot[] }>
  >('/clinic-settings');
  return data.data.blockedSlots || [];
}

export async function blockSlot(slot: { date: string; time: string }) {
  await api.post('/clinic-settings/block-slot', slot);
}

export async function unblockSlot(slot: { date: string; time: string }) {
  await api.delete('/clinic-settings/block-slot', { data: slot });
}

// ─── Insurance Providers ───────────────────────────────────────────────────

export async function fetchInsuranceProviders(): Promise<InsuranceProvider[]> {
  const { data } = await api.get<ApiResponse<InsuranceProvider[]>>(
    '/insurance-providers',
  );
  return data.data;
}

export async function addInsuranceProvider(name: string) {
  const { data } = await api.post<ApiResponse<InsuranceProvider>>(
    '/insurance-providers',
    { name },
  );
  return data.data;
}

export async function removeInsuranceProvider(id: string) {
  await api.delete(`/insurance-providers/${id}`);
}
