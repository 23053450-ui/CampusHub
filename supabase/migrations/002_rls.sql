-- =============================================================================
-- Migration: 002_rls.sql
-- Description: Row Level Security (RLS) policies and atomic functions
-- =============================================================================

-- 1. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can only update their own non-privileged profile data"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- 2. SUBJECTS RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are readable by authenticated users"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- 3. USER_SUBJECTS RLS
ALTER TABLE public.user_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all enrollments"
  ON public.user_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can enroll themselves in subjects"
  ON public.user_subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unenroll themselves from subjects"
  ON public.user_subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. POSTS RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are readable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Guard post updates from tampering with counters or author
CREATE OR REPLACE FUNCTION public.guard_post_update()
RETURNS trigger AS $$
BEGIN
  NEW.upvotes     := OLD.upvotes;
  NEW.downvotes   := OLD.downvotes;
  NEW.reply_count := OLD.reply_count;
  NEW.author_id   := OLD.author_id;
  NEW.subject_id  := OLD.subject_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_post_update ON public.posts;
CREATE TRIGGER trg_guard_post_update
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.guard_post_update();

-- 5. POST_VOTES RLS & ATOMIC RPC
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view votes"
  ON public.post_votes FOR SELECT
  TO authenticated
  USING (true);

-- Lock direct modifications by authenticated clients
REVOKE INSERT, UPDATE, DELETE ON public.post_votes FROM authenticated;

-- Atomic vote procedure with counter recalculation
CREATE OR REPLACE FUNCTION public.vote_post(p_post_id UUID, p_vote_value SMALLINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_old_vote SMALLINT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  IF p_vote_value IS NOT NULL AND p_vote_value NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Invalid vote value';
  END IF;

  SELECT vote INTO v_old_vote
  FROM public.post_votes
  WHERE post_id = p_post_id AND user_id = v_user_id;

  IF p_vote_value IS NULL THEN
    DELETE FROM public.post_votes WHERE post_id = p_post_id AND user_id = v_user_id;
  ELSE
    INSERT INTO public.post_votes (post_id, user_id, vote)
    VALUES (p_post_id, v_user_id, p_vote_value)
    ON CONFLICT (post_id, user_id)
    DO UPDATE SET vote = p_vote_value;
  END IF;

  -- Recompute counters safely
  UPDATE public.posts
  SET
    upvotes = (SELECT count(*) FROM public.post_votes WHERE post_id = p_post_id AND vote = 1),
    downvotes = (SELECT count(*) FROM public.post_votes WHERE post_id = p_post_id AND vote = -1)
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_post(UUID, SMALLINT) TO authenticated;

-- 6. COMMENTS RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are readable by authenticated users"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- 7. NOTES RLS (Approval & isolation)
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

-- 8. TOOL_RUNS RLS
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tool runs"
  ON public.tool_runs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can record own tool runs"
  ON public.tool_runs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
