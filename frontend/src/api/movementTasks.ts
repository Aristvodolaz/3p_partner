import type { MovementTask, MovementTasksResponse } from '@/types/storage';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export const movementTasksApi = {
  getAll: async (params?: { partnerId?: number; status?: string }): Promise<MovementTasksResponse> => {
    const { data } = await api.get('/movement-tasks', { params });
    return data;
  },

  getOne: async (id: number): Promise<MovementTask> => {
    const { data } = await api.get(`/movement-tasks/${id}`);
    return data;
  },

  cancel: async (id: number): Promise<MovementTask> => {
    const { data } = await api.post(`/movement-tasks/${id}/cancel`);
    return data;
  },
};
