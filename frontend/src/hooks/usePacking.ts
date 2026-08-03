import { useQuery } from '@tanstack/react-query';
import { packingApi } from '@/api/packing';

export const PACKING_KEY = ['packing'] as const;

export function usePackingUnits(requestId: number, enabled = true) {
  return useQuery({
    queryKey: [...PACKING_KEY, requestId],
    queryFn: () => packingApi.getByRequest(requestId),
    enabled: enabled && !!requestId,
  });
}
