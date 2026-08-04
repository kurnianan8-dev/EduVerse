import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { AppRole, ROLE_LABELS } from '../../types/auth.types';
import { getRoleBadgeStyle } from '../../lib/utils';
import { LogIn, Shield, Loader2, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Silakan masukkan alamat email yang valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState<AppRole>('teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: `teacher@eduverse.io`,
      password: 'password123',
    },
  });

  const onSubmit = async (_data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(_data.email, _data.password, selectedRole);
      const targetPath = selectedRole === 'teacher' || selectedRole === 'guru' ? '/dashboard/guru' : '/dashboard/siswa';
      navigate(targetPath, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelect = (role: AppRole) => {
    setSelectedRole(role);
    setValue('email', `${role === 'teacher' ? 'teacher' : 'student'}@eduverse.io`);
    setValue('password', 'password123');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-display font-extrabold text-white">Masuk ke EduVerse</h2>
        <p className="text-sm text-slate-400">Pilih masuk sebagai Guru atau Siswa untuk membuka dasbor pembelajaran.</p>
      </div>

      {/* Role Selection Tabs: Guru & Siswa Only */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Pilih Peran Akun</span>
          <span className="text-[10px] text-blue-400 flex items-center gap-1 font-normal">
            <Sparkles className="w-3 h-3" /> Akses Cepat
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['teacher', 'student'] as AppRole[]).map((r) => {
            const isSelected = selectedRole === r;
            const style = getRoleBadgeStyle(r);
            const labelText = r === 'teacher' ? 'Guru' : 'Siswa';
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`p-3 rounded-xl text-sm font-bold border transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? `${style.bg} ${style.text} ${style.border} ring-2 ring-blue-500/50 scale-[1.02]`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Login {labelText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Alamat Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="admin@eduverse.io"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Masuk ke Ruang Kerja sebagai {ROLE_LABELS[selectedRole]}
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Siswa belum memiliki akun?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-semibold">
              Daftar Siswa Mandiri Di Sini
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
