import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { outgoingDeliveriesApi, type OutgoingDeliveryQueryParams } from '@/api/outgoingDeliveries';
import type { OutgoingDeliveryFormData } from '@/types/outgoingDelivery';

export const OUTGOING_DELIVERIES_KEY = ['outgoing-deliveries'] as const;

export function useOutgoingDeliveries(params?: OutgoingDeliveryQueryParams) {
  return useQuery({
    queryKey: [...OUTGOING_DELIVERIES_KEY, params],
    queryFn: () => outgoingDeliveriesApi.getAll(params),
  });
}

export function useOutgoingDeliveryHistory(id?: number) {
  return useQuery({
    queryKey: [...OUTGOING_DELIVERIES_KEY, id, 'history'],
    queryFn: () => outgoingDeliveriesApi.getHistory(id as number),
    enabled: !!id,
  });
}

export function useCreateOutgoingDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OutgoingDeliveryFormData) => outgoingDeliveriesApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: OUTGOING_DELIVERIES_KEY });
      toast.success(`${res.number} создана (${res.items.length} позиций)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelOutgoingDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outgoingDeliveriesApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OUTGOING_DELIVERIES_KEY });
      toast.success('ИСП отменена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useShipOutgoingDelivery(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { itemId: number; factQuantity: number }[]) =>
      outgoingDeliveriesApi.ship(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OUTGOING_DELIVERIES_KEY });
      toast.success('Отгрузка зафиксирована');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateItemOperations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, operations }: { itemId: number; operations: { code: string; value?: string }[] }) =>
      outgoingDeliveriesApi.updateItemOperations(itemId, operations),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OUTGOING_DELIVERIES_KEY });
      toast.success('Операции обновлены, стоимость пересчитана');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteOutgoingDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => outgoingDeliveriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OUTGOING_DELIVERIES_KEY });
      toast.success('ИСП удалена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
