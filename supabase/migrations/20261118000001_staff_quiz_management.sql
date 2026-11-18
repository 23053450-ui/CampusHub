-- =============================================================================
-- Migration: 20261118000001_staff_quiz_management.sql
-- Description: Allow staff (admin and subject moderators) to insert and delete
--              quiz questions in daily_quiz_questions for their assigned subjects.
-- =============================================================================

-- 1. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_quiz_questions TO authenticated, service_role;

-- 2. INSERT POLICY FOR STAFF
DROP POLICY IF EXISTS "Staff can insert quiz questions" ON public.daily_quiz_questions;
CREATE POLICY "Staff can insert quiz questions"
  ON public.daily_quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  );

-- 3. DELETE POLICY FOR STAFF
DROP POLICY IF EXISTS "Staff can delete quiz questions" ON public.daily_quiz_questions;
CREATE POLICY "Staff can delete quiz questions"
  ON public.daily_quiz_questions FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  );
