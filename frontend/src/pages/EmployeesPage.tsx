import { useState } from 'react';
import { Search, UserCog } from 'lucide-react';
import { useEmployees, useUpdateEmployee } from '@/hooks/useEmployees';
import type { Employee, EmployeeRole } from '@/types/employee';

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useEmployees({ search: search || undefined });

  const employees = data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">Сотрудники</h1>
          <p className="text-sm text-gray-500 mt-1">
            Появляются автоматически после первого входа в приложение —
            назначьте роль, чтобы открыть доступ к нужным разделам
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Поиск по табельному номеру, ФИО..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-5 animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <UserCog size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Сотрудников нет</h3>
          <p className="text-sm text-gray-400 mt-1">
            Список заполнится, как только кто-то войдёт в мобильное приложение или на сайт
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Табельный номер</th>
                  <th className="px-4 py-3 font-medium">ФИО</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Последний вход</th>
                  <th className="px-4 py-3 font-medium text-right">Активен</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <EmployeeRow key={emp.id} employee={emp} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeRow({ employee }: { employee: Employee }) {
  const update = useUpdateEmployee(employee.id);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
        {employee.employeeId}
      </td>
      <td className="px-4 py-3 text-gray-600">{employee.fullName}</td>
      <td className="px-4 py-3">
        <select
          value={employee.role ?? ''}
          onChange={(e) =>
            update.mutate({ role: (e.target.value || null) as EmployeeRole | null })
          }
          disabled={update.isPending}
          className="input py-1.5 text-xs max-w-[140px]"
        >
          <option value="">— не назначена —</option>
          <option value="НПП">НПП</option>
          <option value="НРП">НРП</option>
        </select>
      </td>
      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
        {employee.lastLogin ? new Date(employee.lastLogin).toLocaleString('ru-RU') : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => update.mutate({ isActive: !employee.isActive })}
          disabled={update.isPending}
          className={`badge ${employee.isActive ? 'badge-green' : 'badge-red'} cursor-pointer`}
        >
          {employee.isActive ? 'Активен' : 'Деактивирован'}
        </button>
      </td>
    </tr>
  );
}
