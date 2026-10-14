-- =============================================================================
-- Migration: subjects.sql
-- Description: Subjects workspace tables, RLS policies, and storage
-- Owner: Subjects Team
-- Note: 'notes' table and 'subject-notes' bucket are shared with Communities;
--       listed in AUDIT.md for architectural review.
-- =============================================================================

-- 1. NOTES (Academic notes & workspace resources)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    tag TEXT NOT NULL CHECK (tag IN ('Lecture', 'PYQ', 'Summary', 'My Notes')),
    is_shared BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes or approved shared notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (is_shared = true AND is_approved = true)
  );

CREATE POLICY "Users can create own notes without approving them"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    is_approved = false
  );

CREATE POLICY "Users cannot tamper with approval status on update"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    is_approved = (SELECT is_approved FROM public.notes WHERE id = notes.id)
  );

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Storage Bucket: subject-notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('subject-notes', 'subject-notes', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

CREATE POLICY "Users can upload own notes to subject-notes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'subject-notes' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Users can delete own notes in subject-notes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'subject-notes' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );
