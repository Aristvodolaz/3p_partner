import type { Employee, EmployeeRole, EmployeesResponse, UpdateEmployeeInput } from '@/types/employee';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export interface EmployeeQueryParams {
  search?: string;
}

export interface GrantRoleInput {
  employeeId: string;
  role: EmployeeRole;
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

  grant: async (body: GrantRoleInput): Promise<Employee> => {
    const { data } = await api.post('/employees/grant', body);
    return data;
  },
};
