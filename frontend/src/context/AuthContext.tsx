import { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { clearSession, getEmployee, setSession, type SessionEmployee } from '@/lib/session';

interface AuthContextValue {
  employee: SessionEmployee | null;
  isAuthenticated: boolean;
  login: (employeeId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<SessionEmployee | null>(() => getEmployee());

  const login = async (employeeId: string) => {
    const res = await authApi.login(employeeId);
    setSession(res.token, res.employee);
    setEmployee(res.employee);
  };

  const logout = () => {
    clearSession();
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ employee, isAuthenticated: !!employee, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}
