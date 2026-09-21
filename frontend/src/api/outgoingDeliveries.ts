import type {
  OutgoingDelivery,
  OutgoingDeliveriesResponse,
  OutgoingDeliveryFormData,
} from '@/types/outgoingDelivery';
import type { StatusChangeEntry } from '@/types/incomingDelivery';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export interface OutgoingDeliveryQueryParams {
  partnerId?: number;
  status?: string;
}

export const outgoingDeliveriesApi = {
  getAll: async (params?: OutgoingDeliveryQueryParams): Promise<OutgoingDeliveriesResponse> => {
    const { data } = await api.get('/outgoing-deliveries', { params });
    return data;
  },

  getOne: async (id: number): Promise<OutgoingDelivery> => {
    const { data } = await api.get(`/outgoing-deliveries/${id}`);
    return data;
  },

  getHistory: async (id: number): Promise<StatusChangeEntry[]> => {
    const { data } = await api.get(`/outgoing-deliveries/${id}/history`);
    return data;
  },

  create: async (body: OutgoingDeliveryFormData): Promise<OutgoingDelivery> => {
    const { data } = await api.post('/outgoing-deliveries', body);
    return data;
  },

  update: async (
    id: number,
    body: Partial<OutgoingDeliveryFormData>,
  ): Promise<OutgoingDelivery> => {
    const { data } = await api.patch(`/outgoing-deliveries/${id}`, body);
    return data;
  },

  cancel: async (id: number): Promise<OutgoingDelivery> => {
    const { data } = await api.post(`/outgoing-deliveries/${id}/cancel`);
    return data;
  },

  ship: async (
    id: number,
    items: { itemId: number; factQuantity: number }[],
  ): Promise<OutgoingDelivery> => {
    const { data } = await api.post(`/outgoing-deliveries/${id}/ship`, { items });
    return data;
  },

  updateItemOperations: async (
    itemId: number,
    operations: { code: string; value?: string }[],
  ): Promise<OutgoingDelivery> => {
    const { data } = await api.patch(`/outgoing-deliveries/items/${itemId}/operations`, { operations });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/outgoing-deliveries/${id}`);
  },
};
