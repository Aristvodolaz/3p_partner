import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { PartnersPage } from '@/pages/PartnersPage';
import { SkusPage } from '@/pages/SkusPage';
import { TariffsPage } from '@/pages/TariffsPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { IncomingDeliveriesPage } from '@/pages/IncomingDeliveriesPage';
import { OutgoingDeliveriesPage } from '@/pages/OutgoingDeliveriesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { StoragePage } from '@/pages/StoragePage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { ActsPage } from '@/pages/ActsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/incoming-deliveries" replace />} />
          <Route path="/incoming-deliveries" element={<IncomingDeliveriesPage />} />
          <Route path="/outgoing-deliveries" element={<OutgoingDeliveriesPage />} />
          {/* Архив — старый единый цикл заявки, заменён ВХП/ИСП/Инвентаризацией.
              Данные и маршрут оставлены для истории/актов, из навигации убран. */}
          <Route path="/requests" element={<RequestsPage />} />

          <Route element={<ProtectedRoute requireRole="НРП" />}>
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/skus" element={<SkusPage />} />
            <Route path="/tariffs" element={<TariffsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/storage" element={<StoragePage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/acts" element={<ActsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
