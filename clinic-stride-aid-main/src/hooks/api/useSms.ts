import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchReminderConfigs,
  updateReminderConfig,
  fetchReminderLog,
  sendAppointmentConfirmationSms,
} from '@/lib/smsApi';
import { getApiErrorMessage } from '@/lib/api';

const STALE_30MIN = 30 * 60 * 1000;

export const useReminderConfigs = () =>
  useQuery({
    queryKey: ['reminder-configs'],
    queryFn: fetchReminderConfigs,
    staleTime: STALE_30MIN,
  });

export const useUpdateReminderConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: { enabled?: boolean; message?: string };
    }) => updateReminderConfig(id, update),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminder-configs'] });
      toast.success('Reminder config updated');
    },
  });
};

export const useReminderLog = () =>
  useQuery({ queryKey: ['reminder-log'], queryFn: fetchReminderLog });

export const useSendAppointmentSms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      sendAppointmentConfirmationSms(appointmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['reminder-log'] });
      toast.success('Appointment SMS sent');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to send appointment SMS')),
  });
};
