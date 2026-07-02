import * as XLSX from 'xlsx';
import type { Partner } from '@/types/partner';

export function exportPartnerToExcel(partner: Partner) {
  const rows = [
    ['Карточка партнёра', ''],
    ['', ''],
    ['Поле', 'Значение'],
    ['Название организации', partner.name],
    ['ИНН', partner.inn],
    ['№ договора', partner.contractNumber],
    ['ФИО контактного лица', partner.contactPerson],
    ['Телефон', partner.phone],
    ['Email', partner.email],
    ['Условия оплаты', partner.paymentTerms],
    ['Статус', partner.isActive ? 'Активен' : 'Деактивирован'],
    ['Дата создания', new Date(partner.createdAt).toLocaleDateString('ru-RU')],
    ['Дата обновления', new Date(partner.updatedAt).toLocaleDateString('ru-RU')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ширина колонок
  ws['!cols'] = [{ wch: 28 }, { wch: 50 }];

  // Стиль заголовка (жирный, объединённые ячейки)
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Партнёр');

  const safeName = partner.name.replace(/[\/\\?*[\]]/g, '_').slice(0, 50);
  XLSX.writeFile(wb, `Партнёр_${safeName}.xlsx`);
}
