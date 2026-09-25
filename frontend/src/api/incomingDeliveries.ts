import type {
  IncomingDelivery,
  IncomingDeliveriesResponse,
  IncomingDeliveryFormData,
  StatusChangeEntry,
} from '@/types/incomingDelivery';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export interface IncomingDeliveryQueryParams {
  partnerId?: number;
  status?: string;
}

export const incomingDeliveriesApi = {
  getAll: async (params?: IncomingDeliveryQueryParams): Promise<IncomingDeliveriesResponse> => {
    const { data } = await api.get('/incoming-deliveries', { params });
    return data;
  },

  getOne: async (id: number): Promise<IncomingDelivery> => {
    const { data } = await api.get(`/incoming-deliveries/${id}`);
    return data;
  },

  getHistory: async (id: number): Promise<StatusChangeEntry[]> => {
    const { data } = await api.get(`/incoming-deliveries/${id}/history`);
    return data;
  },

  create: async (body: IncomingDeliveryFormData): Promise<IncomingDelivery> => {
    const { data } = await api.post('/incoming-deliveries', body);
    return data;
  },

  update: async (
    id: number,
    body: Partial<IncomingDeliveryFormData>,
  ): Promise<IncomingDelivery> => {
    const { data } = await api.patch(`/incoming-deliveries/${id}`, body);
    return data;
  },

  cancel: async (id: number): Promise<IncomingDelivery> => {
    const { data } = await api.post(`/incoming-deliveries/${id}/cancel`);
    return data;
  },

  receive: async (
    id: number,
    items: { itemId: number; factQuantity: number; addressCode?: string }[],
  ): Promise<IncomingDelivery> => {
    const { data } = await api.post(`/incoming-deliveries/${id}/receive`, { items });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/incoming-deliveries/${id}`);
  },
};
