import type { LoginResponse } from '@/types/employee';

const TOKEN_KEY = '3p_token';
const EMPLOYEE_KEY = '3p_employee';

export type SessionEmployee = LoginResponse['employee'];

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmployee(): SessionEmployee | null {
  const raw = localStorage.getItem(EMPLOYEE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionEmployee;
  } catch {
    return null;
  }
}

export function setSession(token: string, employee: SessionEmployee) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMPLOYEE_KEY);
}
