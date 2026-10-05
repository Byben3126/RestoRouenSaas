import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export type Outlet = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  googleMyBusinessLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateOutletPayload = {
  name: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  googleMyBusinessLink?: string;
};

export type UpdateOutletPayload = Partial<CreateOutletPayload & { isActive: boolean }>;

const BASE = '/restaurant/me/outlets';

export async function fetchOutlets(): Promise<Outlet[]> {
  const { data } = await apiClient.get<ApiResponse<Outlet[]>>(BASE);
  return data.data;
}

export async function createOutlet(payload: CreateOutletPayload): Promise<Outlet> {
  const { data } = await apiClient.post<ApiResponse<Outlet>>(BASE, payload);
  return data.data;
}

export async function updateOutlet(id: string, payload: UpdateOutletPayload): Promise<Outlet> {
  const { data } = await apiClient.patch<ApiResponse<Outlet>>(`${BASE}/${id}`, payload);
  return data.data;
}

export async function deleteOutlet(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
