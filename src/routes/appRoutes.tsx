import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleGuard } from '../components/auth/RoleGuard';
import { Login } from '../pages/auth/Login';
import { StudentRegister } from '../pages/auth/StudentRegister';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { NotFound } from '../pages/common/NotFound';
import { Profile } from '../pages/common/Profile';
import { Loader2 } from 'lucide-react';

const TeacherDashboard = lazy(() =>
  import('../pages/dashboards/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const StudentDashboard = lazy(() =>
  import('../pages/dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);

const LazyLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/register',
    element: <StudentRegister />,
  },
  {
    path: '/daftar',
    element: <StudentRegister />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard/guru" replace />,
      },
      {
        path: 'guru',
        element: (
          <RoleGuard allowedRoles={['guru', 'teacher']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'guru/*',
        element: (
          <RoleGuard allowedRoles={['guru', 'teacher']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'teacher',
        element: (
          <RoleGuard allowedRoles={['guru', 'teacher']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'teacher/*',
        element: (
          <RoleGuard allowedRoles={['guru', 'teacher']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'siswa',
        element: (
          <RoleGuard allowedRoles={['siswa', 'student']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'siswa/*',
        element: (
          <RoleGuard allowedRoles={['siswa', 'student']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'student',
        element: (
          <RoleGuard allowedRoles={['siswa', 'student']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'student/*',
        element: (
          <RoleGuard allowedRoles={['siswa', 'student']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
