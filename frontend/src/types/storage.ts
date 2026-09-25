export const ZONE_TYPES = ['I', 'S', 'W', 'O'] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  I: 'Приёмка',
  S: 'Хранение',
  W: 'Обработка',
  O: 'Отгрузка',
};

export interface WarehouseZone {
  id: number;
  code: string;
  name: string;
  type: ZoneType;
  warehouseCode: string | null;
  createdAt: string;
}

export interface WarehouseZoneFormData {
  code: string;
  name: string;
  type: ZoneType;
  warehouseCode?: string;
}

export interface StorageAddress {
  id: number;
  code: string;
  zoneId: number;
  warehouseCode: string | null;
  isActive: boolean;
  createdAt: string;
  zone: WarehouseZone;
}

export interface StorageAddressFormData {
  code: string;
  zoneId: number;
  warehouseCode?: string;
  isActive?: boolean;
}

export interface StorageReportRow {
  partnerId: number;
  partnerName: string;
  article: string;
  batchNumber: string | null;
  address: string;
  zoneType: ZoneType | null;
  quantity: number;
}

export interface StorageMovementEntry {
  id: number;
  partnerId: number;
  article: string;
  address: string;
  zoneType: ZoneType | null;
  quantity: number;
  type: string;
  docType: string | null;
  docId: number | null;
  comment: string | null;
  createdBy: string;
  createdAt: string;
}

export interface MovementTaskItem {
  id: number;
  taskId: number;
  article: string;
  name: string | null;
  skuId: number | null;
  outgoingDeliveryItemId: number | null;
  sourceAddressId: number | null;
  incomingDeliveryItemId: number | null;
  targetAddressId: number | null;
  quantity: number;
  status: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface MovementTask {
  id: number;
  number: string;
  outgoingDeliveryId: number | null;
  partnerId: number;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: MovementTaskItem[];
}

export interface MovementTasksResponse {
  data: MovementTask[];
  total: number;
}
