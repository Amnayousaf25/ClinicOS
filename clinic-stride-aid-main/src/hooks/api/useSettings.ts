import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchSettings,
  updateSettings,
  fetchServices,
  addService,
  updateService,
  removeService,
  fetchProviders,
  addProvider,
  updateProvider,
  removeProvider,
  blockSlot,
  unblockSlot,
  fetchBlockedSlots,
} from '@/lib/settingsApi';
import { getApiErrorMessage } from '@/lib/api';

const STALE_30MIN = 30 * 60 * 1000;
const STALE_10MIN = 10 * 60 * 1000;

// ─── Clinic Settings ────────────────────────────────────────────────────────

export const useClinicSettings = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['clinic-settings'],
    queryFn: fetchSettings,
    staleTime: STALE_30MIN,
    enabled: options?.enabled !== false,
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-settings'] });
      toast.success('Settings saved');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to save settings')),
  });
};

// ─── Services ───────────────────────────────────────────────────────────────

export const useServices = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: STALE_30MIN,
    enabled: options?.enabled !== false,
  });

export const useAddService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service added');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to add service')),
  });
};

export const useUpdateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      duration?: number;
      price?: number;
      category?: string;
    }) => updateService(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service updated');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to update service')),
  });
};

export const useRemoveService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service removed');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to remove service')),
  });
};

// ─── Providers ──────────────────────────────────────────────────────────────

export const useProviders = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['providers'],
    queryFn: fetchProviders,
    staleTime: STALE_30MIN,
    enabled: options?.enabled !== false,
  });

export const useAddProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider added');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to add provider')),
  });
};

export const useUpdateProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      title?: string;
      serviceId?: string;
    }) => updateProvider(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider updated');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to update provider')),
  });
};

export const useRemoveProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider removed');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to remove provider')),
  });
};

// ─── Blocked Slots ──────────────────────────────────────────────────────────

export const useBlockedSlots = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['blocked-slots'],
    queryFn: fetchBlockedSlots,
    staleTime: STALE_10MIN,
    enabled: options?.enabled !== false,
  });

export const useBlockSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blockSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-slots'] });
      qc.invalidateQueries({ queryKey: ['clinic-settings'] });
      toast.success('Slot blocked');
    },
  });
};

export const useUnblockSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unblockSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-slots'] });
      qc.invalidateQueries({ queryKey: ['clinic-settings'] });
      toast.success('Slot unblocked');
    },
  });
};
