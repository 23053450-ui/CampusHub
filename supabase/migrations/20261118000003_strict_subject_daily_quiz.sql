-- =============================================================================
-- Migration: 20261118000003_strict_subject_daily_quiz.sql
-- Description: Strictly limit daily quiz questions to the user's enrolled subjects.
--              Removes un-enrolled subject fallback so questions are drawn exclusively
--              from the subjects the student is currently enrolled in.
--              Also invalidates any unsubmitted today's assignment containing un-enrolled subjects.
-- =============================================================================

-- 1. Deterministic allocator: STRICTLY enrolled subjects
CREATE OR REPLACE FUNCTION public.compute_user_daily_quiz_ids(p_user_id UUID, p_quiz_date DATE)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_subjects TEXT[];
  v_subject_ids TEXT[] := '{}'::TEXT[];
BEGIN
  -- Collect user's enrolled subjects
  SELECT ARRAY_AGG(subject_id)
  INTO v_user_subjects
  FROM public.user_subjects
  WHERE user_id = p_user_id;

  -- Strictly select up to 5 questions from enrolled subjects only
  IF v_user_subjects IS NOT NULL AND CARDINALITY(v_user_subjects) > 0 THEN
    SELECT COALESCE(ARRAY_AGG(id), '{}'::TEXT[])
    INTO v_subject_ids
    FROM (
      WITH user_history AS (
        SELECT
          k AS qid,
          MAX(sub.quiz_date) AS last_seen_date
        FROM public.daily_quiz_submissions sub,
             jsonb_object_keys(sub.answers) AS k
        WHERE sub.user_id = p_user_id
        GROUP BY k
      )
      SELECT q.id
      FROM public.daily_quiz_questions q
      LEFT JOIN user_history h ON h.qid = q.id
      WHERE q.status = 'approved'
        AND q.subject_id = ANY(v_user_subjects)
      ORDER BY
        -- Unanswered questions first, then oldest answered questions
        COALESCE(p_quiz_date - h.last_seen_date, 99999) DESC,
        (CASE WHEN q.source = 'pyq' THEN 0 ELSE 1 END) ASC,
        md5(q.id || p_user_id::text || p_quiz_date::text) ASC
      LIMIT 5
    ) s;
  END IF;

  RETURN v_subject_ids;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compute_user_daily_quiz_ids(UUID, DATE) FROM PUBLIC, anon, authenticated;


-- 2. GET_TODAY_QUIZ RPC: Auto-invalidate stale unsubmitted assignments containing un-enrolled subjects
CREATE OR REPLACE FUNCTION public.get_today_quiz()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_already_submitted BOOLEAN := false;
  v_assigned_ids TEXT[];
  v_computed_ids TEXT[];
  v_questions JSONB := '[]'::jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Check if already completed today
  IF EXISTS (
    SELECT 1 FROM public.daily_quiz_submissions
    WHERE user_id = v_user_id AND quiz_date = v_today
  ) THEN
    v_already_submitted := true;
    -- Return locked submitted questions
    SELECT ARRAY(
      SELECT jsonb_object_keys(answers)
      FROM public.daily_quiz_submissions
      WHERE user_id = v_user_id AND quiz_date = v_today
      LIMIT 1
    ) INTO v_assigned_ids;
  ELSE
    -- Check existing snapshot assignment
    SELECT question_ids INTO v_assigned_ids
    FROM public.daily_quiz_assignments
    WHERE user_id = v_user_id AND quiz_date = v_today;

    -- If existing assignment has questions outside user's current enrolled subjects, invalidate it
    IF v_assigned_ids IS NOT NULL THEN
      IF EXISTS (
        SELECT 1
        FROM unnest(v_assigned_ids) AS qid
        JOIN public.daily_quiz_questions q ON q.id = qid
        WHERE NOT (q.subject_id IN (SELECT subject_id FROM public.user_subjects WHERE user_id = v_user_id))
      ) THEN
        DELETE FROM public.daily_quiz_assignments
        WHERE user_id = v_user_id AND quiz_date = v_today;
        v_assigned_ids := NULL;
      END IF;
    END IF;

    -- If not assigned yet or invalidated, compute strictly from enrolled subjects
    IF v_assigned_ids IS NULL THEN
      v_computed_ids := public.compute_user_daily_quiz_ids(v_user_id, v_today);

      IF CARDINALITY(v_computed_ids) > 0 THEN
        INSERT INTO public.daily_quiz_assignments (user_id, quiz_date, question_ids)
        VALUES (v_user_id, v_today, v_computed_ids)
        ON CONFLICT (user_id, quiz_date) DO UPDATE
          SET question_ids = EXCLUDED.question_ids;

        v_assigned_ids := v_computed_ids;
      END IF;
    END IF;
  END IF;

  -- Assemble question objects without correct_answer_index or explanation
  IF v_assigned_ids IS NOT NULL AND CARDINALITY(v_assigned_ids) > 0 THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'subject_id', q.subject_id,
          'question', q.question,
          'options', q.options,
          'difficulty', q.difficulty,
          'topic', q.topic
        )
        ORDER BY u.ord
      ),
      '[]'::jsonb
    )
    INTO v_questions
    FROM unnest(v_assigned_ids) WITH ORDINALITY AS u(id, ord)
    JOIN public.daily_quiz_questions q ON q.id = u.id;
  END IF;

  RETURN jsonb_build_object(
    'date', v_today::text,
    'already_submitted', v_already_submitted,
    'questions', v_questions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_quiz() TO authenticated;

NOTIFY pgrst, 'reload schema';
