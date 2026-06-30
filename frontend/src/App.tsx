import { Routes, Route, Navigate } from 'react-router-dom';
import { PartnersPage } from '@/pages/PartnersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/partners" replace />} />
      <Route path="/partners" element={<PartnersPage />} />
    </Routes>
  );
}
