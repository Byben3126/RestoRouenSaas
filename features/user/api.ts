import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/api.generated';

type UserDto = components['schemas']['UserDto'];

export async function fetchMe(): Promise<UserDto> {
  const { data } = await apiClient.get<UserDto>('/users/me');
  return data;
}
