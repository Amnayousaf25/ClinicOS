import api from './api';
import type {
  ApiResponse,
  CreatePatientPayload,
  Patient,
  UpdatePatientPayload,
} from '@/types';

export async function searchPatients(q: string): Promise<Patient[]> {
  if (!q || q.trim().length < 2) return [];
  const { data } = await api.get<ApiResponse<Patient[]>>(
    '/patients/search',
    { params: { q, limit: 10 } },
  );
  return data.data;
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
  return data.data;
}

export async function createPatient(
  payload: CreatePatientPayload,
): Promise<Patient> {
  const { data } = await api.post<ApiResponse<Patient>>(
    '/patients',
    payload,
  );
  return data.data;
}

export async function updatePatient(
  id: string,
  payload: UpdatePatientPayload,
): Promise<Patient> {
  const { data } = await api.patch<ApiResponse<Patient>>(
    `/patients/${id}`,
    payload,
  );
  return data.data;
}
