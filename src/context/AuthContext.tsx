import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppRole, Permission, UserProfile, ROLE_PERMISSIONS } from '../types/auth.types';
import { supabase } from '../lib/supabase';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: 'siswa' | 'guru';
  major?: string;
}

export interface SignUpResult {
  user: any;
  session: any;
  needsEmailConfirmation: boolean;
  qrCode?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: AppRole;
  schoolId: string | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  resendVerificationEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: AppRole) => void;
  hasPermission: (permission: Permission) => boolean;
  updateUserAvatar: (avatarUrl: string | undefined) => void;
}

export const translateSupabaseAuthError = (err: any): { message: string; code?: string; isUnconfirmed?: boolean; isAlreadyRegistered?: boolean } => {
  const rawMessage = String(err?.message || err?.error_description || '').trim();
  const lower = rawMessage.toLowerCase();
  const code = String(err?.code || '').toLowerCase();

  if (
    lower.includes('user already registered') ||
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    code === 'user_already_exists' ||
    code === 'email_exists'
  ) {
    return {
      message: 'Email ini sudah terdaftar! Silakan langsung masuk (Login) atau cek email Anda jika belum melakukan aktivasi.',
      code: 'user_already_registered',
      isAlreadyRegistered: true,
    };
  }

  if (
    lower.includes('email not confirmed') ||
    code === 'email_not_confirmed'
  ) {
    return {
      message: 'Akun Anda belum diaktifkan. Silakan cek email Anda dan klik tombol aktivasi terlebih dahulu.',
      code: 'email_not_confirmed',
      isUnconfirmed: true,
    };
  }

  if (
    lower.includes('invalid login credentials') ||
    code === 'invalid_credentials'
  ) {
    return {
      message: 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali atau pastikan akun Anda sudah terdaftar.',
      code: 'invalid_credentials',
    };
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('for security purposes') ||
    lower.includes('over_email_send_rate_limit') ||
    code === 'over_email_send_rate_limit'
  ) {
    return {
      message: 'Terlalu banyak permintaan pengiriman email dalam waktu singkat. Silakan tunggu sekitar 60 detik lalu coba lagi.',
      code: 'rate_limit',
    };
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    err?.name === 'TypeError'
  ) {
    return {
      message:
        'Gagal terhubung ke server Supabase (Failed to fetch). Periksa koneksi internet Anda atau pastikan project Supabase dalam keadaan aktif.',
      code: 'network_error',
    };
  }

  return {
    message: rawMessage || 'Terjadi kesalahan pada layanan autentikasi. Silakan coba beberapa saat lagi.',
    code,
  };
};

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
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const isPlaceholderName = (val?: string | null) => {
        if (!val || typeof val !== 'string') return true;
        const clean = val.trim().toLowerCase();
        return (
          !clean ||
          clean === 'guru eduverse' ||
          clean === 'pengguna eduverse' ||
          clean === 'guru pengampu' ||
          clean === 'siswa' ||
          clean === 'anonim' ||
          clean === 'akun pengguna' ||
          clean === '-'
        );
      };

      const emailPrefix = authUser.email ? String(authUser.email).split('@')[0] : '';

      if (data) {
        const profileData = data as Record<string, any>;
        const rawMetaRole = authUser.user_metadata?.role;
        const mappedRole: AppRole =
          profileData.role === 'teacher' ||
          profileData.role === 'guru' ||
          rawMetaRole === 'teacher' ||
          rawMetaRole === 'guru'
            ? 'guru'
            : 'siswa';

        const resolvedFullName =
          (!isPlaceholderName(profileData.full_name) ? profileData.full_name : '') ||
          (!isPlaceholderName(profileData.name) ? profileData.name : '') ||
          (!isPlaceholderName(authUser.user_metadata?.full_name) ? authUser.user_metadata?.full_name : '') ||
          (!isPlaceholderName(authUser.user_metadata?.name) ? authUser.user_metadata?.name : '') ||
          emailPrefix ||
          authUser.email ||
          'Akun Pengguna';

        const resolvedMajor =
          profileData.major ||
          profileData.department ||
          profileData.class_name ||
          profileData.jurusan ||
          authUser.user_metadata?.major ||
          authUser.user_metadata?.department ||
          authUser.user_metadata?.class_name ||
          authUser.user_metadata?.jurusan;

        const resolvedQrCode =
          profileData.qr_code ||
          authUser.user_metadata?.qr_code ||
          `EDU-SISWA-${authUser.id.slice(0, 8)}`;

        // Sync real name & major to public.profiles if DB still has empty or placeholder values
        if (
          (isPlaceholderName(profileData.full_name) && resolvedFullName) ||
          (!profileData.jurusan && resolvedMajor) ||
          (!profileData.qr_code && resolvedQrCode)
        ) {
          const updatePayload: Record<string, any> = {
            full_name: resolvedFullName,
            email: profileData.email || authUser.email,
          };
          if (resolvedMajor) {
            updatePayload.jurusan = resolvedMajor;
            updatePayload.major = resolvedMajor;
          }
          if (resolvedQrCode) {
            updatePayload.qr_code = resolvedQrCode;
          }
          (supabase as any)
            .from('profiles')
            .update(updatePayload)
            .eq('id', authUser.id)
            .then(() => {});
        }

        const userProf: UserProfile = {
          id: profileData.id,
          email: profileData.email || authUser.email,
          fullName: resolvedFullName,
          avatarUrl: profileData.avatar_url || undefined,
          role: mappedRole,
          jurusan: resolvedMajor,
          qrCode: resolvedQrCode,
          createdAt: profileData.created_at || new Date().toISOString(),
          updatedAt: profileData.updated_at || new Date().toISOString(),
        };
        setUser(userProf);
        setActiveRole(mappedRole);
      } else {
        // Build UserProfile directly from Auth User Metadata if table row isn't fetched yet
        const rawRole = authUser.user_metadata?.role;
        const mappedRole: AppRole = rawRole === 'teacher' || rawRole === 'guru' ? 'guru' : 'siswa';
        const resolvedFullName =
          (!isPlaceholderName(authUser.user_metadata?.full_name) ? authUser.user_metadata?.full_name : '') ||
          (!isPlaceholderName(authUser.user_metadata?.name) ? authUser.user_metadata?.name : '') ||
          emailPrefix ||
          authUser.email ||
          'Akun Pengguna';

        const resolvedMajor =
          authUser.user_metadata?.major ||
          authUser.user_metadata?.department ||
          authUser.user_metadata?.class_name ||
          authUser.user_metadata?.jurusan;

        const resolvedQrCode =
          authUser.user_metadata?.qr_code || `EDU-SISWA-${authUser.id.slice(0, 8)}`;

        // Backfill missing profile row so StudentDashboard & TeacherDashboard joins find the real name & major
        const upsertPayload: Record<string, any> = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: resolvedFullName,
          role: mappedRole === 'guru' ? 'teacher' : 'student',
          qr_code: resolvedQrCode,
        };
        if (resolvedMajor) {
          upsertPayload.jurusan = resolvedMajor;
        }
        (supabase as any)
          .from('profiles')
          .upsert(upsertPayload)
          .then(() => {});

        const userProf: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          fullName: resolvedFullName,
          role: mappedRole,
          jurusan: resolvedMajor,
          qrCode: resolvedQrCode,
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
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        const translated = translateSupabaseAuthError(error);
        const customErr: any = new Error(translated.message);
        customErr.code = translated.code;
        customErr.isUnconfirmed = translated.isUnconfirmed;
        customErr.isAlreadyRegistered = translated.isAlreadyRegistered;
        throw customErr;
      }
      if (data.session?.user) {
        await fetchSupabaseProfile(data.session.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async ({ email, password, fullName, role, major }: SignUpParams): Promise<SignUpResult> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanName = fullName.trim();
      const cleanMajor = major?.trim() || undefined;
      const dbRole = role === 'guru' ? 'teacher' : 'student';

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: cleanName,
            name: cleanName,
            role: dbRole,
            major: cleanMajor,
            jurusan: cleanMajor,
            class_name: role === 'siswa' ? cleanMajor : undefined,
          },
        },
      });

      if (authErr) {
        const translated = translateSupabaseAuthError(authErr);
        const customErr: any = new Error(translated.message);
        customErr.code = translated.code;
        customErr.isUnconfirmed = translated.isUnconfirmed;
        customErr.isAlreadyRegistered = translated.isAlreadyRegistered;
        throw customErr;
      }

      // Detect obfuscated duplicate email when Confirm Email is enabled in Supabase
      if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        const dupErr: any = new Error(
          'Email ini sudah terdaftar! Silakan langsung masuk (Login) atau cek email Anda jika belum melakukan aktivasi.'
        );
        dupErr.code = 'user_already_registered';
        dupErr.isAlreadyRegistered = true;
        throw dupErr;
      }

      const userQrCode =
        authData?.user && role === 'siswa'
          ? `EDU-SISWA-${authData.user.id.slice(0, 8)}`
          : undefined;

      if (authData?.user) {
        // Only call updateUser if an active session already exists
        if (authData.session) {
          try {
            await supabase.auth.updateUser({
              data: {
                full_name: cleanName,
                name: cleanName,
                role: dbRole,
                major: cleanMajor,
                jurusan: cleanMajor,
                qr_code: userQrCode,
              },
            });
          } catch (mErr: any) {
            console.warn('⚠️ [SignUp] Metadata update warning:', mErr?.message);
          }
        }

        // Best-effort upsert into public.profiles
        try {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: cleanEmail,
            full_name: cleanName,
            role: dbRole,
            jurusan: role === 'siswa' ? cleanMajor : undefined,
            qr_code: userQrCode,
          } as any);
        } catch (uErr: any) {
          console.warn('⚠️ [SignUp] Profiles upsert notice:', uErr?.message);
        }
      }

      const needsEmailConfirmation = Boolean(authData?.user && !authData?.session);

      return {
        user: authData?.user || null,
        session: authData?.session || null,
        needsEmailConfirmation,
        qrCode: userQrCode,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Silakan masukkan alamat email terlebih dahulu.');
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      const translated = translateSupabaseAuthError(error);
      const customErr: any = new Error(translated.message);
      customErr.code = translated.code;
      throw customErr;
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
        signUp,
        resendVerificationEmail,
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
