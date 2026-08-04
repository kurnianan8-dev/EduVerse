export type AppRole = 'guru' | 'siswa' | 'teacher' | 'student';

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
  | 'manage_courses'
  | 'view_courses'
  | 'submit_assignments'
  | 'grade_assignments';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  guru: ['manage_courses', 'view_courses', 'grade_assignments'],
  teacher: ['manage_courses', 'view_courses', 'grade_assignments'],
  siswa: ['view_courses', 'submit_assignments'],
  student: ['view_courses', 'submit_assignments'],
};

export const ROLE_LABELS: Record<AppRole, string> = {
  guru: 'Guru',
  teacher: 'Guru',
  siswa: 'Siswa',
  student: 'Siswa',
};

export const ROLE_COLORS: Record<AppRole, { bg: string; text: string; border: string }> = {
  guru: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  teacher: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  siswa: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
  student: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
};
