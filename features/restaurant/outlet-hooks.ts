import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
  type CreateOutletPayload,
  type UpdateOutletPayload,
} from './outlet-api';

const KEY = ['restaurant', 'me', 'outlets'];

export function useOutlets() {
  return useQuery({ queryKey: KEY, queryFn: fetchOutlets });
}

export function useCreateOutlet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOutletPayload) => createOutlet(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateOutlet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateOutletPayload) =>
      updateOutlet(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteOutlet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOutlet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
