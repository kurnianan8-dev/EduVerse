-- =========================================================
-- EduVerse LMS - Migration SQL: Fix Join Class & Enrollments
-- File: supabase/04_fix_join_class_and_enrollments.sql
-- =========================================================

-- 1. Pastikan Kolom code dan class_code Ada pada Tabel classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS class_code TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS jurusan TEXT DEFAULT 'Semua Jurusan';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Ganjil';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Sinkronkan kolom code dan class_code jika salah satu bernilai NULL
UPDATE public.classes SET class_code = code WHERE class_code IS NULL AND code IS NOT NULL;
UPDATE public.classes SET code = class_code WHERE code IS NULL AND class_code IS NOT NULL;

-- 2. Pastikan Tabel enrollments Memiliki Kolom class_id, student_id, user_id, joined_at, enrolled_at, status
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active'
);

-- Tambahkan kolom jika belum ada
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Sinkronkan student_id dan user_id
UPDATE public.enrollments SET user_id = student_id WHERE user_id IS NULL AND student_id IS NOT NULL;
UPDATE public.enrollments SET student_id = user_id WHERE student_id IS NULL AND user_id IS NOT NULL;

-- 3. Kebijakan Keamanan RLS (Row Level Security) & Hak Akses Penuh
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.enrollments TO anon, authenticated, service_role;
