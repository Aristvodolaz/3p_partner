import type { PackingUnit } from '@/types/packing';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export const packingApi = {
  getByRequest: async (requestId: number): Promise<PackingUnit[]> => {
    const { data } = await api.get('/packing/units', { params: { requestId } });
    return data;
  },
};
