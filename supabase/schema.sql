-- =============================================================================
-- CampusHub — Consolidated Database Schema Reference
-- Purpose: Flat, human-readable reference for developers and AI agents.
-- =============================================================================

-- TABLE: profiles
-- Bound to Supabase auth.users(id)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- RLS:
-- SELECT: Authenticated users can read any profile.
-- UPDATE: Users can only update their own row; role escalation is blocked.

-- TABLE: subjects
CREATE TABLE public.subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- RLS:
-- SELECT: Authenticated users can read all subjects.

-- TABLE: user_subjects (Enrollments)
CREATE TABLE public.user_subjects (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, subject_id)
);
-- RLS:
-- SELECT: Authenticated users can read enrollments.
-- INSERT: Authenticated users can enroll only themselves (user_id = auth.uid()).
-- DELETE: Authenticated users can unenroll only themselves (user_id = auth.uid()).

-- TABLE: posts (Community Forum)
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    upvotes INT NOT NULL DEFAULT 0,
    downvotes INT NOT NULL DEFAULT 0,
    reply_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- RLS:
-- SELECT: Authenticated users can view all posts.
-- INSERT: Authenticated users can create posts with author_id = auth.uid().
-- UPDATE/DELETE: Only post author can modify/delete; counter tampering is prevented by guard_post_update trigger.

-- TABLE: post_votes
CREATE TABLE public.post_votes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (post_id, user_id)
);
-- Direct INSERT/UPDATE/DELETE revoked for authenticated users!
-- Must call stored procedure: vote_post(p_post_id UUID, p_vote_value SMALLINT)

-- FUNCTION: vote_post(UUID, SMALLINT)
-- Atomically updates post_votes and recomputes upvotes/downvotes in posts table.

-- TABLE: comments
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Trigger automatically maintains posts.reply_count.
-- RLS:
-- SELECT: Authenticated users can view comments.
-- INSERT: Authenticated users can create comments with author_id = auth.uid().
-- UPDATE/DELETE: Only comment author can modify/delete.

-- TABLE: notes (Resources)
CREATE TABLE public.notes (
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
-- RLS:
-- SELECT: user_id = auth.uid() OR (is_shared = true AND is_approved = true)
-- INSERT: user_id = auth.uid() AND is_approved = false
-- UPDATE: user_id = auth.uid() AND is_approved unchanged (no self-approval)
-- DELETE: user_id = auth.uid()

-- TABLE: tool_runs
CREATE TABLE public.tool_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    input_params JSONB,
    output_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- RLS:
-- SELECT/INSERT: user_id = auth.uid()

-- STORAGE BUCKETS:
-- 1. 'public-attachments': Public read, authenticated write (scoped to <user_id>/<filename>), max 2MB, images only.
-- 2. 'subject-notes': Private, max 5MB, PDF only, path: <user_id>/<filename>.pdf.
