export type AppRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | 'guru' | 'siswa';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: AppRole;
  jurusan?: string;
  qrCode?: string;
  schoolId?: string;
  schoolName?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  iconName: string;
  roles: AppRole[];
  badge?: string;
}

export interface AuthState {
  user: UserProfile | null;
  role: AppRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  schoolId?: string;
}

export type Permission =
  | 'manage_platform'
  | 'manage_schools'
  | 'manage_users'
  | 'manage_courses'
  | 'view_courses'
  | 'submit_assignments'
  | 'grade_assignments'
  | 'view_child_progress'
  | 'view_audit_logs';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: [
    'manage_platform',
    'manage_schools',
    'manage_users',
    'manage_courses',
    'view_courses',
    'view_audit_logs',
  ],
  school_admin: [
    'manage_schools',
    'manage_users',
    'manage_courses',
    'view_courses',
    'view_audit_logs',
  ],
  teacher: [
    'manage_courses',
    'view_courses',
    'grade_assignments',
  ],
  student: [
    'view_courses',
    'submit_assignments',
  ],
  parent: [
    'view_child_progress',
    'view_courses',
  ],
  guru: [
    'manage_courses',
    'view_courses',
    'grade_assignments',
  ],
  siswa: [
    'view_courses',
    'submit_assignments',
  ],
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  school_admin: 'Admin Sekolah',
  teacher: 'Guru',
  student: 'Siswa',
  parent: 'Orang Tua',
  guru: 'Guru',
  siswa: 'Siswa',
};

export const ROLE_COLORS: Record<AppRole, { bg: string; text: string; border: string }> = {
  super_admin: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' },
  school_admin: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800' },
  teacher: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  student: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
  parent: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  guru: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  siswa: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
};
