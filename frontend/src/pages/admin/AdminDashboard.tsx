import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminMockProvider } from './hooks/useAdminMock';
import AdminLayout from './components/AdminLayout';
import AdminLoginPage from './AdminLoginPage';
import AdminMembersPage from './AdminMembersPage';
import AdminOverviewPage from './AdminOverviewPage';
import AdminProfilesPage from './AdminProfilesPage';
import AdminValuesPage from './AdminValuesPage';

export default function AdminDashboard() {
  return (
    <AdminMockProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="profiles" element={<AdminProfilesPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="values" element={<AdminValuesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminMockProvider>
  );
}
