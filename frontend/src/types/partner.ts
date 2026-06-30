export interface Partner {
  id: number;
  name: string;
  inn: string;
  contractNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerHistory {
  id: number;
  partnerId: number;
  changedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

export interface PartnersResponse {
  data: Partner[];
  total: number;
}

export interface PartnerFormData {
  name: string;
  inn: string;
  contractNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: string;
}

export const FIELD_LABELS: Record<string, string> = {
  name: 'Название организации',
  inn: 'ИНН',
  contractNumber: '№ договора',
  contactPerson: 'ФИО контактного лица',
  phone: 'Телефон',
  email: 'Email',
  paymentTerms: 'Условия оплаты',
  isActive: 'Статус',
  CREATE: 'Создание записи',
};
