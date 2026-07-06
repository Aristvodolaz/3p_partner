export interface Operation {
  id: number;
  code: string;
  name: string;
  description: string | null;
  unit: string | null;
  tariff: string | null;
  sortOrder: number;
}

export interface SkuOperation {
  id: number;
  skuId: number;
  operationId: number;
  value: string | null;
  operation: Operation;
}

export interface SkuPhoto {
  id: number;
  skuId: number;
  filename: string;
}

export interface Sku {
  id: number;
  partnerId: number;
  article: string;
  barcode: string | null;
  name: string;
  color: string | null;
  shelfLife: string | null;
  sumOfSides: string | null;
  weight: string | null;
  clientRequirements: string | null;
  specialMarks: string | null;
  boxQuant: number | null;
  palletQuant: number | null;
  packCostUnit: string | null;
  packCostBox: string | null;
  createdAt: string;
  updatedAt: string;
  operations: SkuOperation[];
  photos: SkuPhoto[];
}

export interface SkusResponse {
  data: Sku[];
  total: number;
}

export interface SkuOperationInput {
  code: string;
  value?: string;
}

export interface PartnerTariff {
  id: number;
  partnerId: number;
  operationId: number;
  tariff: string;
  operation: Operation;
}

export interface PartnerTariffInput {
  code: string;
  tariff: number;
}

export interface TariffHistoryEntry {
  id: number;
  partnerId: number;
  operationId: number;
  changedBy: string;
  oldTariff: string | null;
  newTariff: string | null;
  changedAt: string;
  operation: Operation;
}

export interface ImportTariffItem {
  name: string;
  unit?: string;
  tariff: number;
  description?: string;
}

export interface ImportTariffsPayload {
  partnerId: number;
  replace: boolean;
  items: ImportTariffItem[];
}

export interface ImportTariffsResult {
  createdOperations: number;
  updatedOperations: number;
  total: number;
}

export interface SkuFormData {
  article: string;
  barcode?: string;
  name: string;
  color?: string;
  shelfLife?: string;
  sumOfSides?: number;
  weight?: number;
  clientRequirements?: string;
  specialMarks?: string;
  boxQuant?: number;
  palletQuant?: number;
  packCostUnit?: number;
  packCostBox?: number;
  operations?: SkuOperationInput[];
}

export interface ImportSkusPayload {
  partnerId: number;
  replace: boolean;
  rows: SkuFormData[];
  tariffs?: PartnerTariffInput[];
}

export interface ImportResult {
  created: number;
  updated: number;
  total: number;
}

export const SPECIAL_MARKS_PRESETS = [
  'Хрупкий',
  'Острый',
  'Жидкость',
  'Легковоспламеняющийся',
  'Легко повреждаемая поверхность',
  'ЧЗ',
  '18+',
] as const;

export function photoUrl(photo: SkuPhoto): string {
  return `/uploads/skus/${photo.filename}`;
}
