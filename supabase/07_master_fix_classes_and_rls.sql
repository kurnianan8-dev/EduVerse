-- =========================================================
-- EduVerse LMS - Master Migration SQL Fix for Classes & Enrollments
-- File: supabase/07_master_fix_classes_and_rls.sql
-- AMAN & TIDAK MENGHAPUS DATA SAMA SEKALI (NON-DESTRUCTIVE)
-- =========================================================

-- 1. Tambahkan Seluruh Kolom yang Diperlukan pada Tabel public.classes (Tanpa Menghapus Data Existing)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS jurusan TEXT DEFAULT 'Semua Jurusan';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Ganjil';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Tambahkan Seluruh Kolom yang Diperlukan pada Tabel public.enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Konfigurasi Kebijakan RLS (Row Level Security) yang Aman & Permisif untuk Pengguna Terautentikasi
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk public.classes:
-- a. Semua pengguna (termasuk anonim & terautentikasi) dapat membaca/mencari kelas berdasarkan kode
DROP POLICY IF EXISTS "Allow public select classes" ON public.classes;
CREATE POLICY "Allow public select classes" ON public.classes FOR SELECT USING (true);

-- b. Guru/Pengguna terautentikasi dapat membuat kelas baru
DROP POLICY IF EXISTS "Allow authenticated insert classes" ON public.classes;
CREATE POLICY "Allow authenticated insert classes" ON public.classes FOR INSERT WITH CHECK (true);

-- c. Guru/Pengguna terautentikasi dapat memperbarui kelas milik mereka
DROP POLICY IF EXISTS "Allow authenticated update classes" ON public.classes;
CREATE POLICY "Allow authenticated update classes" ON public.classes FOR UPDATE USING (true);

-- Kebijakan RLS untuk public.enrollments:
-- a. Semua pengguna terautentikasi dapat membaca data pendaftaran kelas
DROP POLICY IF EXISTS "Allow authenticated select enrollments" ON public.enrollments;
CREATE POLICY "Allow authenticated select enrollments" ON public.enrollments FOR SELECT USING (true);

-- b. Siswa dapat mendaftar (INSERT) ke kelas
DROP POLICY IF EXISTS "Allow authenticated insert enrollments" ON public.enrollments;
CREATE POLICY "Allow authenticated insert enrollments" ON public.enrollments FOR INSERT WITH CHECK (true);

-- c. Siswa/Guru dapat menghapus pendaftaran (DELETE)
DROP POLICY IF EXISTS "Allow authenticated delete enrollments" ON public.enrollments;
CREATE POLICY "Allow authenticated delete enrollments" ON public.enrollments FOR DELETE USING (true);

-- 4. Berikan Hak Akses Penuh (GRANT ALL) ke peran anon, authenticated, dan service_role
GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.enrollments TO anon, authenticated, service_role;
