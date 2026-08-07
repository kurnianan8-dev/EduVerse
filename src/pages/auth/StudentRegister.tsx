import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { isMockEnvironment } from '../../config/env';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, QrCode, CheckCircle2, ArrowRight, Loader2, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

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
  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru'>('siswa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    role: 'siswa' | 'guru';
    fullName: string;
    fieldInfo: string;
    qrCode?: string;
    email: string;
  } | null>(null);

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

  const handleRoleChange = (role: 'siswa' | 'guru') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const generatedQrCode = data.role === 'siswa' ? `EDU-SISWA-${Date.now()}-${Math.floor(Math.random() * 10000)}` : undefined;

      if (!isMockEnvironment) {
        // 1. Sign up in Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: data.role === 'guru' ? 'teacher' : 'student',
              jurusan: data.role === 'siswa' ? data.fieldInfo : undefined,
            },
          },
        });

        if (authErr) throw authErr;

        if (authData.user) {
          const userQrCode = data.role === 'siswa' ? `EDU-SISWA-${authData.user.id.slice(0, 8)}` : undefined;
          console.log('📌 [Registration] Generated Student QR Code:', userQrCode, 'User ID:', authData.user.id);

          // 2. Update user_metadata in Supabase Auth to ensure qr_code is saved in auth
          try {
            await supabase.auth.updateUser({
              data: {
                full_name: data.fullName,
                role: data.role === 'guru' ? 'teacher' : 'student',
                jurusan: data.role === 'siswa' ? data.fieldInfo : undefined,
                qr_code: userQrCode,
              },
            });
          } catch (mErr: any) {
            console.warn('⚠️ [Registration] Metadata update warning:', mErr.message);
          }

          // 3. Insert/Upsert into public.profiles table
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            role: data.role === 'guru' ? 'teacher' : 'student',
            jurusan: data.role === 'siswa' ? data.fieldInfo : undefined,
            qr_code: userQrCode,
          } as any);

          if (upsertErr) {
            console.warn('⚠️ [Registration] Profiles upsert notice:', upsertErr.message);
          } else {
            console.log('✅ [Registration] Saved profile & QR Code to Supabase profiles DB! Value:', userQrCode);
          }

          setRegistrationSuccess({
            role: data.role,
            fullName: data.fullName,
            fieldInfo: data.fieldInfo,
            qrCode: userQrCode,
            email: data.email,
          });
        }
      }
    } catch (err: any) {
      alert(`Gagal mendaftar: ${err.message || 'Terjadi kesalahan'}`);
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
              onClick={() => handleRoleChange('siswa')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedRole === 'siswa'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Siswa
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('guru')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
          <div className="space-y-6 animate-in fade-in text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <h3 className="text-base font-bold">Pendaftaran {registrationSuccess.role === 'guru' ? 'Guru' : 'Siswa'} Berhasil!</h3>
              <p className="text-xs text-slate-300">
                Akun Anda telah tersimpan di Supabase. Anda dapat langsung masuk ke aplikasi.
              </p>
            </div>

            {/* Generated QR Code for Student */}
            {registrationSuccess.role === 'siswa' && registrationSuccess.qrCode && (
              <div className="p-6 rounded-2xl bg-white text-slate-900 space-y-3 shadow-xl inline-block w-full border border-slate-200">
                <div className="flex justify-center py-2">
                  <QRCodeSVG value={registrationSuccess.qrCode} size={180} level="H" includeMargin={true} />
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
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              Lanjut ke Halaman Masuk <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Nama Lengkap</label>
              <input
                {...register('fullName')}
                type="text"
                placeholder={selectedRole === 'guru' ? 'Masukkan Nama Guru' : 'Masukkan Nama Siswa'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                placeholder={selectedRole === 'guru' ? 'Contoh: Fisika Kuantum / 19850101' : 'Contoh: Teknik Informatika / IPA 1'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {errors.fieldInfo && <p className="text-xs text-rose-400 mt-1">{errors.fieldInfo.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Alamat Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder={selectedRole === 'guru' ? 'guru@eduverse.io' : 'budi@siswa.eduverse.io'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-6 ${
                selectedRole === 'guru'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/25'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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
