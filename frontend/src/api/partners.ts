import axios from 'axios';
import type {
  Partner,
  PartnerFormData,
  PartnerHistory,
  PartnersResponse,
} from '@/types/partner';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.message ?? err.message ?? 'Неизвестная ошибка';
    return Promise.reject(new Error(Array.isArray(message) ? message.join('; ') : message));
  },
);

export interface QueryParams {
  search?: string;
  isActive?: boolean;
}

export const partnersApi = {
  getAll: async (params?: QueryParams): Promise<PartnersResponse> => {
    const { data } = await api.get('/partners', { params });
    return data;
  },

  getOne: async (id: number): Promise<Partner> => {
    const { data } = await api.get(`/partners/${id}`);
    return data;
  },

  create: async (body: PartnerFormData): Promise<Partner> => {
    const { data } = await api.post('/partners', body);
    return data;
  },

  update: async (id: number, body: Partial<PartnerFormData>): Promise<Partner> => {
    const { data } = await api.patch(`/partners/${id}`, body);
    return data;
  },

  deactivate: async (id: number): Promise<Partner> => {
    const { data } = await api.patch(`/partners/${id}/deactivate`);
    return data;
  },

  activate: async (id: number): Promise<Partner> => {
    const { data } = await api.patch(`/partners/${id}/activate`);
    return data;
  },

  getHistory: async (id: number): Promise<PartnerHistory[]> => {
    const { data } = await api.get(`/partners/${id}/history`);
    return data;
  },
};
