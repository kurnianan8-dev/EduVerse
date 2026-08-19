-- =========================================================
-- EduVerse LMS - Final Materials Schema & RLS Policy
-- File: supabase/11_materials_rls_final.sql
-- =========================================================

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

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select materials"
ON public.materials;

CREATE POLICY "Authenticated users can select materials"
ON public.materials
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert materials"
ON public.materials;

CREATE POLICY "Authenticated users can insert materials"
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update materials"
ON public.materials;

CREATE POLICY "Authenticated users can update materials"
ON public.materials
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete materials"
ON public.materials;

CREATE POLICY "Authenticated users can delete materials"
ON public.materials
FOR DELETE
TO authenticated
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.materials
TO authenticated;

NOTIFY pgrst, 'reload schema';
