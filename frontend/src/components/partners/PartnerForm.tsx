import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Partner, PartnerFormData } from '@/types/partner';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255),
  inn: z
    .string()
    .regex(/^\d{10}(\d{2})?$/, 'ИНН должен содержать 10 или 12 цифр'),
  contractNumber: z.string().min(1, 'Обязательное поле').max(100),
  contactPerson: z.string().min(1, 'Обязательное поле').max(255),
  phone: z.string().min(1, 'Обязательное поле').max(20),
  email: z.string().email('Некорректный email').max(255),
  paymentTerms: z.string().min(1, 'Обязательное поле'),
});

interface Props {
  defaultValues?: Partial<Partner>;
  onSubmit: (data: PartnerFormData) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PartnerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Сохранить',
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      inn: defaultValues?.inn ?? '',
      contractNumber: defaultValues?.contractNumber ?? '',
      contactPerson: defaultValues?.contactPerson ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      paymentTerms: defaultValues?.paymentTerms ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Название организации *</label>
          <input
            {...register('name')}
            placeholder="ООО «Ромашка»"
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="label">ИНН *</label>
          <input
            {...register('inn')}
            placeholder="7707083893"
            maxLength={12}
            className={`input ${errors.inn ? 'input-error' : ''}`}
          />
          {errors.inn && (
            <p className="mt-1 text-xs text-red-500">{errors.inn.message}</p>
          )}
        </div>

        <div>
          <label className="label">№ договора *</label>
          <input
            {...register('contractNumber')}
            placeholder="Д-2024/001"
            className={`input ${errors.contractNumber ? 'input-error' : ''}`}
          />
          {errors.contractNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.contractNumber.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label">ФИО контактного лица *</label>
          <input
            {...register('contactPerson')}
            placeholder="Иванов Иван Иванович"
            className={`input ${errors.contactPerson ? 'input-error' : ''}`}
          />
          {errors.contactPerson && (
            <p className="mt-1 text-xs text-red-500">{errors.contactPerson.message}</p>
          )}
        </div>

        <div>
          <label className="label">Телефон *</label>
          <input
            {...register('phone')}
            placeholder="+79001234567"
            type="tel"
            className={`input ${errors.phone ? 'input-error' : ''}`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            {...register('email')}
            placeholder="partner@example.com"
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Условия оплаты *</label>
          <textarea
            {...register('paymentTerms')}
            rows={3}
            placeholder="Оплата в течение 30 дней с момента выставления счёта"
            className={`input resize-none ${errors.paymentTerms ? 'input-error' : ''}`}
          />
          {errors.paymentTerms && (
            <p className="mt-1 text-xs text-red-500">{errors.paymentTerms.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          Отмена
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
