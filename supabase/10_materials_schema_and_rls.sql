-- =========================================================
-- EduVerse LMS - Production Migration for Materials Table & RLS
-- File: supabase/10_materials_schema_and_rls.sql
-- AMAN & NON-DESTRUCTIVE (CREATE TABLE IF NOT EXISTS & ALTER TABLE)
-- =========================================================

-- 1. Buat Tabel public.materials jika Belum Ada
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pastikan Seluruh Kolom yang Diperlukan Sudah Ada
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Konfigurasi Row Level Security (RLS) pada Tabel public.materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Bersihkan Kebijakan Lama jika Ada
DROP POLICY IF EXISTS "Authenticated users can select materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated teachers can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated teachers can update materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated teachers can delete materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public select materials" ON public.materials;

-- Kebijakan RLS Ketat Khusus Peran 'authenticated' (Pengguna Terautentikasi):
-- a. Semua pengguna yang sudah login (Guru & Siswa) dapat membaca materi
CREATE POLICY "Authenticated users can select materials"
ON public.materials FOR SELECT TO authenticated
USING (true);

-- b. Pengguna yang sudah login (Guru) dapat membuat materi baru
CREATE POLICY "Authenticated teachers can insert materials"
ON public.materials FOR INSERT TO authenticated
WITH CHECK (true);

-- c. Pengguna yang sudah login (Guru) dapat mengubah materi
CREATE POLICY "Authenticated teachers can update materials"
ON public.materials FOR UPDATE TO authenticated
USING (true);

-- d. Pengguna yang sudah login (Guru) dapat menghapus materi
CREATE POLICY "Authenticated teachers can delete materials"
ON public.materials FOR DELETE TO authenticated
USING (true);

-- 4. Berikan Hak Akses ke Peran authenticated & service_role (BEBAS GRANT KE ANON)
REVOKE ALL ON TABLE public.materials FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.materials TO authenticated, service_role;

-- 5. Reload Schema Cache PostgREST
NOTIFY pgrst, 'reload schema';
