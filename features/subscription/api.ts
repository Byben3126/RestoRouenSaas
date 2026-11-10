import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/api.generated';

export type SubscriptionData = components['schemas']['SubscriptionDto'];
type SessionUrlDto = components['schemas']['SessionUrlDto'];

export async function createCheckoutSession(plan: string): Promise<string> {
  const { data } = await apiClient.post<SessionUrlDto>('/subscription/checkout', { plan });
  return data.url;
}

export async function fetchMySubscription(): Promise<SubscriptionData | null> {
  const { data } = await apiClient.get<SubscriptionData>('/subscription');
  return data;
}

export async function createPortalSession(): Promise<string> {
  const { data } = await apiClient.post<SessionUrlDto>('/subscription/portal');
  return data.url;
}
