import type {
  PartnerRequest,
  RequestFormData,
  RequestsResponse,
} from '@/types/request';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export interface RequestQueryParams {
  partnerId?: number;
  search?: string;
  status?: string;
}

export const requestsApi = {
  getAll: async (params?: RequestQueryParams): Promise<RequestsResponse> => {
    const { data } = await api.get('/requests', { params });
    return data;
  },

  getOne: async (id: number): Promise<PartnerRequest> => {
    const { data } = await api.get(`/requests/${id}`);
    return data;
  },

  create: async (body: RequestFormData): Promise<PartnerRequest> => {
    const { data } = await api.post('/requests', body);
    return data;
  },

  update: async (
    id: number,
    body: Partial<RequestFormData> & { status?: string },
  ): Promise<PartnerRequest> => {
    const { data } = await api.patch(`/requests/${id}`, body);
    return data;
  },

  recalculate: async (id: number): Promise<PartnerRequest> => {
    const { data } = await api.post(`/requests/${id}/recalculate`);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/requests/${id}`);
  },
};
