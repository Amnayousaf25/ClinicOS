import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAppointments,
  fetchAppointmentStats,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
} from '@/lib/appointmentApi';
import { getApiErrorMessage } from '@/lib/api';
import type { AppointmentStatus } from '@/types';

const STALE_5MIN = 5 * 60 * 1000;

export const useAppointments = (
  period?: 'today' | 'week',
  options?: { enabled?: boolean; staleTime?: number; refetchInterval?: number },
) =>
  useQuery({
    queryKey: ['appointments', period],
    queryFn: () => fetchAppointments(period),
    staleTime: options?.staleTime !== undefined ? options.staleTime : 0,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled !== false,
  });

export const useAppointmentStats = (period?: 'today' | 'week') =>
  useQuery({
    queryKey: ['appointment-stats', period],
    queryFn: () => fetchAppointmentStats(period),
    staleTime: STALE_5MIN,
  });

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment-stats'] });
      toast.success('Appointment created');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to create appointment')),
  });
};

export const useUpdateStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment-stats'] });
      toast.success('Status updated');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to update status')),
  });
};

export const useReschedule = (opts?: { onSuccess?: () => void }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      time,
    }: {
      id: string;
      date: string;
      time: string;
    }) => rescheduleAppointment(id, date, time),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment rescheduled');
      opts?.onSuccess?.();
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to reschedule')),
  });
};

export const useCancel = (opts?: { onSuccess?: () => void }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment-stats'] });
      toast.success('Appointment cancelled');
      opts?.onSuccess?.();
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to cancel')),
  });
};
