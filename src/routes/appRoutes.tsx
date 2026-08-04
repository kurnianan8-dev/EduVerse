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

// Lazy loaded dashboard placeholders
const SuperAdminDashboard = lazy(() =>
  import('../pages/dashboards/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const SchoolAdminDashboard = lazy(() =>
  import('../pages/dashboards/SchoolAdminDashboard').then((m) => ({ default: m.SchoolAdminDashboard }))
);
const TeacherDashboard = lazy(() =>
  import('../pages/dashboards/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const StudentDashboard = lazy(() =>
  import('../pages/dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const ParentDashboard = lazy(() =>
  import('../pages/dashboards/ParentDashboard').then((m) => ({ default: m.ParentDashboard }))
);

const LazyLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard/school-admin" replace />,
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
        element: <Navigate to="/dashboard/school-admin" replace />,
      },
      {
        path: 'super-admin',
        element: (
          <RoleGuard allowedRoles={['super_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <SuperAdminDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'super-admin/*',
        element: (
          <RoleGuard allowedRoles={['super_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <SuperAdminDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'school-admin',
        element: (
          <RoleGuard allowedRoles={['school_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <SchoolAdminDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'school-admin/*',
        element: (
          <RoleGuard allowedRoles={['school_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <SchoolAdminDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'teacher',
        element: (
          <RoleGuard allowedRoles={['teacher', 'guru', 'school_admin', 'super_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'teacher/*',
        element: (
          <RoleGuard allowedRoles={['teacher', 'guru', 'school_admin', 'super_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'guru',
        element: (
          <RoleGuard allowedRoles={['teacher', 'guru', 'school_admin', 'super_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'guru/*',
        element: (
          <RoleGuard allowedRoles={['teacher', 'guru', 'school_admin', 'super_admin']}>
            <Suspense fallback={<LazyLoader />}>
              <TeacherDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'student',
        element: (
          <RoleGuard allowedRoles={['student', 'siswa']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'student/*',
        element: (
          <RoleGuard allowedRoles={['student', 'siswa']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'siswa',
        element: (
          <RoleGuard allowedRoles={['student', 'siswa']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'siswa/*',
        element: (
          <RoleGuard allowedRoles={['student', 'siswa']}>
            <Suspense fallback={<LazyLoader />}>
              <StudentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'parent',
        element: (
          <RoleGuard allowedRoles={['parent']}>
            <Suspense fallback={<LazyLoader />}>
              <ParentDashboard />
            </Suspense>
          </RoleGuard>
        ),
      },
      {
        path: 'parent/*',
        element: (
          <RoleGuard allowedRoles={['parent']}>
            <Suspense fallback={<LazyLoader />}>
              <ParentDashboard />
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
