-- =============================================================================
-- Migration: 20261118000002_adjust_hot_score_decay.sql
-- Description: Adjusts hot_score time decay half-life from 12.5 hours (45,000s)
--              to 30 days (2,592,000s) to better fit campus community discussions.
-- =============================================================================

-- Update calculation function with 30-day time decay divisor (2,592,000 seconds)
CREATE OR REPLACE FUNCTION public.calculate_hot_score(
  p_upvotes INT,
  p_downvotes INT,
  p_reply_count INT,
  p_created_at TIMESTAMPTZ
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_net_score INT;
  v_order DOUBLE PRECISION;
  v_seconds DOUBLE PRECISION;
BEGIN
  v_net_score := (COALESCE(p_upvotes, 0) - COALESCE(p_downvotes, 0)) + (COALESCE(p_reply_count, 0) * 2);
  
  IF v_net_score > 0 THEN
    v_order := log(10, v_net_score);
  ELSIF v_net_score < 0 THEN
    v_order := -log(10, abs(v_net_score));
  ELSE
    v_order := 0;
  END IF;

  v_seconds := EXTRACT(EPOCH FROM COALESCE(p_created_at, timezone('utc'::text, now()))) - 1700000000;
  
  -- 2592000.0 seconds = 30 days
  RETURN round((v_order + (v_seconds / 2592000.0))::numeric, 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recalculate and backfill hot_score for all existing posts with new 30-day window
UPDATE public.posts
SET hot_score = public.calculate_hot_score(upvotes, downvotes, reply_count, created_at);
