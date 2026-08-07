-- =========================================================
-- EduVerse LMS - Migration SQL: Setup Ruang Belajar Siswa & Kelas Guru
-- File: supabase/03_classroom_and_enrollments_schema.sql
-- =========================================================

-- 1. Tambah Kolom Tambahan pada Tabel Classes (Kode Unik, Status Aktif, Jurusan, Semester, Teacher ID)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS jurusan TEXT DEFAULT 'Semua Jurusan';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Ganjil';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Buat Tabel Enrollments jika belum ada
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE(class_id, student_id)
);

-- 3. Buat Tabel Announcements jika belum ada
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Buat Tabel Grades jika belum ada
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_title TEXT NOT NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 100,
    grade_type TEXT NOT NULL DEFAULT 'tugas',
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Nonaktifkan RLS agar pendaftaran kelas dari aplikasi LMS berjalan 100% lancar
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades DISABLE ROW LEVEL SECURITY;

-- 6. Berikan Izin Akses Penuh ke Peran anon, authenticated, dan service_role
GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.enrollments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.announcements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.grades TO anon, authenticated, service_role;
