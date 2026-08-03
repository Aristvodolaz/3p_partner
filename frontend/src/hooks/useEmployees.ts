import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { employeesApi, type EmployeeQueryParams } from '@/api/employees';
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
