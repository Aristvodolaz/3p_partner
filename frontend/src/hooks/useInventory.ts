import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inventoryApi, type InventoryQueryParams } from '@/api/inventory';
import type { CreateInventoryTaskInput } from '@/types/inventory';

export const INVENTORY_KEY = ['inventory'] as const;

export function useInventoryTasks(params?: InventoryQueryParams) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, params],
    queryFn: () => inventoryApi.getAll(params),
  });
}

export function useInventoryHistory(id?: number) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, id, 'history'],
    queryFn: () => inventoryApi.getHistory(id as number),
    enabled: !!id,
  });
}

export function useCreateInventoryTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryTaskInput) => inventoryApi.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
      toast.success(`${res.number} создана (${res.items.length} позиций)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAddExecutor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => inventoryApi.addExecutor(id, employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
      toast.success('Исполнитель назначен');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveExecutor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => inventoryApi.removeExecutor(id, employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelInventoryTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventoryApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
      toast.success('Задание отменено');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCountInventoryTask(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { itemId: number; countedQty: number }[]) => inventoryApi.count(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
      toast.success('Пересчёт зафиксирован');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
