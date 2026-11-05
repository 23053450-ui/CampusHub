-- =============================================================================
-- Migration: 20261105000001_fix_profile_privacy_permissions.sql
-- Description: Grant column-level UPDATE on privacy fields and add update_user_privacy RPC
-- =============================================================================

-- 1. Grant update permissions on privacy columns to authenticated users
GRANT UPDATE (is_private, privacy_onboarding_completed) ON public.profiles TO authenticated;

-- 2. Secure RPC to update user privacy preference
CREATE OR REPLACE FUNCTION public.update_user_privacy(p_is_private boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.profiles
  SET 
    is_private = p_is_private,
    privacy_onboarding_completed = true
  WHERE id = auth.uid();
END;
$$;

-- 3. Grant execute on RPC
GRANT EXECUTE ON FUNCTION public.update_user_privacy(boolean) TO authenticated;

