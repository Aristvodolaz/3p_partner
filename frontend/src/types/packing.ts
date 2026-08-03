export interface PackingUnitItem {
  id: number;
  packingUnitId: number;
  requestItemId: number;
  article: string;
  quantity: number;
  isDefect: boolean;
  comment: string | null;
}

export interface PackingUnit {
  id: number;
  requestItemId: number;
  type: 'BOX' | 'PALLET';
  code: string;
  parentPalletId: number | null;
  expiryDate: string | null;
  nestingQty: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  items: PackingUnitItem[];
}
