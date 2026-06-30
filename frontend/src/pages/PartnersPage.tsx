import { useState } from 'react';
import { Plus, Search, Users, Building2 } from 'lucide-react';
import { usePartners, useCreatePartner } from '@/hooks/usePartners';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { PartnerForm } from '@/components/partners/PartnerForm';
import { Dialog } from '@/components/ui/Dialog';
import type { PartnerFormData } from '@/types/partner';

export function PartnersPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">3P Partner</span>
                <span className="text-gray-400 text-sm ml-2">НПП</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Партнёры</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total > 0 ? pluralize(total, 'партнёр', 'партнёра', 'партнёров') : 'Нет партнёров'}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Добавить партнёра
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Поиск по названию, ИНН, контактному лицу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(
              [
                { label: 'Все', value: undefined },
                { label: 'Активные', value: true },
                { label: 'Деактивированные', value: false },
              ] as const
            ).map((f) => (
              <button
                key={String(f.value)}
                onClick={() => setActiveFilter(f.value)}
                className={`btn text-sm px-4 py-2 ${
                  activeFilter === f.value
                    ? 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-500'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Партнёры не найдены</h3>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              {search
                ? 'Попробуйте изменить параметры поиска'
                : 'Добавьте первого партнёра, чтобы начать работу'}
            </p>
            {!search && (
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Добавить партнёра
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        )}
      </main>

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
