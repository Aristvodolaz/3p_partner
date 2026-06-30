import { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  FileText,
  User,
  CreditCard,
  Pencil,
  PowerOff,
  Power,
  History,
} from 'lucide-react';
import type { Partner } from '@/types/partner';
import { formatDateShort } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { PartnerForm } from './PartnerForm';
import { PartnerHistoryDrawer } from './PartnerHistoryDrawer';
import {
  useUpdatePartner,
  useDeactivatePartner,
  useActivatePartner,
} from '@/hooks/usePartners';
import type { PartnerFormData } from '@/types/partner';

interface Props {
  partner: Partner;
}

export function PartnerCard({ partner }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const update = useUpdatePartner(partner.id);
  const deactivate = useDeactivatePartner();
  const activate = useActivatePartner();

  const handleEdit = async (data: PartnerFormData) => {
    await update.mutateAsync(data);
    setEditOpen(false);
  };

  const handleToggleActive = async () => {
    if (partner.isActive) {
      await deactivate.mutateAsync(partner.id);
    } else {
      await activate.mutateAsync(partner.id);
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <div className={`card p-5 transition-all hover:shadow-md ${!partner.isActive ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Building2 size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{partner.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Создан {formatDateShort(partner.createdAt)}</p>
            </div>
          </div>
          <span className={`flex-shrink-0 ${partner.isActive ? 'badge-green' : 'badge-red'}`}>
            {partner.isActive ? 'Активен' : 'Деактивирован'}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <InfoRow icon={<FileText size={14} />} label="ИНН" value={partner.inn} />
          <InfoRow icon={<FileText size={14} />} label="Договор" value={partner.contractNumber} />
          <InfoRow icon={<User size={14} />} label="Контакт" value={partner.contactPerson} />
          <InfoRow icon={<Phone size={14} />} label="Телефон" value={partner.phone} />
          <InfoRow icon={<Mail size={14} />} label="Email" value={partner.email} />
          <InfoRow
            icon={<CreditCard size={14} />}
            label="Оплата"
            value={partner.paymentTerms}
            clamp
          />
        </div>

        <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-gray-100">
          <button
            className="btn-ghost text-xs"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={14} />
            Редактировать
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => setHistoryOpen(true)}
          >
            <History size={14} />
            История
          </button>
          <button
            className={`btn-ghost text-xs ml-auto ${partner.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
            onClick={() => setConfirmOpen(true)}
          >
            {partner.isActive ? <PowerOff size={14} /> : <Power size={14} />}
            {partner.isActive ? 'Деактивировать' : 'Активировать'}
          </button>
        </div>
      </div>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Редактировать партнёра"
        size="lg"
      >
        <PartnerForm
          defaultValues={partner}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          isLoading={update.isPending}
          submitLabel="Сохранить изменения"
        />
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleActive}
        title={partner.isActive ? 'Деактивировать партнёра?' : 'Активировать партнёра?'}
        description={
          partner.isActive
            ? `Партнёр «${partner.name}» будет деактивирован. История операций сохранится.`
            : `Партнёр «${partner.name}» будет снова активирован.`
        }
        confirmLabel={partner.isActive ? 'Деактивировать' : 'Активировать'}
        danger={partner.isActive}
        loading={deactivate.isPending || activate.isPending}
      />

      {historyOpen && (
        <PartnerHistoryDrawer
          partnerId={partner.id}
          partnerName={partner.name}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  clamp,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  clamp?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-gray-600">
      <span className="flex-shrink-0 mt-0.5 text-gray-400">{icon}</span>
      <span className="text-gray-400 w-16 flex-shrink-0">{label}</span>
      <span className={`text-gray-700 ${clamp ? 'line-clamp-2' : ''}`}>{value}</span>
    </div>
  );
}
