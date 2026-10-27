-- =============================================================================
-- Migration: security_hardening.sql
-- Description: Server-side tampering prevention for comments, profiles, and posts
-- Owner: Platform Security & Core Team
-- =============================================================================

-- 1. Guard comment updates from tampering with counters, author, post, parent, or depth
CREATE OR REPLACE FUNCTION public.guard_comment_update()
RETURNS trigger AS $$
BEGIN
  -- Immutable fields frozen on update
  NEW.upvotes    := OLD.upvotes;
  NEW.downvotes  := OLD.downvotes;
  NEW.author_id  := OLD.author_id;
  NEW.post_id    := OLD.post_id;
  NEW.parent_id  := OLD.parent_id;
  NEW.depth      := OLD.depth;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_comment_update ON public.comments;
CREATE TRIGGER trg_guard_comment_update
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.guard_comment_update();

-- 2. Guard profile updates: freeze id, role, and created_at; strictly validate handle
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger AS $$
DECLARE
  v_clean text;
BEGIN
  -- Disallow direct escalation of role or id through client UPDATE
  NEW.id         := OLD.id;
  NEW.role       := OLD.role;
  NEW.created_at := OLD.created_at;

  -- If handle is being updated, enforce uniqueness, format, and reserved keyword rules
  IF NEW.handle IS DISTINCT FROM OLD.handle THEN
    v_clean := LOWER(TRIM(NEW.handle));
    IF v_clean LIKE '@%' THEN
      v_clean := SUBSTRING(v_clean FROM 2);
    END IF;

    IF NOT (v_clean ~ '^[a-z0-9_]{4,20}$') THEN
      RAISE EXCEPTION 'Invalid username: must be 4–20 alphanumeric characters or underscores.'
        USING ERRCODE = 'check_violation';
    END IF;

    IF v_clean IN ('admin', 'moderator', 'system', 'campushub', 'support', 'anonymous', 'null', 'undefined', 'root', 'staff') THEN
      RAISE EXCEPTION 'Username "%" is reserved and cannot be claimed.', v_clean
        USING ERRCODE = 'check_violation';
    END IF;

    NEW.handle := v_clean;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_profile_update ON public.profiles;
CREATE TRIGGER trg_guard_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

-- 3. Hard ceiling limits on post bodies to prevent storage DOS attacks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_posts_body_length'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT chk_posts_body_length
      CHECK (body IS NULL OR char_length(body) <= 50000);
  END IF;
END $$;

