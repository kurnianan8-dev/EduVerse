import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { isMockEnvironment } from '../../config/env';
import { useAuth, translateSupabaseAuthError } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  UserPlus,
  CheckCircle2,
  ArrowRight,
  Loader2,
  GraduationCap,
  ShieldCheck,
  MailCheck,
  RefreshCw,
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
  const { isLoading: isAuthLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru'>('siswa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendNotice, setResendNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [registrationSuccess, setRegistrationSuccess] = useState<{
    role: 'siswa' | 'guru';
    fullName: string;
    fieldInfo: string;
    qrCode?: string;
    email: string;
    needsEmailConfirmation: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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

  const isBusy = isSubmitting || isAuthLoading;

  const handleRoleChange = (role: 'siswa' | 'guru') => {
    setSelectedRole(role);
    setValue('role', role);
    setRegisterError(null);
    setIsAlreadyRegisteredError(false);
  };

  const handleResendActivationEmail = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || registrationSuccess?.email || getValues('email') || '').trim();
    if (!emailToUse) {
      setResendNotice({
        type: 'error',
        message: 'Silakan masukkan alamat email terlebih dahulu untuk mengirim ulang aktivasi.',
      });
      return;
    }

    setIsResendingEmail(true);
    setResendNotice(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        const translated = translateSupabaseAuthError(error);
        throw new Error(translated.message);
      }

      setResendNotice({
        type: 'success',
        message: `Email aktivasi berhasil dikirim ulang ke ${emailToUse}. Silakan periksa Inbox atau folder Spam Anda.`,
      });
    } catch (err: any) {
      setResendNotice({
        type: 'error',
        message: err?.message || 'Gagal mengirim ulang email aktivasi. Silakan coba beberapa saat lagi.',
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (isBusy) return;
    setIsSubmitting(true);
    setRegisterError(null);
    setIsAlreadyRegisteredError(false);
    setResendNotice(null);

    try {
      const cleanEmail = data.email.trim();
      const cleanFullName = data.fullName.trim();
      const cleanFieldInfo = data.fieldInfo.trim();
      const dbRole = data.role === 'guru' ? 'teacher' : 'student';

      if (!isMockEnvironment) {
        // 1. Sign up in Supabase Auth with emailRedirectTo and full metadata
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: cleanFullName,
              name: cleanFullName,
              role: dbRole,
              major: cleanFieldInfo,
              jurusan: cleanFieldInfo,
              class_name: data.role === 'siswa' ? cleanFieldInfo : undefined,
              department: cleanFieldInfo,
            },
          },
        });

        if (authErr) {
          const translated = translateSupabaseAuthError(authErr);
          setIsAlreadyRegisteredError(Boolean(translated.isAlreadyRegistered));
          throw new Error(translated.message);
        }

        // Detect obfuscated duplicate email when Confirm Email is enabled in Supabase
        if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
          setIsAlreadyRegisteredError(true);
          throw new Error(
            'Email ini sudah terdaftar! Silakan langsung masuk (Login) atau cek email Anda jika belum melakukan aktivasi.'
          );
        }

        if (authData.user) {
          const userQrCode = data.role === 'siswa' ? `EDU-SISWA-${authData.user.id.slice(0, 8)}` : undefined;
          const requiresEmailConfirmation = Boolean(authData.user && !authData.session);

          // 2. If session is already active, update user_metadata in Supabase Auth
          if (authData.session) {
            try {
              await supabase.auth.updateUser({
                data: {
                  full_name: cleanFullName,
                  name: cleanFullName,
                  role: dbRole,
                  major: cleanFieldInfo,
                  jurusan: cleanFieldInfo,
                  qr_code: userQrCode,
                },
              });
            } catch (mErr: any) {
              console.warn('⚠️ [Registration] Metadata update warning:', mErr.message);
            }
          }

          // 3. Best-effort Insert/Upsert into public.profiles table
          try {
            const { error: upsertErr } = await supabase.from('profiles').upsert({
              id: authData.user.id,
              email: cleanEmail,
              full_name: cleanFullName,
              role: dbRole,
              jurusan: data.role === 'siswa' ? cleanFieldInfo : undefined,
              qr_code: userQrCode,
            } as any);

            if (upsertErr) {
              console.warn('⚠️ [Registration] Profiles upsert notice:', upsertErr.message);
            }
          } catch (uErr: any) {
            console.warn('⚠️ [Registration] Profiles upsert skipped until email confirmed:', uErr?.message);
          }

          setRegistrationSuccess({
            role: data.role,
            fullName: cleanFullName,
            fieldInfo: cleanFieldInfo,
            qrCode: userQrCode,
            email: cleanEmail,
            needsEmailConfirmation: requiresEmailConfirmation,
          });
        }
      } else {
        const mockQr = data.role === 'siswa' ? `EDU-SISWA-${Date.now().toString().slice(-8)}` : undefined;
        setRegistrationSuccess({
          role: data.role,
          fullName: cleanFullName,
          fieldInfo: cleanFieldInfo,
          qrCode: mockQr,
          email: cleanEmail,
          needsEmailConfirmation: true,
        });
      }
    } catch (err: any) {
      const translated = translateSupabaseAuthError(err);
      if (translated.isAlreadyRegistered) {
        setIsAlreadyRegisteredError(true);
      }
      setRegisterError(translated.message);
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
        {!registrationSuccess && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              disabled={isBusy}
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
              disabled={isBusy}
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
        )}

        {registrationSuccess ? (
          <div className="space-y-5 animate-in fade-in text-center">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                {registrationSuccess.needsEmailConfirmation ? (
                  <MailCheck className="w-7 h-7 text-emerald-400" />
                ) : (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                )}
              </div>
              <h3 className="text-base font-bold text-white">
                Pendaftaran {registrationSuccess.role === 'guru' ? 'Guru' : 'Siswa'} Berhasil!
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Pendaftaran berhasil! Kami telah mengirimkan email aktivasi ke{' '}
                <strong className="text-emerald-300 underline">{registrationSuccess.email}</strong>. Silakan buka kotak
                masuk (Inbox) atau folder Spam email Anda dan klik tombol <strong>Aktifkan Akun</strong> sebelum login.
              </p>
            </div>

            {resendNotice && (
              <div
                className={`p-3 rounded-xl text-xs border flex items-start gap-2 text-left ${
                  resendNotice.type === 'success'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resendNotice.message}</span>
              </div>
            )}

            {/* Resend Verification Email Button */}
            <button
              type="button"
              disabled={isResendingEmail}
              onClick={() => handleResendActivationEmail(registrationSuccess.email)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isResendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengirim Ulang Email Aktivasi...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-emerald-400" /> Kirim Ulang Email Aktivasi
                </>
              )}
            </button>

            {/* Generated QR Code for Student */}
            {registrationSuccess.role === 'siswa' && registrationSuccess.qrCode && (
              <div className="p-5 rounded-2xl bg-white text-slate-900 space-y-3 shadow-xl inline-block w-full border border-slate-200">
                <div className="flex justify-center py-1">
                  <QRCodeSVG value={registrationSuccess.qrCode} size={160} level="H" includeMargin={true} />
                </div>
                <div className="border-t border-slate-200 pt-3 text-center space-y-1">
                  <p className="font-bold text-sm text-slate-900">{registrationSuccess.fullName}</p>
                  <p className="text-xs text-slate-500 font-medium">Jurusan: {registrationSuccess.fieldInfo}</p>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    {registrationSuccess.qrCode}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              Lanjut ke Halaman Masuk <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {registerError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed">{registerError}</span>
                </div>

                {isAlreadyRegisteredError && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Link
                      to="/login"
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                    >
                      Langsung Masuk (Login) <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      disabled={isResendingEmail}
                      onClick={() => handleResendActivationEmail(getValues('email'))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isResendingEmail ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-emerald-400" />
                      )}
                      Kirim Ulang Email Aktivasi
                    </button>
                  </div>
                )}
              </div>
            )}

            {resendNotice && (
              <div
                className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                  resendNotice.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resendNotice.message}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Nama Lengkap</label>
              <input
                {...register('fullName')}
                type="text"
                disabled={isBusy}
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
                disabled={isBusy}
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
                disabled={isBusy}
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
                disabled={isBusy}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
              />
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 ${
                selectedRole === 'guru'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/25'
              }`}
            >
              {isBusy ? (
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
        )}
      </div>
    </div>
  );
};
