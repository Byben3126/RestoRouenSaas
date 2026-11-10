import { apiClient } from '@/lib/api-client';
import { reverseGeocode } from '@/lib/geocoding';
import type { components } from '@/types/api.generated';

export type Outlet = components['schemas']['OutletDto'];
export type CreateOutletPayload = components['schemas']['CreateOutletDto'];
/**
 * placeId null = établissement absent de Google : l'API efface le lien et ne le recherche plus.
 * (null est accepté par @IsOptional côté API, mais le DTO Swagger ne le déclare pas nullable.)
 */
export type UpdateOutletPayload = Omit<components['schemas']['UpdateOutletDto'], 'placeId'> & {
  placeId?: string | null;
};

const BASE = '/restaurant/me/outlets';

/** Complète formattedAddress à partir des coordonnées quand elles sont envoyées sans adresse. */
async function withFormattedAddress<T extends CreateOutletPayload | UpdateOutletPayload>(payload: T): Promise<T> {
  if (payload.formattedAddress || payload.latitude == null || payload.longitude == null) return payload;
  const formattedAddress = await reverseGeocode(payload.latitude, payload.longitude);
  return formattedAddress ? { ...payload, formattedAddress } : payload;
}

export async function fetchOutlets(): Promise<Outlet[]> {
  const { data } = await apiClient.get<Outlet[]>(BASE);
  return data;
}

export async function createOutlet(payload: CreateOutletPayload): Promise<Outlet> {
  const { data } = await apiClient.post<Outlet>(BASE, await withFormattedAddress(payload));
  return data;
}

export async function updateOutlet(id: string, payload: UpdateOutletPayload): Promise<Outlet> {
  const { data } = await apiClient.patch<Outlet>(`${BASE}/${id}`, await withFormattedAddress(payload));
  return data;
}

export async function deleteOutlet(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
