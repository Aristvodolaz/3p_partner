export interface RequestItem {
  id: number;
  requestId: number;
  skuId: number | null;
  article: string;
  name: string | null;
  quantity: number;
  arrivalDate: string | null;
  shipmentDate: string | null;
  unitCost: string | null;
  totalCost: string | null;
  sku: { id: number; article: string; name: string } | null;
}

export interface PartnerRequest {
  id: number;
  partnerId: number;
  number: string;
  status: string;
  requestDate: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  partner: { id: number; name: string };
  items: RequestItem[];
}

export interface RequestsResponse {
  data: PartnerRequest[];
  total: number;
}

export interface RequestItemInput {
  id?: number;
  article: string;
  name?: string;
  quantity: number;
  arrivalDate?: string;
  shipmentDate?: string;
}

export interface RequestFormData {
  partnerId: number;
  number: string;
  requestDate?: string;
  comment?: string;
  items: RequestItemInput[];
}

/**
 * Жизненный цикл заявки: Запланировано → Приёмка → Хранение → В работе →
 * Готово → Отгружено → Закрыто. «Дефект» — отдельный статус для претензии/
 * брака вне основной линейки. Должен совпадать с backend/src/common/
 * request-status.ts и mobil RequestStatus (core:model/Models.kt) —
 * это общая модель для веба, бэкенда и мобильного приложения.
 */
export const REQUEST_STATUSES = [
  'Запланировано',
  'Приёмка',
  'Хранение',
  'В работе',
  'Готово',
  'Отгружено',
  'Закрыто',
  'Дефект',
] as const;

export function requestTotal(request: PartnerRequest): number {
  return request.items.reduce(
    (sum, item) => sum + (item.totalCost != null ? Number(item.totalCost) : 0),
    0,
  );
}

export function hasUnknownArticles(request: PartnerRequest): boolean {
  return request.items.some((item) => item.skuId === null);
}
