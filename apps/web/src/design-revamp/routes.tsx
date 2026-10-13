import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Providers } from './providers';
import { ProtectedRoute, GuestRoute } from '@/design-revamp/components/layout/RouteGuards';
import { PublicLayout } from '@/design-revamp/components/layout/PublicLayout';

const LoginPage = lazy(() => import('./views/auth/LoginPage'));
const RegisterPage = lazy(() => import('./views/auth/RegisterPage'));
const MasterLoginPage = lazy(() => import('./views/auth/MasterLoginPage'));
const StatusBoardPage = lazy(() => import('./views/public/StatusBoardPage'));
const DashboardPage = lazy(() => import('./views/public/DashboardPage'));
const SubmitReportPage = lazy(() => import('./views/public/SubmitReportPage'));
const MyReportsPage = lazy(() => import('./views/public/MyReportsPage'));
const CleanerTasksPage = lazy(() => import('./views/cleaner/TasksPage'));
const CleanerAccountPage = lazy(() => import('./views/cleaner/AccountPage'));
const SupervisorTaskBoardPage = lazy(() => import('./views/supervisor/TaskBoardPage'));
const SupervisorWorkforcePage = lazy(() => import('./views/supervisor/WorkforcePage'));
const SupervisorOnboardPage = lazy(() => import('./views/supervisor/OnboardPage'));
const AdminOverviewPage = lazy(() => import('./views/admin/OverviewPage'));
const AdminUsersPage = lazy(() => import('./views/admin/UsersPage'));
const AdminOnboardPage = lazy(() => import('./views/admin/OnboardPage'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/login/master',
    element: (
      <GuestRoute>
        <MasterLoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/status',
    element: <StatusBoardPage />,
  },
  {
    path: '/dashboard',
    element: (
      <PublicLayout>
        <DashboardPage />
      </PublicLayout>
    ),
  },
  {
    path: '/submit',
    element: (
      <ProtectedRoute>
        <PublicLayout>
          <SubmitReportPage />
        </PublicLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/my-reports',
    element: (
      <ProtectedRoute>
        <PublicLayout>
          <MyReportsPage />
        </PublicLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/cleaner',
    element: (
      <ProtectedRoute>
        <CleanerTasksPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cleaner/tasks',
    element: (
      <ProtectedRoute>
        <CleanerTasksPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cleaner/account',
    element: (
      <ProtectedRoute>
        <CleanerAccountPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor',
    element: (
      <ProtectedRoute>
        <SupervisorTaskBoardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor/tasks',
    element: (
      <ProtectedRoute>
        <SupervisorTaskBoardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor/workforce',
    element: (
      <ProtectedRoute>
        <SupervisorWorkforcePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/supervisor/onboard',
    element: (
      <ProtectedRoute>
        <SupervisorOnboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminOverviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/overview',
    element: (
      <ProtectedRoute>
        <AdminOverviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute>
        <AdminUsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/onboard',
    element: (
      <ProtectedRoute>
        <AdminOnboardPage />
      </ProtectedRoute>
    ),
  },
]);

export default function App() {
  return (
    <Providers>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </Providers>
  );
}
