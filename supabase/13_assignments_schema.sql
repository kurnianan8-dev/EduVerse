-- =========================================================
-- EduVerse LMS - Schema Assignments & Submissions
-- File: supabase/13_assignments_schema.sql
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
  file_url TEXT,
  file_name TEXT,
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
  grade NUMERIC NULL,
  feedback TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_assignment_submission UNIQUE (assignment_id, student_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for public.assignments
DROP POLICY IF EXISTS "Allow teachers to insert assignments for owned classes" ON public.assignments;
CREATE POLICY "Allow teachers to insert assignments for owned classes"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Allow teachers to manage owned assignments" ON public.assignments;
CREATE POLICY "Allow teachers to manage owned assignments"
ON public.assignments FOR ALL TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Allow enrolled students and teachers to view assignments" ON public.assignments;
CREATE POLICY "Allow enrolled students and teachers to view assignments"
ON public.assignments FOR SELECT TO authenticated
USING (
  auth.uid() = teacher_id OR
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.class_id = public.assignments.class_id
    AND (e.student_id = auth.uid() OR e.user_id = auth.uid())
  )
);

-- 5. RLS Policies for public.submissions
DROP POLICY IF EXISTS "Allow students to insert/update own submissions" ON public.submissions;
CREATE POLICY "Allow students to insert/update own submissions"
ON public.submissions FOR ALL TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Allow teachers to view and grade class submissions" ON public.submissions;
CREATE POLICY "Allow teachers to view and grade class submissions"
ON public.submissions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = public.submissions.assignment_id
    AND a.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = public.submissions.assignment_id
    AND a.teacher_id = auth.uid()
  )
);

-- 6. Storage Bucket student-submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-submissions', 'student-submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow Uploads to student-submissions bucket" ON storage.objects;
CREATE POLICY "Allow Uploads to student-submissions bucket"
ON storage.objects FOR INSERT TO authenticated, anon
WITH CHECK (bucket_id = 'student-submissions');

DROP POLICY IF EXISTS "Allow Read on student-submissions bucket" ON storage.objects;
CREATE POLICY "Allow Read on student-submissions bucket"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'student-submissions');

-- 7. Grant Permissions & Reload Schema Cache
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;

NOTIFY pgrst, 'reload schema';
