import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchPublicServices,
  fetchPublicTimeSlots,
  createPublicBooking,
} from '@/lib/appointmentApi';
import { getApiErrorMessage } from '@/lib/api';

const STALE_30MIN = 30 * 60 * 1000;
const STALE_10MIN = 10 * 60 * 1000;

export const usePublicServices = () =>
  useQuery({
    queryKey: ['public-services'],
    queryFn: fetchPublicServices,
    staleTime: STALE_30MIN,
  });

export const usePublicTimeSlots = (date: string) =>
  useQuery({
    queryKey: ['public-time-slots', date],
    queryFn: () => fetchPublicTimeSlots(date),
    enabled: !!date,
    staleTime: STALE_10MIN,
  });

export const useCreateBooking = () =>
  useMutation({
    mutationFn: createPublicBooking,
    onSuccess: () => toast.success('Booking confirmed!'),
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Booking failed')),
  });
