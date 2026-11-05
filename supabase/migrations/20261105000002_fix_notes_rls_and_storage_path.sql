-- =============================================================================
-- Migration: 20261105000001_fix_notes_rls_and_storage_path.sql
-- Description: Allow personal text notes without storage files and harden RLS
-- =============================================================================

-- 1. Make storage_path nullable on public.notes to support personal markdown notes
ALTER TABLE public.notes ALTER COLUMN storage_path DROP NOT NULL;

-- 2. Update storage path owner constraint to allow NULL storage_path for personal notes
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS chk_notes_storage_path_owner;
ALTER TABLE public.notes
  ADD CONSTRAINT chk_notes_storage_path_owner
  CHECK (storage_path IS NULL OR (storage.foldername(storage_path))[1] = user_id::text);

-- 3. Replace RLS INSERT policy to accommodate personal text notes
DROP POLICY IF EXISTS "Users can insert their own notes with matching storage path" ON public.notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;

CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      -- Personal text notes: storage_path can be NULL or within user folder; never shared
      (
        tag = 'Private' AND
        (storage_path IS NULL OR (storage.foldername(storage_path))[1] = auth.uid()::text) AND
        is_shared = false
      )
      OR
      -- Community resources: must have a physical storage path within user folder and be pending review
      (
        tag <> 'Private' AND
        storage_path IS NOT NULL AND
        (storage.foldername(storage_path))[1] = auth.uid()::text AND
        status = 'pending' AND
        is_shared = false
      )
    )
  );

-- 4. Replace RLS UPDATE policy to allow personal notes without storage paths
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    (storage_path IS NULL OR (storage.foldername(storage_path))[1] = auth.uid()::text)
  );

-- 5. Replace RLS SELECT policy to protect private notes from unauthorized staff viewing
DROP POLICY IF EXISTS "Users can read own notes or shared community notes" ON public.notes;

CREATE POLICY "Users can read own notes or shared community notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (is_shared = true AND status = 'approved') OR
    (tag <> 'Private' AND (select public.is_staff_for(subject_id)))
  );

-- 6. Replace RLS DELETE policy to prevent staff from deleting private personal notes
DROP POLICY IF EXISTS "Users or staff can delete notes" ON public.notes;

CREATE POLICY "Users or staff can delete notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (tag <> 'Private' AND (select public.is_staff_for(subject_id)))
  );
