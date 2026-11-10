import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/api.generated';

type RestaurantDto = components['schemas']['RestaurantDto'];
type UpdateRestaurantDto = components['schemas']['UpdateRestaurantDto'];

export type CreateRestaurantPayload = {
  name: string;
  latitude: number;
  longitude: number;
};

export async function createMyRestaurant(payload: CreateRestaurantPayload): Promise<RestaurantDto> {
  const { data } = await apiClient.post<RestaurantDto>('/restaurant', payload);
  return data;
}

export async function fetchMyRestaurant(): Promise<RestaurantDto> {
  const { data } = await apiClient.get<RestaurantDto>('/restaurant/me');
  return data;
}

export async function updateMyRestaurant(payload: UpdateRestaurantDto): Promise<RestaurantDto> {
  const { data } = await apiClient.patch<RestaurantDto>('/restaurant/me', payload);
  return data;
}
