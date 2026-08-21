-- =========================================================
-- EduVerse LMS - Assignments, Submissions & Storage Setup
-- File: supabase/13_assignments_and_submissions.sql
-- =========================================================

-- 1. Create public.assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  attachment_url TEXT,
  max_score NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create public.submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score NUMERIC NULL,
  feedback TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_assignment_submission UNIQUE (assignment_id, student_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for public.assignments
DROP POLICY IF EXISTS "Authenticated users can select assignments" ON public.assignments;
CREATE POLICY "Authenticated users can select assignments"
ON public.assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated teachers can insert assignments" ON public.assignments;
CREATE POLICY "Authenticated teachers can insert assignments"
ON public.assignments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated teachers can update assignments" ON public.assignments;
CREATE POLICY "Authenticated teachers can update assignments"
ON public.assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated teachers can delete assignments" ON public.assignments;
CREATE POLICY "Authenticated teachers can delete assignments"
ON public.assignments FOR DELETE TO authenticated USING (true);

-- 5. RLS Policies for public.submissions
DROP POLICY IF EXISTS "Authenticated users can select submissions" ON public.submissions;
CREATE POLICY "Authenticated users can select submissions"
ON public.submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated students can insert submissions" ON public.submissions;
CREATE POLICY "Authenticated students can insert submissions"
ON public.submissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated students can update submissions" ON public.submissions;
CREATE POLICY "Authenticated students can update submissions"
ON public.submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated teachers can delete submissions" ON public.submissions;
CREATE POLICY "Authenticated teachers can delete submissions"
ON public.submissions FOR DELETE TO authenticated USING (true);

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;

-- 7. Supabase Storage: Bucket student-submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Storage RLS Policies for student-submissions
DROP POLICY IF EXISTS "Allow Uploads to student-submissions bucket" ON storage.objects;
CREATE POLICY "Allow Uploads to student-submissions bucket"
ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK (bucket_id = 'student-submissions');

DROP POLICY IF EXISTS "Allow Read on student-submissions bucket" ON storage.objects;
CREATE POLICY "Allow Read on student-submissions bucket"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'student-submissions');

DROP POLICY IF EXISTS "Allow Update on student-submissions bucket" ON storage.objects;
CREATE POLICY "Allow Update on student-submissions bucket"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student-submissions') WITH CHECK (bucket_id = 'student-submissions');

NOTIFY pgrst, 'reload schema';
