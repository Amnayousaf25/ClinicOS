import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchStaff,
  inviteStaff,
  updateStaff,
  deleteStaff,
  restoreStaff,
  getProfileImageUrl,
} from '@/lib/staffApi';
import { getApiErrorMessage } from '@/lib/api';
import type { InviteStaffPayload } from '@/types';

const STALE_5MIN = 5 * 60 * 1000;
const STALE_PRESIGNED = 50 * 60 * 1000; // presigned URLs valid ~1hr

export const useStaff = () =>
  useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff,
    staleTime: STALE_5MIN,
  });

export const useInviteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteStaffPayload) => inviteStaff(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member invited');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to invite staff')),
  });
};

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      role?: 'admin' | 'staff';
      isActive?: boolean;
      profileImage?: string;
    }) => updateStaff(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to update staff')),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member removed');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to remove staff')),
  });
};

export const useRestoreStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member restored');
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to restore staff')),
  });
};

export const useProfileImageUrl = (key: string | undefined) =>
  useQuery({
    queryKey: ['profile-image-url', key],
    queryFn: () => getProfileImageUrl(key!),
    enabled: !!key,
    staleTime: STALE_PRESIGNED,
  });
