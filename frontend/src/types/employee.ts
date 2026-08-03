export type EmployeeRole = 'НПП' | 'НРП';

export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  role: EmployeeRole | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesResponse {
  data: Employee[];
  total: number;
}

export interface UpdateEmployeeInput {
  role?: EmployeeRole | null;
  isActive?: boolean;
}

export interface LoginResponse {
  token: string;
  employee: {
    id: number;
    employeeId: string;
    fullName: string;
    role: EmployeeRole | null;
  };
}
