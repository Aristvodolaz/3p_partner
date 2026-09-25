import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { incomingDeliveriesApi, type IncomingDeliveryQueryParams } from '@/api/incomingDeliveries';
import type { IncomingDeliveryFormData } from '@/types/incomingDelivery';

export const INCOMING_DELIVERIES_KEY = ['incoming-deliveries'] as const;

export function useIncomingDeliveries(params?: IncomingDeliveryQueryParams) {
  return useQuery({
    queryKey: [...INCOMING_DELIVERIES_KEY, params],
    queryFn: () => incomingDeliveriesApi.getAll(params),
  });
}

export function useIncomingDeliveryHistory(id?: number) {
  return useQuery({
    queryKey: [...INCOMING_DELIVERIES_KEY, id, 'history'],
    queryFn: () => incomingDeliveriesApi.getHistory(id as number),
    enabled: !!id,
  });
}

export function useCreateIncomingDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IncomingDeliveryFormData) => incomingDeliveriesApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: INCOMING_DELIVERIES_KEY });
      toast.success(`${res.number} создана (${res.items.length} позиций)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateIncomingDelivery(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IncomingDeliveryFormData>) => incomingDeliveriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INCOMING_DELIVERIES_KEY });
      toast.success('ВХП обновлена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelIncomingDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => incomingDeliveriesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INCOMING_DELIVERIES_KEY });
      toast.success('ВХП отменена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReceiveIncomingDelivery(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { itemId: number; factQuantity: number; addressCode?: string }[]) =>
      incomingDeliveriesApi.receive(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INCOMING_DELIVERIES_KEY });
      toast.success('Приёмка зафиксирована');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteIncomingDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => incomingDeliveriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INCOMING_DELIVERIES_KEY });
      toast.success('ВХП удалена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
