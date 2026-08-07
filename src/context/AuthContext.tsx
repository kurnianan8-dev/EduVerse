import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppRole, Permission, UserProfile, ROLE_PERMISSIONS } from '../types/auth.types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: AppRole;
  schoolId: string | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: AppRole) => void;
  hasPermission: (permission: Permission) => boolean;
  updateUserAvatar: (avatarUrl: string | undefined) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<AppRole>('guru');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateUserAvatar = (avatarUrl: string | undefined) => {
    if (user) {
      setUser({
        ...user,
        avatarUrl,
      });
    }
  };

  useEffect(() => {
    // Synchronize Supabase Auth Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchSupabaseProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSupabaseProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        const profileData = data as Record<string, any>;
        const mappedRole: AppRole =
          profileData.role === 'teacher' || profileData.role === 'guru' ? 'guru' : 'siswa';
        const userProf: UserProfile = {
          id: profileData.id,
          email: profileData.email || authUser.email,
          fullName: profileData.full_name || authUser.user_metadata?.full_name || authUser.email,
          avatarUrl: profileData.avatar_url || undefined,
          role: mappedRole,
          jurusan: profileData.jurusan || authUser.user_metadata?.jurusan,
          qrCode: profileData.qr_code || `EDU-SISWA-${authUser.id.slice(0, 8)}`,
          createdAt: profileData.created_at || new Date().toISOString(),
          updatedAt: profileData.updated_at || new Date().toISOString(),
        };
        setUser(userProf);
        setActiveRole(mappedRole);
      } else {
        // Build UserProfile directly from Auth User Metadata if table row isn't fetched yet
        const rawRole = authUser.user_metadata?.role;
        const mappedRole: AppRole = rawRole === 'teacher' || rawRole === 'guru' ? 'guru' : 'siswa';
        const userProf: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          fullName: authUser.user_metadata?.full_name || authUser.email || 'Pengguna EduVerse',
          role: mappedRole,
          jurusan: authUser.user_metadata?.jurusan,
          qrCode: `EDU-SISWA-${authUser.id.slice(0, 8)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(userProf);
        setActiveRole(mappedRole);
      }
    } catch (err) {
      console.error('Error fetching profile from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session?.user) {
        await fetchSupabaseProfile(data.session.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: AppRole) => {
    setActiveRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
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
        updateUserAvatar,
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
