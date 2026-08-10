-- =========================================================
-- EduVerse LMS - Production Migration & Constraint Fix
-- File: supabase/09_drop_not_null_constraints.sql
-- AMAN & NON-DESTRUCTIVE (ALTER TABLE ... DROP NOT NULL)
-- =========================================================

-- 1. Hilangkan Not-Null Constraint pada school_id dan course_id agar pembuatan kelas tidak gagal 23502
ALTER TABLE public.classes ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE public.classes ALTER COLUMN course_id DROP NOT NULL;

-- 2. Tambah Kolom yang Diperlukan pada Tabel public.classes (Jika Belum Ada)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS jurusan TEXT DEFAULT 'Semua Jurusan';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Ganjil';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Tambah Kolom yang Diperlukan pada Tabel public.enrollments (Jika Belum Ada)
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Aktifkan Row Level Security (RLS) pada Tabel classes & enrollments
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 5. Bersihkan Kebijakan Lama jika ada
DROP POLICY IF EXISTS "Allow public select classes" ON public.classes;
DROP POLICY IF EXISTS "Allow authenticated insert classes" ON public.classes;
DROP POLICY IF EXISTS "Allow authenticated update classes" ON public.classes;
DROP POLICY IF EXISTS "Allow public read access to classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can select classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can update classes" ON public.classes;

DROP POLICY IF EXISTS "Allow authenticated select enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow authenticated insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow authenticated delete enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Authenticated users can select enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Authenticated users can insert enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Authenticated users can delete enrollments" ON public.enrollments;

-- 6. Kebijakan RLS Ketat Khusus Peran 'authenticated' (Pengguna yang Sudah Login)

-- A. Kebijakan Tabel public.classes:
CREATE POLICY "Authenticated users can select classes"
ON public.classes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update classes"
ON public.classes FOR UPDATE TO authenticated
USING (true);

-- B. Kebijakan Tabel public.enrollments:
CREATE POLICY "Authenticated users can select enrollments"
ON public.enrollments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert enrollments"
ON public.enrollments FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete enrollments"
ON public.enrollments FOR DELETE TO authenticated
USING (true);

-- 7. Hak Akses (GRANT): Hanya Berikan ke Peran authenticated & service_role (TIDAK ADA GRANT KE ANON)
REVOKE ALL ON TABLE public.classes FROM anon;
REVOKE ALL ON TABLE public.enrollments FROM anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.classes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enrollments TO authenticated, service_role;

-- 8. Reload Schema Cache PostgREST
NOTIFY pgrst, 'reload schema';
