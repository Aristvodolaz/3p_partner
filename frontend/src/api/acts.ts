import type { Act, GenerateActInput } from '@/types/act';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export const actsApi = {
  getAll: async (partnerId?: number): Promise<Act[]> => {
    const { data } = await api.get('/acts', { params: partnerId ? { partnerId } : undefined });
    return data;
  },

  getOne: async (id: number): Promise<Act> => {
    const { data } = await api.get(`/acts/${id}`);
    return data;
  },

  generate: async (input: GenerateActInput): Promise<Act> => {
    const { data } = await api.post('/acts/generate', input);
    return data;
  },
};
