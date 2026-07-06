import axios from 'axios';
import type {
  PartnerRequest,
  RequestFormData,
  RequestsResponse,
} from '@/types/request';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.message ?? err.message ?? 'Неизвестная ошибка';
    return Promise.reject(new Error(Array.isArray(message) ? message.join('; ') : message));
  },
);

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
