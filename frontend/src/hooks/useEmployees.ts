import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { employeesApi, type EmployeeQueryParams, type GrantRoleInput } from '@/api/employees';
import type { UpdateEmployeeInput } from '@/types/employee';

export const EMPLOYEES_KEY = ['employees'] as const;

export function useEmployees(params?: EmployeeQueryParams) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, params],
    queryFn: () => employeesApi.getAll(params),
  });
}

export function useUpdateEmployee(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEmployeeInput) => employeesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      toast.success('Данные сотрудника обновлены');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGrantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GrantRoleInput) => employeesApi.grant(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
      toast.success('Роль выдана по ШК');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
