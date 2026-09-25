import { useQuery } from '@tanstack/react-query';
import { storageApi } from '@/api/storage';

export const STORAGE_REPORT_KEY = ['storage-report'] as const;
export const STORAGE_HISTORY_KEY = ['storage-history'] as const;

export function useStorageReport(params?: { partnerId?: number; article?: string }) {
  return useQuery({
    queryKey: [...STORAGE_REPORT_KEY, params],
    queryFn: () => storageApi.report(params),
  });
}

export function useStorageHistory(params?: { partnerId?: number; article?: string; address?: string }) {
  return useQuery({
    queryKey: [...STORAGE_HISTORY_KEY, params],
    queryFn: () => storageApi.history(params),
  });
}
