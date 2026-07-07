import api from './api';
import type { ApiResponse, StaffMember, InviteStaffPayload } from '@/types';

export async function fetchStaff(): Promise<StaffMember[]> {
  // Pull active + inactive — the staff dashboard renders deactivated users
  // too, with an "Inactive" badge so admins can re-activate them.
  const { data } = await api.get<ApiResponse<StaffMember[]>>('/users', {
    params: { includeInactive: 'true' },
  });
  return data.data || [];
}

export async function inviteStaff(payload: InviteStaffPayload): Promise<void> {
  await api.post<ApiResponse<unknown>>('/users/invite', payload);
}

export async function updateStaff(
  id: string,
  payload: { name?: string; role?: 'admin' | 'staff'; isActive?: boolean; profileImage?: string },
): Promise<void> {
  await api.patch<ApiResponse<unknown>>(`/users/${id}`, payload);
}

export async function deleteStaff(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function restoreStaff(id: string): Promise<void> {
  await api.post(`/users/${id}/restore`);
}

export async function uploadProfileImage(file: File): Promise<{ id: string; key: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiResponse<{ id: string; key: string }>>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function getProfileImageUrl(key: string): Promise<string> {
  const { data } = await api.get<ApiResponse<{ url: string }>>(`/media/presigned-url/${encodeURIComponent(key)}`);
  return data.data.url;
}
