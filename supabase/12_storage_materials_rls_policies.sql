-- =========================================================
-- EduVerse LMS - Supabase Storage "materials" Bucket & RLS Policies
-- File: supabase/12_storage_materials_rls_policies.sql
-- =========================================================

-- 1. Create Public Storage Bucket "materials" (if not existing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow authenticated & anon users to upload files to 'materials' bucket
DROP POLICY IF EXISTS "Allow Uploads to materials bucket" ON storage.objects;
CREATE POLICY "Allow Uploads to materials bucket"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'materials');

-- 3. Allow public read access to 'materials' bucket
DROP POLICY IF EXISTS "Allow Public Read on materials bucket" ON storage.objects;
CREATE POLICY "Allow Public Read on materials bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');

-- 4. Allow authenticated users to update objects in 'materials' bucket
DROP POLICY IF EXISTS "Allow Updates to materials bucket" ON storage.objects;
CREATE POLICY "Allow Updates to materials bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'materials')
WITH CHECK (bucket_id = 'materials');

-- 5. Allow authenticated users to delete objects in 'materials' bucket
DROP POLICY IF EXISTS "Allow Deletes from materials bucket" ON storage.objects;
CREATE POLICY "Allow Deletes from materials bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');

NOTIFY pgrst, 'reload schema';
