import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Providers } from './providers';
import { ProtectedRoute, GuestRoute, RoleRoute } from '@/design-revamp/components/layout/RouteGuards';
import { PublicLayout } from '@/design-revamp/components/layout/PublicLayout';

const LoginPage = lazy(() => import('./views/auth/LoginPage'));
const RegisterPage = lazy(() => import('./views/auth/RegisterPage'));
const MasterLoginPage = lazy(() => import('./views/auth/MasterLoginPage'));
const DashboardPage = lazy(() => import('./views/public/DashboardPage'));
const SubmitReportPage = lazy(() => import('./views/public/SubmitReportPage'));
const MyReportsPage = lazy(() => import('./views/public/MyReportsPage'));
const PublicAccountPage = lazy(() => import('./views/public/AccountPage'));
const CleanerTasksPage = lazy(() => import('./views/cleaner/TasksPage'));
const CleanerAccountPage = lazy(() => import('./views/cleaner/AccountPage'));
const SupervisorTaskBoardPage = lazy(() => import('./views/supervisor/TaskBoardPage'));
const SupervisorDispatchPage = lazy(() => import('./views/supervisor/DispatchPage'));
const SupervisorReviewsPage = lazy(() => import('./views/supervisor/ReviewsPage'));
const SupervisorWorkforcePage = lazy(() => import('./views/supervisor/WorkforcePage'));
const SupervisorOnboardPage = lazy(() => import('./views/supervisor/OnboardPage'));
const SupervisorAccountPage = lazy(() => import('./views/supervisor/AccountPage'));
const AdminOverviewPage = lazy(() => import('./views/admin/OverviewPage'));
const AdminUsersPage = lazy(() => import('./views/admin/UsersPage'));
const AdminOnboardPage = lazy(() => import('./views/admin/OnboardPage'));
const AdminControlPage = lazy(() => import('./views/admin/ControlPage'));
const AdminAccountPage = lazy(() => import('./views/admin/AccountPage'));

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
    element: <Navigate to="/dashboard" replace />,
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
    path: '/account',
    element: (
      <ProtectedRoute>
        <PublicLayout>
          <PublicAccountPage />
        </PublicLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/cleaner',
    element: (
      <RoleRoute roles={['cleaner']}>
        <CleanerTasksPage />
      </RoleRoute>
    ),
  },
  {
    path: '/cleaner/tasks',
    element: (
      <RoleRoute roles={['cleaner']}>
        <CleanerTasksPage />
      </RoleRoute>
    ),
  },
  {
    path: '/cleaner/account',
    element: (
      <RoleRoute roles={['cleaner']}>
        <CleanerAccountPage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorTaskBoardPage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor/tasks',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorTaskBoardPage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor/dispatch',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorDispatchPage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor/reviews',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorReviewsPage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor/workforce',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorWorkforcePage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor/onboard',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorOnboardPage />
      </RoleRoute>
    ),
  },
  {
    path: '/supervisor/account',
    element: (
      <RoleRoute roles={['supervisor']}>
        <SupervisorAccountPage />
      </RoleRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <RoleRoute roles={['master']}>
        <AdminOverviewPage />
      </RoleRoute>
    ),
  },
  {
    path: '/admin/overview',
    element: (
      <RoleRoute roles={['master']}>
        <AdminOverviewPage />
      </RoleRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <RoleRoute roles={['master']}>
        <AdminUsersPage />
      </RoleRoute>
    ),
  },
  {
    path: '/admin/onboard',
    element: (
      <RoleRoute roles={['master']}>
        <AdminOnboardPage />
      </RoleRoute>
    ),
  },
  {
    path: '/admin/control',
    element: (
      <RoleRoute roles={['master']}>
        <AdminControlPage />
      </RoleRoute>
    ),
  },
  {
    path: '/admin/account',
    element: (
      <RoleRoute roles={['master']}>
        <AdminAccountPage />
      </RoleRoute>
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
