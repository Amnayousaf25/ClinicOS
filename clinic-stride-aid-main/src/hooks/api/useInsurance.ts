import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchInsuranceProviders,
  addInsuranceProvider,
  removeInsuranceProvider,
} from '@/lib/settingsApi';
import { getApiErrorMessage } from '@/lib/api';

const STALE_30MIN = 30 * 60 * 1000;

export const useInsuranceProviders = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['insurance-providers'],
    queryFn: fetchInsuranceProviders,
    staleTime: STALE_30MIN,
    enabled: options?.enabled !== false,
  });

export const useAddInsuranceProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addInsuranceProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-providers'] });
      toast.success('Insurance provider added');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to add insurance provider')),
  });
};

export const useRemoveInsuranceProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeInsuranceProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-providers'] });
      toast.success('Insurance provider removed');
    },
    onError: (err: unknown) =>
      toast.error(
        getApiErrorMessage(err, 'Failed to remove insurance provider'),
      ),
  });
};
