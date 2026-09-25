import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { movementTasksApi } from '@/api/movementTasks';

export const MOVEMENT_TASKS_KEY = ['movement-tasks'] as const;

export function useMovementTasks(params?: { partnerId?: number; status?: string }) {
  return useQuery({
    queryKey: [...MOVEMENT_TASKS_KEY, params],
    queryFn: () => movementTasksApi.getAll(params),
  });
}

export function useMovementTask(id?: number) {
  return useQuery({
    queryKey: [...MOVEMENT_TASKS_KEY, id],
    queryFn: () => movementTasksApi.getOne(id as number),
    enabled: !!id,
  });
}

export function useCancelMovementTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => movementTasksApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MOVEMENT_TASKS_KEY });
      toast.success('Задание отменено');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
