-- =============================================================================
-- Migration: core.sql
-- Description: Core shared tables (profiles, subjects, enrollments) and security
-- Owner: Platform Core Team
-- =============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (bound to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, handle, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES RLS
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

-- 2. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SUBJECTS RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are readable by authenticated users"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- 3. USER_SUBJECTS (Enrollment)
CREATE TABLE IF NOT EXISTS public.user_subjects (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, subject_id)
);

-- USER_SUBJECTS RLS
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

-- 4. TOOL_RUNS (Audit & History)
CREATE TABLE IF NOT EXISTS public.tool_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    input_params JSONB,
    output_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TOOL_RUNS RLS
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tool runs"
  ON public.tool_runs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can record own tool runs"
  ON public.tool_runs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
