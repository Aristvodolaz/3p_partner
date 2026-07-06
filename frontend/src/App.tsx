import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PartnersPage } from '@/pages/PartnersPage';
import { SkusPage } from '@/pages/SkusPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/partners" replace />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/skus" element={<SkusPage />} />
      </Route>
    </Routes>
  );
}
