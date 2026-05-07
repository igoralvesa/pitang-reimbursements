import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AccessDenied } from '@/components/AccessDenied';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { canCreateRequest, canManageCategories, canManageUsers } from '@/lib/permissions';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditRequestPage } from '@/pages/EditRequestPage';
import { LoginPage } from '@/pages/LoginPage';
import { NewRequestPage } from '@/pages/NewRequestPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequestDetailPage } from '@/pages/RequestDetailPage';
import { UsersPage } from '@/pages/UsersPage';

function PrivateRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}

function RoleGate({ allowed }: { allowed: boolean }) {
  if (!allowed) {
    return <AccessDenied />;
  }

  return <Outlet />;
}

export function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path='/' element={<Navigate to='/login' replace />} />
      <Route path='/login' element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/requests/:id' element={<RequestDetailPage />} />
          <Route element={<RoleGate allowed={canCreateRequest(user)} />}>
            <Route path='/requests/new' element={<NewRequestPage />} />
            <Route path='/requests/:id/edit' element={<EditRequestPage />} />
          </Route>
          <Route element={<RoleGate allowed={canManageCategories(user)} />}>
            <Route path='/categories' element={<CategoriesPage />} />
          </Route>
          <Route element={<RoleGate allowed={canManageUsers(user)} />}>
            <Route path='/users' element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  );
}
