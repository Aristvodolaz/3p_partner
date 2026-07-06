import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { skusApi, type SkuQueryParams } from '@/api/skus';
import type {
  ImportSkusPayload,
  PartnerTariffInput,
  SkuFormData,
} from '@/types/sku';

export const SKUS_KEY = ['skus'] as const;
export const OPERATIONS_KEY = ['operations'] as const;
export const TARIFFS_KEY = ['partner-tariffs'] as const;

export function useOperations() {
  return useQuery({
    queryKey: OPERATIONS_KEY,
    queryFn: () => skusApi.getOperations(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePartnerTariffs(partnerId?: number) {
  return useQuery({
    queryKey: [...TARIFFS_KEY, partnerId],
    queryFn: () => skusApi.getPartnerTariffs(partnerId!),
    enabled: !!partnerId,
  });
}

export function useSetPartnerTariffs(partnerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tariffs: PartnerTariffInput[]) =>
      skusApi.setPartnerTariffs(partnerId, tariffs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      toast.success('Тарифы партнёра сохранены');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSkus(params?: SkuQueryParams) {
  return useQuery({
    queryKey: [...SKUS_KEY, params],
    queryFn: () => skusApi.getAll(params),
  });
}

export function useCreateSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SkuFormData & { partnerId: number }) => skusApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      toast.success('SKU создан');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSku(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SkuFormData>) => skusApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      toast.success('SKU обновлён');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => skusApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      toast.success('SKU удалён');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePartnerSkus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partnerId: number) => skusApi.removeAllByPartner(partnerId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      toast.success(`Справочник удалён (${res.deleted} SKU)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useImportSkus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ImportSkusPayload) => skusApi.import(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      qc.invalidateQueries({ queryKey: TARIFFS_KEY });
      toast.success(`Импорт завершён: создано ${res.created}, обновлено ${res.updated}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAddSkuPhoto(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => skusApi.addPhoto(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      toast.success('Фото загружено');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveSkuPhoto(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) => skusApi.removePhoto(id, photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SKUS_KEY });
      toast.success('Фото удалено');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
