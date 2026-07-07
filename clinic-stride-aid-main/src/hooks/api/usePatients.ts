import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createPatient,
  getPatient,
  searchPatients,
  updatePatient,
} from '@/lib/patientsApi';
import { getApiErrorMessage } from '@/lib/api';

export const usePatientSearch = (q: string) =>
  useQuery({
    queryKey: ['patients', 'search', q],
    queryFn: () => searchPatients(q),
    enabled: !!q && q.trim().length >= 2,
    staleTime: 30 * 1000,
  });

export const usePatient = (id: string | undefined | null) =>
  useQuery({
    queryKey: ['patients', 'detail', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

export const useCreatePatient = (opts?: { onSuccess?: () => void }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Patient created');
      opts?.onSuccess?.();
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to create patient')),
  });
};

export const useUpdatePatient = (opts?: { onSuccess?: () => void }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      payload: Parameters<typeof updatePatient>[1];
    }) => updatePatient(vars.id, vars.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Patient updated');
      opts?.onSuccess?.();
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to update patient')),
  });
};
