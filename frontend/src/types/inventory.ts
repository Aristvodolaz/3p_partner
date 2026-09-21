export interface InventoryTaskItem {
  id: number;
  taskId: number;
  skuId: number | null;
  article: string;
  name: string | null;
  address: string | null;
  expectedQty: number;
  countedQty: number | null;
  countedBy: string | null;
  countedAt: string | null;
  sku: { id: number; article: string; name: string } | null;
}

export interface InventoryTaskExecutor {
  id: number;
  taskId: number;
  employeeId: string;
  addedAt: string;
}

export interface InventoryTask {
  id: number;
  number: string;
  partnerId: number | null;
  source: 'PARTNER' | 'INTERNAL';
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  partner: { id: number; name: string } | null;
  items: InventoryTaskItem[];
  executors: InventoryTaskExecutor[];
}

export interface InventoryTasksResponse {
  data: InventoryTask[];
  total: number;
}

export interface CreateInventoryTaskInput {
  source: 'PARTNER' | 'INTERNAL';
  partnerId?: number;
  articles?: string[];
  all?: boolean;
  executorEmployeeIds?: string[];
}

export interface StatusChangeEntry {
  id: number;
  docType: string;
  docId: number;
  status: string;
  changedBy: string;
  changedAt: string;
}
