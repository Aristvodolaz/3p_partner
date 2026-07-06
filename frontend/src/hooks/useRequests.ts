import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requestsApi, type RequestQueryParams } from '@/api/requests';
import type { RequestFormData } from '@/types/request';

export const REQUESTS_KEY = ['requests'] as const;

export function useRequests(params?: RequestQueryParams) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, params],
    queryFn: () => requestsApi.getAll(params),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestFormData) => requestsApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast.success(`Заявка ${res.number} создана (${res.items.length} позиций)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRequest(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RequestFormData> & { status?: string }) =>
      requestsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast.success('Заявка обновлена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRecalculateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => requestsApi.recalculate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast.success('Стоимость пересчитана');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => requestsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast.success('Заявка удалена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
