import type { StorageAddress, StorageAddressFormData, WarehouseZone, WarehouseZoneFormData } from '@/types/storage';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export const warehouseZonesApi = {
  getZones: async (): Promise<WarehouseZone[]> => {
    const { data } = await api.get('/warehouse-zones');
    return data;
  },

  createZone: async (body: WarehouseZoneFormData): Promise<WarehouseZone> => {
    const { data } = await api.post('/warehouse-zones', body);
    return data;
  },

  updateZone: async (id: number, body: Partial<WarehouseZoneFormData>): Promise<WarehouseZone> => {
    const { data } = await api.patch(`/warehouse-zones/${id}`, body);
    return data;
  },

  removeZone: async (id: number): Promise<void> => {
    await api.delete(`/warehouse-zones/${id}`);
  },

  getAddresses: async (params?: { zoneType?: string; search?: string }): Promise<StorageAddress[]> => {
    const { data } = await api.get('/warehouse-zones/addresses', { params });
    return data;
  },

  createAddress: async (body: StorageAddressFormData): Promise<StorageAddress> => {
    const { data } = await api.post('/warehouse-zones/addresses', body);
    return data;
  },

  updateAddress: async (id: number, body: Partial<StorageAddressFormData>): Promise<StorageAddress> => {
    const { data } = await api.patch(`/warehouse-zones/addresses/${id}`, body);
    return data;
  },

  removeAddress: async (id: number): Promise<void> => {
    await api.delete(`/warehouse-zones/addresses/${id}`);
  },
};
