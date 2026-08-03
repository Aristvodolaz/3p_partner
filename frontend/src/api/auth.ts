import type { LoginResponse } from '@/types/employee';
import { createApiClient } from '@/lib/apiClient';

const api = createApiClient();

export const authApi = {
  login: async (employeeId: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { employeeId });
    return data;
  },
};
