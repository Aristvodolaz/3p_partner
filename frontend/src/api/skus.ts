import axios from 'axios';
import type {
  ImportResult,
  ImportSkusPayload,
  ImportTariffsPayload,
  ImportTariffsResult,
  Operation,
  PartnerTariff,
  PartnerTariffInput,
  Sku,
  SkuFormData,
  SkuPhoto,
  SkusResponse,
  TariffHistoryEntry,
} from '@/types/sku';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.message ?? err.message ?? 'Неизвестная ошибка';
    return Promise.reject(new Error(Array.isArray(message) ? message.join('; ') : message));
  },
);

export interface SkuQueryParams {
  partnerId?: number;
  search?: string;
}

export const skusApi = {
  getOperations: async (): Promise<Operation[]> => {
    const { data } = await api.get('/skus/operations');
    return data;
  },

  getPartnerTariffs: async (partnerId: number): Promise<PartnerTariff[]> => {
    const { data } = await api.get('/skus/tariffs', { params: { partnerId } });
    return data;
  },

  setPartnerTariffs: async (
    partnerId: number,
    tariffs: PartnerTariffInput[],
  ): Promise<PartnerTariff[]> => {
    const { data } = await api.post('/tariffs', { partnerId, tariffs });
    return data;
  },

  importTariffs: async (
    payload: ImportTariffsPayload,
  ): Promise<ImportTariffsResult> => {
    const { data } = await api.post('/tariffs/import', payload);
    return data;
  },

  deletePartnerTariffs: async (
    partnerId: number,
  ): Promise<{ deleted: number }> => {
    const { data } = await api.delete('/tariffs', { params: { partnerId } });
    return data;
  },

  getTariffHistory: async (
    partnerId: number,
  ): Promise<TariffHistoryEntry[]> => {
    const { data } = await api.get('/tariffs/history', {
      params: { partnerId },
    });
    return data;
  },

  updateOperation: async (
    id: number,
    body: { description?: string; unit?: string },
  ): Promise<Operation> => {
    const { data } = await api.patch(`/tariffs/operations/${id}`, body);
    return data;
  },

  getAll: async (params?: SkuQueryParams): Promise<SkusResponse> => {
    const { data } = await api.get('/skus', { params });
    return data;
  },

  getOne: async (id: number): Promise<Sku> => {
    const { data } = await api.get(`/skus/${id}`);
    return data;
  },

  create: async (body: SkuFormData & { partnerId: number }): Promise<Sku> => {
    const { data } = await api.post('/skus', body);
    return data;
  },

  update: async (id: number, body: Partial<SkuFormData>): Promise<Sku> => {
    const { data } = await api.patch(`/skus/${id}`, body);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/skus/${id}`);
  },

  removeAllByPartner: async (partnerId: number): Promise<{ deleted: number }> => {
    const { data } = await api.delete('/skus', { params: { partnerId } });
    return data;
  },

  import: async (payload: ImportSkusPayload): Promise<ImportResult> => {
    const { data } = await api.post('/skus/import', payload);
    return data;
  },

  addPhoto: async (id: number, file: File): Promise<SkuPhoto> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/skus/${id}/photos`, form);
    return data;
  },

  removePhoto: async (id: number, photoId: number): Promise<void> => {
    await api.delete(`/skus/${id}/photos/${photoId}`);
  },
};
