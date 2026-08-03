import type { Employee, EmployeesResponse, UpdateEmployeeInput } from '@/types/employee';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export interface EmployeeQueryParams {
  search?: string;
}

export const employeesApi = {
  getAll: async (params?: EmployeeQueryParams): Promise<EmployeesResponse> => {
    const { data } = await api.get('/employees', { params });
    return data;
  },

  update: async (id: number, body: UpdateEmployeeInput): Promise<Employee> => {
    const { data } = await api.patch(`/employees/${id}`, body);
    return data;
  },
};
