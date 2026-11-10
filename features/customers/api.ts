import { apiClient } from '@/lib/api-client';
import type { components, operations } from '@/types/api.generated';

type PaginatedCustomersDto = components['schemas']['PaginatedCustomersDto'];
type CustomerDto = components['schemas']['CustomerDto'];
export type CustomersParams = operations['CustomerController_getRestaurantCustomers']['parameters']['query'];
export type AddCustomerPointsDto = components['schemas']['AddCustomerPointsDto'];
export type PointsTransactionDto = components['schemas']['PointsTransactionDto'];

export async function fetchCustomers(params: CustomersParams = {}): Promise<PaginatedCustomersDto> {
  const { data } = await apiClient.get<PaginatedCustomersDto>('/customers', { params });
  return data;
}

export async function addCustomerPoints(id: string, payload: AddCustomerPointsDto): Promise<CustomerDto> {
  const { data } = await apiClient.post<CustomerDto>(`/customers/${id}/points`, payload);
  return data;
}

export async function fetchCustomerPointsTransactions(id: string): Promise<PointsTransactionDto[]> {
  const { data } = await apiClient.get<PointsTransactionDto[]>(`/customers/${id}/points-transactions`);
  return data;
}
