import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { PartnersPage } from '@/pages/PartnersPage';
import { SkusPage } from '@/pages/SkusPage';
import { TariffsPage } from '@/pages/TariffsPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { ActsPage } from '@/pages/ActsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<RequestsPage />} />

          <Route element={<ProtectedRoute requireRole="НРП" />}>
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/skus" element={<SkusPage />} />
            <Route path="/tariffs" element={<TariffsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/acts" element={<ActsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
