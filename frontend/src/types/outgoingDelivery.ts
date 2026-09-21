export interface OutgoingItemOperation {
  id: number;
  itemId: number;
  operationId: number;
  value: string | null;
  done: boolean;
  factQty: number | null;
  executedBy: string | null;
  executedAt: string | null;
  operation: { id: number; code: string; name: string; unit: string | null; phase: string };
}

export interface OutgoingDeliveryItem {
  id: number;
  deliveryId: number;
  skuId: number | null;
  article: string;
  name: string | null;
  quantity: number;
  factQuantity: number | null;
  weight: string | null;
  volume: string | null;
  unitCost: string | null;
  totalCost: string | null;
  sku: { id: number; article: string; name: string } | null;
  operations: OutgoingItemOperation[];
}

export interface OutgoingDelivery {
  id: number;
  number: string;
  partnerId: number;
  warehouseCode: string | null;
  isCrossDock: boolean;
  sourceIncomingDeliveryId: number | null;
  status: string;
  shipDate: string | null;
  actualDate: string | null;
  comment: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  partner: { id: number; name: string };
  items: OutgoingDeliveryItem[];
}

export interface OutgoingDeliveriesResponse {
  data: OutgoingDelivery[];
  total: number;
}

export interface OutgoingDeliveryItemInput {
  id?: number;
  article: string;
  name?: string;
  quantity: number;
  weight?: number;
  volume?: number;
}

export interface OutgoingDeliveryFormData {
  partnerId: number;
  warehouseCode?: string;
  isCrossDock?: boolean;
  shipDate?: string;
  comment?: string;
  items: OutgoingDeliveryItemInput[];
}

export function outgoingTotal(delivery: OutgoingDelivery): number {
  return delivery.items.reduce((sum, i) => sum + (i.totalCost != null ? Number(i.totalCost) : 0), 0);
}
