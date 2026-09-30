import { useState } from 'react';
import { LayoutGrid, List, Plus, Users } from 'lucide-react';
import { usePartners, useCreatePartner } from '@/hooks/usePartners';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { PartnerForm } from '@/components/partners/PartnerForm';
import {
  Dialog,
  Button,
  PageHeader,
  SearchInput,
  SegmentedControl,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import type { PartnerFormData } from '@/types/partner';

export function PartnersPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data, isLoading } = usePartners({
    search: search || undefined,
    isActive: activeFilter,
  });

  const create = useCreatePartner();

  const handleCreate = async (formData: PartnerFormData) => {
    await create.mutateAsync(formData);
    setCreateOpen(false);
  };

  const partners = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Партнёры"
        subtitle={total > 0 ? pluralize(total, 'партнёр', 'партнёра', 'партнёров') : 'Нет партнёров'}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Добавить партнёра
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по названию, ИНН, контактному лицу..."
        />
        <SegmentedControl
          aria-label="Фильтр по статусу"
          value={activeFilter}
          onChange={setActiveFilter}
          segments={[
            { label: 'Все', value: undefined },
            { label: 'Активные', value: true },
            { label: 'Деактивированные', value: false },
          ]}
        />
        <SegmentedControl
          aria-label="Вид отображения"
          value={view}
          onChange={setView}
          segments={[
            { label: '', value: 'grid', icon: LayoutGrid },
            { label: '', value: 'list', icon: List },
          ]}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-3" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : partners.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Партнёры не найдены"
          description={
            search
              ? 'Попробуйте изменить параметры поиска'
              : 'Добавьте первого партнёра, чтобы начать работу'
          }
          action={
            !search && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Добавить партнёра
              </Button>
            )
          }
        />
      ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} view="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} view="list" />
            ))}
          </div>
        )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Добавить партнёра"
        size="lg"
      >
        <PartnerForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={create.isPending}
          submitLabel="Создать партнёра"
        />
      </Dialog>
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}
