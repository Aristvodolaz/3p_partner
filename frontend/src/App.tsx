import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PartnersPage } from '@/pages/PartnersPage';
import { SkusPage } from '@/pages/SkusPage';
import { TariffsPage } from '@/pages/TariffsPage';
import { RequestsPage } from '@/pages/RequestsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/partners" replace />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/skus" element={<SkusPage />} />
        <Route path="/tariffs" element={<TariffsPage />} />
        <Route path="/requests" element={<RequestsPage />} />
      </Route>
    </Routes>
  );
}
