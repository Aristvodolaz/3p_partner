import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { partnersApi, type QueryParams } from '@/api/partners';
import type { PartnerFormData } from '@/types/partner';

export const PARTNERS_KEY = ['partners'] as const;

export function usePartners(params?: QueryParams) {
  return useQuery({
    queryKey: [...PARTNERS_KEY, params],
    queryFn: () => partnersApi.getAll(params),
  });
}

export function usePartner(id: number) {
  return useQuery({
    queryKey: [...PARTNERS_KEY, id],
    queryFn: () => partnersApi.getOne(id),
    enabled: !!id,
  });
}

export function usePartnerHistory(id: number) {
  return useQuery({
    queryKey: [...PARTNERS_KEY, id, 'history'],
    queryFn: () => partnersApi.getHistory(id),
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PartnerFormData) => partnersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTNERS_KEY });
      toast.success('Партнёр успешно создан');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePartner(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PartnerFormData>) => partnersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTNERS_KEY });
      toast.success('Данные партнёра обновлены');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeactivatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => partnersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTNERS_KEY });
      toast.success('Партнёр деактивирован');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useActivatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => partnersApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTNERS_KEY });
      toast.success('Партнёр активирован');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
