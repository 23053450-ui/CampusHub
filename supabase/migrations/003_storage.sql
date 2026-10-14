-- =============================================================================
-- Migration: 003_storage.sql
-- Description: Supabase Storage buckets and access policies
-- =============================================================================

-- 1. Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('public-attachments', 'public-attachments', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('subject-notes', 'subject-notes', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for `public-attachments`
-- Anyone (including public / authenticated) can read
CREATE POLICY "Public read on public-attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-attachments');

-- Authenticated users can upload to public-attachments within their own folder
CREATE POLICY "Users can upload to their own folder in public-attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-attachments' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete own files in public-attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'public-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- 3. Storage Policies for `subject-notes`
-- Private bucket: readable if owner OR if associated note is shared & approved
CREATE POLICY "Private read on subject-notes for owner or approved shared"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'subject-notes' AND (
      (auth.uid()::text = (storage.foldername(name))[1])
      OR
      EXISTS (
        SELECT 1 FROM public.notes
        WHERE notes.storage_path = name
          AND notes.is_shared = true
          AND notes.is_approved = true
      )
    )
  );

-- Authenticated users can upload notes into their own subfolder
CREATE POLICY "Users can upload own notes to subject-notes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'subject-notes' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Users can delete own files in subject-notes
CREATE POLICY "Users can delete own notes in subject-notes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'subject-notes' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );
