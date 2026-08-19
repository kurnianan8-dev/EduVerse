-- =========================================================
-- EduVerse LMS - Create Supabase Storage "materials" Bucket & RLS Policies
-- File: supabase/12_create_storage_materials_bucket.sql
-- =========================================================

-- 1. Create Public Storage Bucket "materials"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  true,
  52428800, -- 50MB max file size
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public/Authenticated users can view and download materials
DROP POLICY IF EXISTS "Public Read Access for Materials" ON storage.objects;
CREATE POLICY "Public Read Access for Materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');

-- 4. Policy: Authenticated teachers/users can upload materials
DROP POLICY IF EXISTS "Authenticated Users Upload Materials" ON storage.objects;
CREATE POLICY "Authenticated Users Upload Materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- 5. Policy: Authenticated users can update materials
DROP POLICY IF EXISTS "Authenticated Users Update Materials" ON storage.objects;
CREATE POLICY "Authenticated Users Update Materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'materials')
WITH CHECK (bucket_id = 'materials');

-- 6. Policy: Authenticated users can delete materials
DROP POLICY IF EXISTS "Authenticated Users Delete Materials" ON storage.objects;
CREATE POLICY "Authenticated Users Delete Materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');

NOTIFY pgrst, 'reload schema';
