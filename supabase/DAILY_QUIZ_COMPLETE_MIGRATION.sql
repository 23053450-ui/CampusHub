-- =============================================================================
-- CampusHub: Complete Daily Quiz & Question Bank Schema Setup
-- Run this in your Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1. DAILY QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.daily_quiz_questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_date DATE,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ai', 'pyq', 'manual')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
    topic TEXT,
    source_snippet TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_options CHECK (
        jsonb_typeof(options) = 'array'
        AND jsonb_array_length(options) >= 2
    ),
    CONSTRAINT valid_answer_index CHECK (
        correct_answer_index >= 0
        AND correct_answer_index < jsonb_array_length(options)
    )
);

-- Upgrade existing table if it was created in an earlier migration
ALTER TABLE public.daily_quiz_questions
    ALTER COLUMN quiz_date DROP NOT NULL;

ALTER TABLE public.daily_quiz_questions
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.daily_quiz_questions
    ADD COLUMN IF NOT EXISTS subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.daily_quiz_questions
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.daily_quiz_questions
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

ALTER TABLE public.daily_quiz_questions
    ADD COLUMN IF NOT EXISTS difficulty TEXT;

ALTER TABLE public.daily_quiz_questions
    ADD COLUMN IF NOT EXISTS topic TEXT;

ALTER TABLE public.daily_quiz_questions
    ADD COLUMN IF NOT EXISTS source_snippet TEXT;

CREATE INDEX IF NOT EXISTS idx_daily_quiz_questions_date
    ON public.daily_quiz_questions (quiz_date);

CREATE INDEX IF NOT EXISTS idx_daily_quiz_questions_subject_status
    ON public.daily_quiz_questions (subject_id, status);

CREATE INDEX IF NOT EXISTS idx_daily_quiz_questions_status
    ON public.daily_quiz_questions (status);


-- 2. USER QUIZ STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_completed_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_current_streak CHECK (current_streak >= 0),
    CONSTRAINT valid_best_streak CHECK (best_streak >= 0),
    CONSTRAINT best_streak_not_below_current CHECK (best_streak >= current_streak)
);


-- 3. DAILY QUIZ SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.daily_quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_date DATE NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::JSONB,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_quiz_score CHECK (
        score >= 0 AND score <= total_questions
    ),
    CONSTRAINT valid_total_questions CHECK (total_questions > 0),
    CONSTRAINT valid_submission_answers CHECK (
        jsonb_typeof(answers) = 'object'
    ),
    CONSTRAINT one_submission_per_user_per_day UNIQUE (user_id, quiz_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_quiz_submissions_user
    ON public.daily_quiz_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_daily_quiz_submissions_date
    ON public.daily_quiz_submissions (quiz_date);


-- 4. DAILY QUIZ ASSIGNMENTS TABLE (SNAPSHOT ISOLATION)
CREATE TABLE IF NOT EXISTS public.daily_quiz_assignments (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_date DATE NOT NULL,
    question_ids TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, quiz_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_quiz_assignments_user_date
    ON public.daily_quiz_assignments (user_id, quiz_date);


-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.daily_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quiz_assignments ENABLE ROW LEVEL SECURITY;

-- Questions RLS
DROP POLICY IF EXISTS "Staff can view quiz questions" ON public.daily_quiz_questions;
CREATE POLICY "Staff can view quiz questions"
  ON public.daily_quiz_questions FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  );

DROP POLICY IF EXISTS "Staff can update quiz questions" ON public.daily_quiz_questions;
CREATE POLICY "Staff can update quiz questions"
  ON public.daily_quiz_questions FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  )
  WITH CHECK (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  );

DROP POLICY IF EXISTS "Staff can insert quiz questions" ON public.daily_quiz_questions;
CREATE POLICY "Staff can insert quiz questions"
  ON public.daily_quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  );

DROP POLICY IF EXISTS "Staff can delete quiz questions" ON public.daily_quiz_questions;
CREATE POLICY "Staff can delete quiz questions"
  ON public.daily_quiz_questions FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    (subject_id IS NOT NULL AND public.is_staff_for(subject_id))
  );

-- User Streaks RLS
DROP POLICY IF EXISTS "Users can read their own quiz streak" ON public.user_streaks;
CREATE POLICY "Users can read their own quiz streak"
    ON public.user_streaks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- User Submissions RLS
DROP POLICY IF EXISTS "Users can read their own quiz submissions" ON public.daily_quiz_submissions;
CREATE POLICY "Users can read their own quiz submissions"
    ON public.daily_quiz_submissions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Assignments RLS (revoked from client, accessed by Security Definer RPC)
REVOKE ALL ON public.daily_quiz_assignments FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.daily_quiz_assignments TO service_role;


-- 6. INTERNAL DETERMINISTIC QUESTION ALLOCATION HELPER (MAXIMUM RECENCY SPACING)
CREATE OR REPLACE FUNCTION public.compute_user_daily_quiz_ids(p_user_id UUID, p_quiz_date DATE)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_subjects TEXT[];
  v_subject_ids TEXT[] := '{}'::TEXT[];
  v_general_ids TEXT[] := '{}'::TEXT[];
  v_needed INT := 5;
BEGIN
  -- Collect user's enrolled subjects
  SELECT ARRAY_AGG(subject_id)
  INTO v_user_subjects
  FROM public.user_subjects
  WHERE user_id = p_user_id;

  -- 1. Candidate questions from enrolled subjects
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
        -- Unanswered questions come first (99999 days since last seen)
        -- Answered questions ordered by maximum days since last seen (longest ago first)
        COALESCE(p_quiz_date - h.last_seen_date, 99999) DESC,
        (CASE WHEN q.source = 'pyq' THEN 0 ELSE 1 END) ASC,
        md5(q.id || p_user_id::text || p_quiz_date::text) ASC
      LIMIT 5
    ) s;
  END IF;

  v_needed := 5 - CARDINALITY(v_subject_ids);

  -- 2. Top-up from general approved pool if user subjects yielded fewer than 5
  IF v_needed > 0 THEN
    SELECT COALESCE(ARRAY_AGG(id), '{}'::TEXT[])
    INTO v_general_ids
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
        AND NOT (q.id = ANY(v_subject_ids))
      ORDER BY
        COALESCE(p_quiz_date - h.last_seen_date, 99999) DESC,
        (CASE WHEN q.source = 'pyq' THEN 0 ELSE 1 END) ASC,
        md5(q.id || p_user_id::text || p_quiz_date::text) ASC
      LIMIT v_needed
    ) g;
  END IF;

  RETURN (v_subject_ids || v_general_ids);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compute_user_daily_quiz_ids(UUID, DATE) FROM PUBLIC, anon, authenticated;


-- 7. GET_TODAY_QUIZ RPC (SECURITY DEFINER)
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
  v_questions JSONB := '[]'::JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Check if user already submitted today
  SELECT EXISTS (
    SELECT 1 FROM public.daily_quiz_submissions
    WHERE user_id = v_user_id AND quiz_date = v_today
  ) INTO v_already_submitted;

  IF v_already_submitted THEN
    -- Read the exact question IDs from today's submission
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

    -- If not assigned yet, compute and snapshot
    IF v_assigned_ids IS NULL THEN
      v_computed_ids := public.compute_user_daily_quiz_ids(v_user_id, v_today);

      IF CARDINALITY(v_computed_ids) > 0 THEN
        INSERT INTO public.daily_quiz_assignments (user_id, quiz_date, question_ids)
        VALUES (v_user_id, v_today, v_computed_ids)
        ON CONFLICT (user_id, quiz_date) DO NOTHING;

        SELECT question_ids INTO v_assigned_ids
        FROM public.daily_quiz_assignments
        WHERE user_id = v_user_id AND quiz_date = v_today;
      END IF;

      IF v_assigned_ids IS NULL THEN
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


-- 8. SUBMIT_DAILY_QUIZ RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.submit_daily_quiz(p_answers JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_yesterday DATE := v_today - 1;
  v_assigned_ids TEXT[];
  v_assigned_count INT;
  v_submitted_ids TEXT[];
  v_submitted_count INT;
  v_score INT := 0;
  v_cur_streak INT := 0;
  v_best_streak INT := 0;
  v_last_date DATE;
  v_new_streak INT := 1;
  v_new_best INT := 1;
  v_details JSONB := '{}'::jsonb;
  r_qid TEXT;
  r_q RECORD;
  v_selected_idx INT;
  v_is_correct BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RAISE EXCEPTION 'Answers must be a JSON object mapping question IDs to option indexes.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Enforce one submission per day
  IF EXISTS (
    SELECT 1 FROM public.daily_quiz_submissions
    WHERE user_id = v_user_id AND quiz_date = v_today
  ) THEN
    RAISE EXCEPTION 'Daily quiz has already been completed for today.'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Read today's assigned snapshot
  SELECT question_ids INTO v_assigned_ids
  FROM public.daily_quiz_assignments
  WHERE user_id = v_user_id AND quiz_date = v_today;

  v_assigned_ids := COALESCE(v_assigned_ids, '{}'::TEXT[]);
  v_assigned_count := CARDINALITY(v_assigned_ids);

  IF v_assigned_count = 0 THEN
    RAISE EXCEPTION 'No daily quiz assignment found for today. Please initiate the quiz first.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Extract submitted question IDs
  SELECT COALESCE(ARRAY_AGG(k), '{}'::TEXT[])
  INTO v_submitted_ids
  FROM jsonb_object_keys(p_answers) AS k;

  v_submitted_count := CARDINALITY(v_submitted_ids);

  -- Validate exact question ID match
  IF v_submitted_count <> v_assigned_count
     OR NOT (v_assigned_ids <@ v_submitted_ids AND v_submitted_ids <@ v_assigned_ids) THEN
    RAISE EXCEPTION 'Submitted questions do not match today''s assigned quiz.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Validate answer values are numbers
  FOREACH r_qid IN ARRAY v_assigned_ids LOOP
    IF jsonb_typeof(p_answers->r_qid) <> 'number' THEN
      RAISE EXCEPTION 'Answer for question % must be a number.', r_qid
        USING ERRCODE = 'invalid_parameter_value';
    END IF;
  END LOOP;

  -- Score against the locked snapshot
  FOR r_q IN
    SELECT q.id, q.correct_answer_index, q.explanation
    FROM public.daily_quiz_questions q
    WHERE q.id = ANY(v_assigned_ids)
  LOOP
    v_selected_idx := (p_answers->>r_q.id)::INT;
    v_is_correct := (v_selected_idx = r_q.correct_answer_index);

    IF v_is_correct THEN
      v_score := v_score + 1;
    END IF;

    v_details := jsonb_set(
      v_details,
      ARRAY[r_q.id],
      jsonb_build_object(
        'is_correct', v_is_correct,
        'correct_answer_index', r_q.correct_answer_index,
        'explanation', r_q.explanation
      )
    );
  END LOOP;

  -- Fetch current user streak info
  SELECT current_streak, best_streak, last_completed_date
  INTO v_cur_streak, v_best_streak, v_last_date
  FROM public.user_streaks
  WHERE user_id = v_user_id;

  -- Calculate new streaks based on IST dates
  IF v_last_date = v_yesterday THEN
    v_new_streak := COALESCE(v_cur_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_new_best := GREATEST(COALESCE(v_best_streak, 0), v_new_streak);

  -- Upsert streak record
  INSERT INTO public.user_streaks (
    user_id,
    current_streak,
    best_streak,
    last_completed_date,
    updated_at
  ) VALUES (
    v_user_id,
    v_new_streak,
    v_new_best,
    v_today,
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    best_streak = EXCLUDED.best_streak,
    last_completed_date = EXCLUDED.last_completed_date,
    updated_at = EXCLUDED.updated_at;

  -- Record submission row
  INSERT INTO public.daily_quiz_submissions (
    user_id,
    quiz_date,
    score,
    total_questions,
    answers,
    completed_at
  ) VALUES (
    v_user_id,
    v_today,
    v_score,
    v_assigned_count,
    p_answers,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object(
    'score', v_score,
    'total', v_assigned_count,
    'streak_count', v_new_streak,
    'details', v_details
  );
END;
$$;


-- 9. PERMISSIONS & GRANTS
GRANT EXECUTE ON FUNCTION public.get_today_quiz() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_today_quiz() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_daily_quiz(JSONB) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.submit_daily_quiz(JSONB) FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_quiz_questions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_streaks TO authenticated, service_role;
GRANT SELECT, INSERT ON public.daily_quiz_submissions TO authenticated, service_role;


-- 10. SEED INITIAL APPROVED QUESTIONS (10 QUESTIONS)
INSERT INTO public.daily_quiz_questions (
  id,
  subject_id,
  question,
  options,
  correct_answer_index,
  explanation,
  source,
  status,
  difficulty,
  topic,
  source_snippet
)
VALUES
  (
    'dbms-001',
    'dbms',
    'Which normal form deals with removing transitive dependencies?',
    '["1NF", "2NF", "3NF", "BCNF"]'::jsonb,
    2,
    'Third Normal Form (3NF) requires removing transitive dependencies, ensuring non-prime attributes depend strictly on candidate keys.',
    'pyq',
    'approved',
    'medium',
    'Normalization',
    '3NF eliminates functional dependency X -> A where X is not a superkey and A is non-prime.'
  ),
  (
    'dbms-002',
    'dbms',
    'What does the "I" in ACID properties of transactions stand for, and what does it ensure?',
    '["Integrity: Data remains valid across crashes", "Isolation: Transactions execute concurrently without interference", "Indexability: All table records are quickly searchable", "Immutability: Committed records cannot be modified"]'::jsonb,
    1,
    'Isolation guarantees that concurrent execution of transactions leaves the database in the same state that would have been obtained if the transactions were executed sequentially.',
    'manual',
    'approved',
    'easy',
    'Transactions',
    'Isolation prevents uncommitted changes in one transaction from being visible to other transactions.'
  ),
  (
    'cn-001',
    'cn',
    'Which layer in the OSI model is responsible for end-to-end packet routing across networks?',
    '["Data Link Layer", "Transport Layer", "Network Layer", "Session Layer"]'::jsonb,
    2,
    'The Network Layer (Layer 3) handles logical addressing (IP) and routing packets across intermediate networks.',
    'pyq',
    'approved',
    'easy',
    'OSI Model',
    'Layer 3 determines the best path to move packets from source to destination across multiple networks.'
  ),
  (
    'cn-002',
    'cn',
    'In TCP congestion control, what triggers the Fast Retransmit mechanism?',
    '["Arrival of 3 duplicate ACKs", "A retransmission timer timeout", "A packet corruption checksum error", "An explicit ICMP Quench message"]'::jsonb,
    0,
    'Receipt of three duplicate ACKs informs TCP that a packet was lost without having to wait for the retransmission timeout to expire.',
    'pyq',
    'approved',
    'hard',
    'Congestion Control',
    'Fast Retransmit: 3 duplicate ACKs prompt retransmission of missing segment before timer expiration.'
  ),
  (
    'os-001',
    'os',
    'Which of the following is NOT one of Coffman''s four conditions for deadlock?',
    '["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"]'::jsonb,
    2,
    'The condition is "No Preemption" (resources cannot be forcibly taken). Preemption actually breaks deadlock.',
    'pyq',
    'approved',
    'medium',
    'Deadlocks',
    'Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.'
  ),
  (
    'os-002',
    'os',
    'What is Belady''s Anomaly in operating systems page replacement algorithms?',
    '["More page frames can cause more page faults in FIFO", "LRU degrades to O(n) under heavy thrashing", "Virtual memory exceeds physical memory size", "A process deadlocks while waiting for disk I/O"]'::jsonb,
    0,
    'Belady''s Anomaly is the phenomenon in which increasing the number of page frames results in an increase in the number of page faults for certain access patterns using FIFO.',
    'manual',
    'approved',
    'medium',
    'Memory Management',
    'FIFO replacement algorithm can suffer from Belady''s anomaly where increasing frames increases faults.'
  ),
  (
    'dsa-001',
    'dsa',
    'What is the worst-case time complexity of finding an element in an unweighted Red-Black Tree with n nodes?',
    '["O(1)", "O(log n)", "O(n)", "O(n log n)"]'::jsonb,
    1,
    'Red-Black Trees maintain a balanced height of at most 2 * log2(n + 1), guaranteeing worst-case search in O(log n).',
    'pyq',
    'approved',
    'medium',
    'Balanced Search Trees',
    'Search in a Red-Black tree has an absolute upper bound of O(log n) time.'
  ),
  (
    'dsa-002',
    'dsa',
    'Which sorting algorithm achieves O(n) time complexity for sorting integers in a known small range [0..k]?',
    '["Merge Sort", "Counting Sort", "Quick Sort", "Heap Sort"]'::jsonb,
    1,
    'Counting sort runs in O(n + k) time by counting frequencies of each key, achieving linear time when k = O(n).',
    'manual',
    'approved',
    'easy',
    'Sorting Algorithms',
    'Counting Sort sorts elements in O(n + k) without comparison.'
  ),
  (
    'daa-001',
    'daa',
    'Which algorithmic design paradigm does Dijkstra''s Single-Source Shortest Path algorithm follow?',
    '["Dynamic Programming", "Greedy Method", "Divide and Conquer", "Backtracking"]'::jsonb,
    1,
    'Dijkstra''s algorithm iteratively makes the locally optimal choice by picking the unvisited node with minimum tentative distance (Greedy).',
    'pyq',
    'approved',
    'easy',
    'Graph Algorithms',
    'Dijkstra algorithm is a greedy algorithm solving single source shortest path for non-negative weights.'
  ),
  (
    'dm-001',
    'dm',
    'If a relation R on set A is reflexive, symmetric, and transitive, what is R classified as?',
    '["Partial Order Relation", "Equivalence Relation", "Strict Order", "Bijective Mapping"]'::jsonb,
    1,
    'A binary relation that satisfies reflexivity, symmetry, and transitivity is defined as an Equivalence Relation.',
    'manual',
    'approved',
    'easy',
    'Set Theory & Relations',
    'Equivalence relation: reflexive, symmetric, and transitive.'
  )
ON CONFLICT (id) DO NOTHING;


-- 11. REFRESH POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
