export interface IncomingDeliveryItem {
  id: number;
  deliveryId: number;
  skuId: number | null;
  article: string;
  name: string | null;
  barcode: string | null;
  quantity: number;
  factQuantity: number | null;
  weight: string | null;
  volume: string | null;
  sku: { id: number; article: string; name: string } | null;
}

export interface IncomingDelivery {
  id: number;
  number: string;
  partnerId: number;
  warehouseCode: string | null;
  isCrossDock: boolean;
  status: string;
  plannedDate: string | null;
  actualDate: string | null;
  comment: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  partner: { id: number; name: string };
  items: IncomingDeliveryItem[];
}

export interface IncomingDeliveriesResponse {
  data: IncomingDelivery[];
  total: number;
}

export interface IncomingDeliveryItemInput {
  id?: number;
  article: string;
  name?: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  volume?: number;
}

export interface IncomingDeliveryFormData {
  partnerId: number;
  warehouseCode?: string;
  isCrossDock?: boolean;
  plannedDate?: string;
  comment?: string;
  items: IncomingDeliveryItemInput[];
}

export interface StatusChangeEntry {
  id: number;
  docType: string;
  docId: number;
  status: string;
  changedBy: string;
  changedAt: string;
}

/** Создана → Процесс (первая операция в ТСД/интерфейсе) → Выполнено; Отмена — вручную. Общая схема для ВХП/ИСП/Инвентаризации. */
export const DOCUMENT_STATUSES = ['Создана', 'Процесс', 'Выполнено', 'Отмена'] as const;

export function deliveryWeight(delivery: IncomingDelivery): number {
  return delivery.items.reduce((sum, i) => sum + (i.weight != null ? Number(i.weight) : 0), 0);
}

export function deliveryVolume(delivery: IncomingDelivery): number {
  return delivery.items.reduce((sum, i) => sum + (i.volume != null ? Number(i.volume) : 0), 0);
}
