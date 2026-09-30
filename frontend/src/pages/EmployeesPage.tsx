import { useState, type FormEvent } from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { useEmployees, useGrantRole, useUpdateEmployee } from '@/hooks/useEmployees';
import {
  PageHeader,
  SearchInput,
  Button,
  Input,
  Select,
  Field,
  Badge,
  EmptyState,
  Skeleton,
  TableContainer,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from '@/components/ui';
import type { Employee, EmployeeRole } from '@/types/employee';

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useEmployees({ search: search || undefined });

  const employees = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        subtitle="Появляются автоматически после первого входа в приложение — назначьте роль, чтобы открыть доступ к нужным разделам"
      />

      <GrantRoleForm />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по табельному номеру, ФИО..."
        />
      </div>

      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Сотрудников нет"
          description="Список заполнится, как только кто-то войдёт в мобильное приложение или на сайт"
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>Табельный номер</TH>
              <TH>ФИО</TH>
              <TH>Роль</TH>
              <TH>Последний вход</TH>
              <TH align="right">Активен</TH>
            </THead>
            <TBody>
              {employees.map((emp) => (
                <EmployeeRow key={emp.id} employee={emp} />
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

function GrantRoleForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<EmployeeRole>('НПП');
  const grant = useGrantRole();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = employeeId.trim();
    if (!trimmed) return;
    grant.mutate(
      { employeeId: trimmed, role },
      { onSuccess: () => setEmployeeId('') },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 mb-6 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Field label="Выдать роль по ШК" htmlFor="grant-employee-id">
          <Input
            id="grant-employee-id"
            placeholder="Табельный номер / ШК"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </Field>
      </div>
      <div>
        <Field label="Роль" htmlFor="grant-role">
          <Select
            id="grant-role"
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
          >
            <option value="НПП">НПП</option>
            <option value="НРП">НРП</option>
          </Select>
        </Field>
      </div>
      <Button type="submit" loading={grant.isPending} disabled={!employeeId.trim()}>
        <UserPlus size={16} />
        Выдать
      </Button>
      <p className="w-full text-xs text-gray-400">
        Можно указать ШК сотрудника, который ещё ни разу не входил в систему — роль закрепится
        за ним заранее, а ФИО подтянется при первом входе
      </p>
    </form>
  );
}

function EmployeeRow({ employee }: { employee: Employee }) {
  const update = useUpdateEmployee(employee.id);

  return (
    <TR>
      <TD className="font-medium text-gray-900 whitespace-nowrap">{employee.employeeId}</TD>
      <TD>{employee.fullName}</TD>
      <TD>
        <Select
          aria-label="Роль сотрудника"
          value={employee.role ?? ''}
          onChange={(e) =>
            update.mutate({ role: (e.target.value || null) as EmployeeRole | null })
          }
          disabled={update.isPending}
          className="py-1.5 text-xs max-w-[140px]"
        >
          <option value="">— не назначена —</option>
          <option value="НПП">НПП</option>
          <option value="НРП">НРП</option>
        </Select>
      </TD>
      <TD className="text-gray-500 whitespace-nowrap">
        {employee.lastLogin ? new Date(employee.lastLogin).toLocaleString('ru-RU') : '—'}
      </TD>
      <TD align="right">
        <button
          onClick={() => update.mutate({ isActive: !employee.isActive })}
          disabled={update.isPending}
          title={employee.isActive ? 'Нажмите, чтобы деактивировать' : 'Нажмите, чтобы активировать'}
          className="cursor-pointer disabled:opacity-50"
        >
          <Badge tone={employee.isActive ? 'green' : 'red'}>
            {employee.isActive ? 'Активен' : 'Деактивирован'}
          </Badge>
        </button>
      </TD>
    </TR>
  );
}
