import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { EmployeeRole } from '@/types/employee';

/** Требует авторизации; при необходимости — конкретную роль (иначе редирект на /requests) */
export function ProtectedRoute({ requireRole }: { requireRole?: EmployeeRole }) {
  const { isAuthenticated, employee } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireRole && employee?.role !== requireRole) {
    return <Navigate to="/requests" replace />;
  }

  return <Outlet />;
}
