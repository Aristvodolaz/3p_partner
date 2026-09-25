import type { StorageMovementEntry, StorageReportRow } from '@/types/storage';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export const storageApi = {
  report: async (params?: { partnerId?: number; article?: string }): Promise<StorageReportRow[]> => {
    const { data } = await api.get('/storage/report', { params });
    return data;
  },

  history: async (params?: {
    partnerId?: number;
    article?: string;
    address?: string;
  }): Promise<StorageMovementEntry[]> => {
    const { data } = await api.get('/storage/history', { params });
    return data;
  },
};
