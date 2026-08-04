import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppRole, Permission, UserProfile, ROLE_PERMISSIONS } from '../types/auth.types';
import { supabase } from '../lib/supabase';
import { isMockEnvironment } from '../config/env';

interface AuthContextType {
  user: UserProfile | null;
  role: AppRole;
  schoolId: string | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email?: string, password?: string, mockRole?: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: AppRole) => void;
  hasPermission: (permission: Permission) => boolean;
}

// Mock User Profiles for instant testing
const MOCK_PROFILES: Record<string, UserProfile> = {
  super_admin: {
    id: 'mock-superadmin-001',
    email: 'superadmin@eduverse.io',
    fullName: 'Alex Vance (Super Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  school_admin: {
    id: 'mock-schooladmin-002',
    email: 'admin@horizonacademy.edu',
    fullName: 'Dr. Evelyn Carter',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'school_admin',
    schoolId: 'sch-001',
    schoolName: 'Horizon International Academy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  teacher: {
    id: 'mock-teacher-003',
    email: 'm.chen@horizonacademy.edu',
    fullName: 'Prof. Marcus Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
    schoolId: 'sch-001',
    schoolName: 'Horizon International Academy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  guru: {
    id: 'mock-teacher-003',
    email: 'm.chen@horizonacademy.edu',
    fullName: 'Prof. Marcus Chen (Guru)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'guru',
    schoolId: 'sch-001',
    schoolName: 'Horizon International Academy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  student: {
    id: 'mock-student-004',
    email: 'sophia.taylor@student.eduverse.io',
    fullName: 'Sophia Taylor',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    jurusan: 'Teknik Informatika',
    qrCode: 'EDU-SISWA-MOCK-004',
    schoolId: 'sch-001',
    schoolName: 'Horizon International Academy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  siswa: {
    id: 'mock-student-004',
    email: 'sophia.taylor@student.eduverse.io',
    fullName: 'Sophia Taylor (Siswa)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'siswa',
    jurusan: 'Teknik Informatika',
    qrCode: 'EDU-SISWA-MOCK-004',
    schoolId: 'sch-001',
    schoolName: 'Horizon International Academy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  parent: {
    id: 'mock-parent-005',
    email: 'david.taylor@gmail.com',
    fullName: 'David Taylor (Parent)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'parent',
    schoolId: 'sch-001',
    schoolName: 'Horizon International Academy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<AppRole>('school_admin');
  const [user, setUser] = useState<UserProfile | null>(MOCK_PROFILES['school_admin']);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isMockEnvironment) {
      setUser(MOCK_PROFILES[activeRole] || MOCK_PROFILES['school_admin']);
      return;
    }

    // Real Supabase session synchronization
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchSupabaseProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeRole]);

  const fetchSupabaseProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Profile fetch warning, fallback to mock profile:', error?.message);
        setUser(MOCK_PROFILES[activeRole] || MOCK_PROFILES['school_admin']);
      } else {
        const profileData = data as Record<string, any>;
        const userProf: UserProfile = {
          id: profileData.id,
          email: profileData.email,
          fullName: profileData.full_name,
          avatarUrl: profileData.avatar_url || undefined,
          role: profileData.role as AppRole,
          jurusan: profileData.jurusan,
          qrCode: profileData.qr_code,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        };
        setUser(userProf);
        setActiveRole(userProf.role);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email?: string, password?: string, mockRole?: AppRole) => {
    setIsLoading(true);
    try {
      if (email && password && !isMockEnvironment) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session?.user) {
          await fetchSupabaseProfile(data.session.user.id);
        }
      } else {
        const targetRole = mockRole || activeRole;
        setActiveRole(targetRole);
        setUser(MOCK_PROFILES[targetRole] || MOCK_PROFILES['school_admin']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (!isMockEnvironment) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: AppRole) => {
    setActiveRole(newRole);
    setUser(MOCK_PROFILES[newRole] || MOCK_PROFILES['school_admin']);
  };

  const hasPermission = (permission: Permission): boolean => {
    const userPermissions = ROLE_PERMISSIONS[activeRole] || [];
    return userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: activeRole,
        schoolId: user?.schoolId,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
