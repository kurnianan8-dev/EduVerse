import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, translateSupabaseAuthError } from '../../context/AuthContext';
import {
  UserPlus,
  ArrowRight,
  Loader2,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const registerSchema = z.object({
  role: z.enum(['siswa', 'guru']),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  fieldInfo: z.string().min(2, 'Jurusan / Mata Pelajaran wajib diisi'),
  email: z.string().email('Silakan masukkan alamat email yang valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const StudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading: isAuthLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru'>('siswa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'siswa',
      fullName: '',
      fieldInfo: '',
      email: '',
      password: '',
    },
  });

  const isLoading = isSubmitting || isAuthLoading;

  const handleRoleChange = (role: 'siswa' | 'guru') => {
    setSelectedRole(role);
    setValue('role', role);
    setRegisterError(null);
    setIsAlreadyRegisteredError(false);
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return;
    setIsSubmitting(true);
    setRegisterError(null);
    setIsAlreadyRegisteredError(false);

    try {
      await signUp({
        email: data.email.trim(),
        password: data.password,
        fullName: data.fullName.trim(),
        role: data.role,
        major: data.fieldInfo.trim(),
      });

      const targetPath = data.role === 'guru' ? '/dashboard/guru' : '/dashboard/siswa';
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const translated = translateSupabaseAuthError(err);
      if (translated.isAlreadyRegistered || err?.isAlreadyRegistered) {
        setIsAlreadyRegisteredError(true);
        setRegisterError('Email ini sudah terdaftar, silakan langsung Masuk');
      } else {
        setRegisterError(translated.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto border border-orange-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-extrabold text-white">Pendaftaran Akun EduVerse</h1>
          <p className="text-xs text-slate-400">Pilih registrasi sebagai Guru atau Siswa. Data langsung tersimpan di Supabase.</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleRoleChange('siswa')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              selectedRole === 'siswa'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Siswa
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleRoleChange('guru')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              selectedRole === 'guru'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Guru
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {registerError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{registerError}</span>
              </div>

              {isAlreadyRegisteredError && (
                <div className="pt-1">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                  >
                    Langsung Masuk (Login) <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nama Lengkap</label>
            <input
              {...register('fullName')}
              type="text"
              disabled={isLoading}
              placeholder={selectedRole === 'guru' ? 'Masukkan Nama Guru' : 'Masukkan Nama Siswa'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
            />
            {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {selectedRole === 'guru' ? 'Mata Pelajaran Utama / NIP' : 'Jurusan / Program Studi'}
            </label>
            <input
              {...register('fieldInfo')}
              type="text"
              disabled={isLoading}
              placeholder={selectedRole === 'guru' ? 'Contoh: Fisika Kuantum / 19850101' : 'Contoh: Teknik Informatika / IPA 1'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
            />
            {errors.fieldInfo && <p className="text-xs text-rose-400 mt-1">{errors.fieldInfo.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Alamat Email</label>
            <input
              {...register('email')}
              type="email"
              disabled={isLoading}
              placeholder={selectedRole === 'guru' ? 'guru@eduverse.io' : 'budi@siswa.eduverse.io'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
            />
            {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
            <input
              {...register('password')}
              type="password"
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
            />
            {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 ${
              selectedRole === 'guru'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/25'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses Pendaftaran...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Daftar Sebagai {selectedRole === 'guru' ? 'Guru' : 'Siswa'}
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Sudah memiliki akun?{' '}
              <Link to="/login" className="text-orange-400 hover:underline font-semibold">
                Masuk di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
