-- =========================================================
-- EduVerse LMS - Migration SQL: Membuat Tabel attendance_records
-- File: supabase/01_create_attendance_records.sql
-- =========================================================

-- 1. Tambah Kolom Jurusan & QR Code pada Tabel Profiles (jika belum ada)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jurusan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 2. Buat Tabel attendance_records Lengkap dengan Foreign Keys & Timestamps
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL DEFAULT 'masuk',
    status TEXT NOT NULL DEFAULT 'hadir',
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Nonaktifkan RLS agar dapat diakses penuh oleh aplikasi LMS
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;

-- 4. Berikan Izin Akses Penuh ke Peran anon, authenticated, dan service_role
GRANT ALL ON TABLE public.attendance_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
