import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { actsApi } from '@/api/acts';
import type { GenerateActInput } from '@/types/act';

export const ACTS_KEY = ['acts'] as const;

export function useActs(partnerId?: number) {
  return useQuery({
    queryKey: [...ACTS_KEY, partnerId],
    queryFn: () => actsApi.getAll(partnerId),
  });
}

export function useGenerateAct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateActInput) => actsApi.generate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACTS_KEY });
      toast.success('Акт сформирован');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
