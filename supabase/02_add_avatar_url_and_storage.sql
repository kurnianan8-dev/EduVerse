-- =========================================================
-- EduVerse LMS - Migration SQL: Setup Profile Photo & Storage
-- File: supabase/02_add_avatar_url_and_storage.sql
-- =========================================================

-- 1. Tambah Kolom avatar_url pada Tabel Profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Buat Storage Bucket 'profile-photos' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Kebijakan Akses Storage (RLS Public Read & Authenticated Management)
DROP POLICY IF EXISTS "Public Read Access on profile-photos" ON storage.objects;
CREATE POLICY "Public Read Access on profile-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Authenticated Users Can Manage Profile Photos" ON storage.objects;
CREATE POLICY "Authenticated Users Can Manage Profile Photos"
ON storage.objects FOR ALL
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');
