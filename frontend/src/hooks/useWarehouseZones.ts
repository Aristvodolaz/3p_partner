import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { warehouseZonesApi } from '@/api/warehouseZones';
import type { StorageAddressFormData, WarehouseZoneFormData } from '@/types/storage';

export const WAREHOUSE_ZONES_KEY = ['warehouse-zones'] as const;
export const STORAGE_ADDRESSES_KEY = ['storage-addresses'] as const;

export function useWarehouseZones() {
  return useQuery({ queryKey: WAREHOUSE_ZONES_KEY, queryFn: () => warehouseZonesApi.getZones() });
}

export function useCreateWarehouseZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WarehouseZoneFormData) => warehouseZonesApi.createZone(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WAREHOUSE_ZONES_KEY });
      toast.success('Зона создана');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWarehouseZone(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WarehouseZoneFormData>) => warehouseZonesApi.updateZone(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WAREHOUSE_ZONES_KEY });
      toast.success('Зона сохранена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWarehouseZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => warehouseZonesApi.removeZone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WAREHOUSE_ZONES_KEY });
      toast.success('Зона удалена');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStorageAddresses(params?: { zoneType?: string; search?: string }) {
  return useQuery({
    queryKey: [...STORAGE_ADDRESSES_KEY, params],
    queryFn: () => warehouseZonesApi.getAddresses(params),
  });
}

export function useCreateStorageAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StorageAddressFormData) => warehouseZonesApi.createAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORAGE_ADDRESSES_KEY });
      toast.success('Адрес создан');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateStorageAddress(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StorageAddressFormData>) => warehouseZonesApi.updateAddress(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORAGE_ADDRESSES_KEY });
      toast.success('Адрес сохранён');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteStorageAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => warehouseZonesApi.removeAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORAGE_ADDRESSES_KEY });
      toast.success('Адрес удалён');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
