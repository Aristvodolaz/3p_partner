import type {
  CreateInventoryTaskInput,
  InventoryTask,
  InventoryTasksResponse,
  StatusChangeEntry,
} from '@/types/inventory';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export interface InventoryQueryParams {
  partnerId?: number;
  status?: string;
}

export const inventoryApi = {
  getAll: async (params?: InventoryQueryParams): Promise<InventoryTasksResponse> => {
    const { data } = await api.get('/inventory', { params });
    return data;
  },

  getOne: async (id: number): Promise<InventoryTask> => {
    const { data } = await api.get(`/inventory/${id}`);
    return data;
  },

  getHistory: async (id: number): Promise<StatusChangeEntry[]> => {
    const { data } = await api.get(`/inventory/${id}/history`);
    return data;
  },

  create: async (body: CreateInventoryTaskInput): Promise<InventoryTask> => {
    const { data } = await api.post('/inventory', body);
    return data;
  },

  addExecutor: async (id: number, employeeId: string): Promise<InventoryTask> => {
    const { data } = await api.post(`/inventory/${id}/executors`, { employeeId });
    return data;
  },

  removeExecutor: async (id: number, employeeId: string): Promise<InventoryTask> => {
    const { data } = await api.delete(`/inventory/${id}/executors/${employeeId}`);
    return data;
  },

  cancel: async (id: number): Promise<InventoryTask> => {
    const { data } = await api.post(`/inventory/${id}/cancel`);
    return data;
  },

  count: async (
    id: number,
    items: { itemId: number; countedQty: number }[],
  ): Promise<InventoryTask> => {
    const { data } = await api.post(`/inventory/${id}/count`, { items });
    return data;
  },
};
