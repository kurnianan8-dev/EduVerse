import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, translateSupabaseAuthError } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ROLE_LABELS } from '../../types/auth.types';
import { getRoleBadgeStyle } from '../../lib/utils';
import { LogIn, Shield, Loader2, AlertCircle, RefreshCw, MailCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Silakan masukkan alamat email yang valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'guru' | 'siswa'>('guru');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnconfirmedEmail, setIsUnconfirmedEmail] = useState(false);
  const [unconfirmedEmailAddress, setUnconfirmedEmailAddress] = useState<string>('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailVerifiedBanner, setEmailVerifiedBanner] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isBusy = isLoading || isSubmitting;

  useEffect(() => {
    // Detect if user just clicked email confirmation link from Supabase
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (
      hash.includes('type=signup') ||
      hash.includes('access_token=') ||
      search.includes('type=signup') ||
      search.includes('code=')
    ) {
      setEmailVerifiedBanner(
        'Email Anda berhasil dikonfirmasi! Silakan masuk menggunakan email dan kata sandi yang telah Anda daftarkan.'
      );
    }
  }, []);

  const handleResendConfirmation = async () => {
    const targetEmail = (unconfirmedEmailAddress || getValues('email') || '').trim();
    if (!targetEmail) {
      setResendFeedback({
        type: 'error',
        message: 'Silakan masukkan alamat email Anda pada kolom di bawah terlebih dahulu.',
      });
      return;
    }

    setIsResendingEmail(true);
    setResendFeedback(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        const translated = translateSupabaseAuthError(error);
        throw new Error(translated.message);
      }

      setResendFeedback({
        type: 'success',
        message: `Email aktivasi telah dikirim ulang ke ${targetEmail}. Silakan cek kotak masuk (Inbox) atau folder Spam Anda.`,
      });
    } catch (err: any) {
      setResendFeedback({
        type: 'error',
        message: err?.message || 'Gagal mengirim ulang email aktivasi. Silakan coba lagi.',
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (isBusy) return;
    setIsSubmitting(true);
    setAuthError(null);
    setIsUnconfirmedEmail(false);
    setResendFeedback(null);

    try {
      await login(data.email.trim(), data.password);
      const targetPath = selectedRole === 'guru' ? '/dashboard/guru' : '/dashboard/siswa';
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      const translated = translateSupabaseAuthError(err);
      setAuthError(translated.message);
      if (translated.isUnconfirmed || err?.isUnconfirmed) {
        setIsUnconfirmedEmail(true);
        setUnconfirmedEmailAddress(data.email.trim());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelect = (role: 'guru' | 'siswa') => {
    setSelectedRole(role);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-display font-extrabold text-white">Masuk ke EduVerse</h2>
        <p className="text-sm text-slate-400">Gunakan akun Supabase Anda untuk masuk sebagai Guru atau Siswa.</p>
      </div>

      {/* Role Selection Tabs: Guru & Siswa Only */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Pilih Peran Akun</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['guru', 'siswa'] as const).map((r) => {
            const isSelected = selectedRole === r;
            const style = getRoleBadgeStyle(r);
            const labelText = r === 'guru' ? 'Guru' : 'Siswa';
            return (
              <button
                key={r}
                type="button"
                disabled={isBusy}
                onClick={() => handleRoleSelect(r)}
                className={`p-3 rounded-xl text-sm font-bold border transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isSelected
                    ? `${style.bg} ${style.text} ${style.border} ring-2 ring-blue-500/50 scale-[1.02]`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Masuk {labelText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {emailVerifiedBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <MailCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span className="leading-relaxed">{emailVerifiedBanner}</span>
        </div>
      )}

      {authError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{authError}</span>
          </div>

          {isUnconfirmedEmail && (
            <div className="pt-1">
              <button
                type="button"
                disabled={isResendingEmail}
                onClick={handleResendConfirmation}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isResendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim Ulang Email Aktivasi...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Kirim Ulang Email Aktivasi
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {resendFeedback && (
        <div
          className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
            resendFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{resendFeedback.message}</span>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Alamat Email</label>
          <input
            {...register('email')}
            type="email"
            disabled={isBusy}
            placeholder="masukkan email Supabase Anda"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
          />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
          <input
            {...register('password')}
            type="password"
            disabled={isBusy}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
          />
          {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Memproses Masuk...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Masuk ke Ruang Kerja sebagai {ROLE_LABELS[selectedRole]}
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Belum memiliki akun?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-semibold">
              Daftar Akun Guru / Siswa Di Sini
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
