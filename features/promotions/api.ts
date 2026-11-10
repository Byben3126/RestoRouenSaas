import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/api.generated';

export type PromotionDto = components['schemas']['PromotionDto'];
export type PromotionTargetedCustomer = components['schemas']['CustomerDto'];
export type CreatePromotionDto = components['schemas']['CreatePromotionDto'];
export type UpdatePromotionDto = components['schemas']['UpdatePromotionDto'];
export type PromotionDisplayStatus = PromotionDto['status'];

export async function fetchPromotions(): Promise<PromotionDto[]> {
  const { data } = await apiClient.get<PromotionDto[]>('/promotions');
  return data;
}

export async function createPromotion(payload: CreatePromotionDto): Promise<PromotionDto> {
  const { data } = await apiClient.post<PromotionDto>('/promotions', payload);
  return data;
}

export async function updatePromotion(id: string, payload: UpdatePromotionDto): Promise<PromotionDto> {
  const { data } = await apiClient.patch<PromotionDto>(`/promotions/${id}`, payload);
  return data;
}

export async function archivePromotion(id: string): Promise<PromotionDto> {
  const { data } = await apiClient.patch<PromotionDto>(`/promotions/${id}/archive`);
  return data;
}

export async function draftPromotion(id: string): Promise<PromotionDto> {
  const { data } = await apiClient.patch<PromotionDto>(`/promotions/${id}/draft`);
  return data;
}

export async function publishPromotion(id: string): Promise<PromotionDto> {
  const { data } = await apiClient.patch<PromotionDto>(`/promotions/${id}/publish`);
  return data;
}
