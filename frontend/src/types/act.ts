export type ActType = 'REQUEST' | 'ON_DEMAND' | 'MONTHLY';

export interface ActOperationLine {
  operationName: string;
  unit: string | null;
  tariff: number;
  qty: number;
  amount: number;
}

export interface ActBreakdownItem {
  article: string;
  name: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  operations: ActOperationLine[];
}

export interface ActBreakdownRequest {
  requestId: number;
  requestNumber: string;
  items: ActBreakdownItem[];
  requestTotal: number;
}

export interface ActBreakdown {
  partnerName: string;
  requests: ActBreakdownRequest[];
}

export interface ActRequestRef {
  requestId: number;
  requestNumber: string;
  amount: number;
}

export interface Act {
  id: number;
  partnerId: number;
  partner?: { id: number; name: string };
  type: ActType;
  periodLabel: string | null;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  requests: ActRequestRef[];
  breakdown: ActBreakdown;
}

export interface GenerateActInput {
  partnerId: number;
  type: ActType;
  requestIds?: number[];
  periodLabel?: string;
}

export const ACT_TYPE_LABELS: Record<ActType, string> = {
  REQUEST: 'По заявке',
  ON_DEMAND: 'По запросу',
  MONTHLY: 'За месяц',
};
