-- EduVerse LMS - Penambahan Tabel Absensi, Tugas, & Materi Pembelajaran

-- 1. Tambah Kolom Jurusan & QR Code pada Tabel Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jurusan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 2. Tabel Materi Pembelajaran (Materi)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Tugas (Assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Pengumpulan Tugas Siswa (Submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Sesi Absensi (Attendance Sessions)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Rekap Absensi Siswa (Attendance Records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'hadir',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Kebijakan Akses (RLS Non-blocking untuk Operasi Aplikasi)
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;
