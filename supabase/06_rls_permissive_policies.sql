-- =========================================================
-- EduVerse LMS - Permissive RLS Policies SQL Migration
-- File: supabase/06_rls_permissive_policies.sql
-- =========================================================

-- 1. Pastikan RLS diaktifkan dengan kebijakan serbaguna (Permissive Policies)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan untuk Tabel classes (Akses Baca Semua Pengguna, Akses Buat/Ubah Pengguna Terautentikasi)
DROP POLICY IF EXISTS "Allow public read access to classes" ON public.classes;
CREATE POLICY "Allow public read access to classes" ON public.classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to classes" ON public.classes;
CREATE POLICY "Allow authenticated insert to classes" ON public.classes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to classes" ON public.classes;
CREATE POLICY "Allow authenticated update to classes" ON public.classes FOR UPDATE USING (true);

-- 3. Kebijakan untuk Tabel enrollments (Siswa Dapat Mendaftar & Membaca Keanggotaan Kelas)
DROP POLICY IF EXISTS "Allow public read access to enrollments" ON public.enrollments;
CREATE POLICY "Allow public read access to enrollments" ON public.enrollments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to enrollments" ON public.enrollments;
CREATE POLICY "Allow authenticated insert to enrollments" ON public.enrollments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete to enrollments" ON public.enrollments;
CREATE POLICY "Allow authenticated delete to enrollments" ON public.enrollments FOR DELETE USING (true);

-- 4. Berikan Hak Akses ke Peran Anonim dan Authenticated
GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.enrollments TO anon, authenticated, service_role;
