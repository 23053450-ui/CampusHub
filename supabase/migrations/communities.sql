-- =============================================================================
-- Migration: communities.sql
-- Description: Communities feature tables, RLS policies, RPCs, and storage
-- Owner: Communities Team
-- =============================================================================

-- 1. POSTS (Forum / Discussions)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
    body TEXT,
    image_url TEXT,
    images TEXT[] DEFAULT '{}' CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5),
    upvotes INT NOT NULL DEFAULT 0,
    downvotes INT NOT NULL DEFAULT 0,
    reply_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- POST_IMAGES (Normalized association table for media)
CREATE TABLE IF NOT EXISTS public.post_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post images are readable by authenticated users"
  ON public.post_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authors can insert post images"
  ON public.post_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- POSTS RLS
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

-- 2. POST_VOTES
CREATE TABLE IF NOT EXISTS public.post_votes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (post_id, user_id)
);

-- POST_VOTES RLS & ATOMIC RPC
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view votes"
  ON public.post_votes FOR SELECT
  TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.post_votes FROM authenticated;

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

  UPDATE public.posts
  SET
    upvotes = (SELECT count(*) FROM public.post_votes WHERE post_id = p_post_id AND vote = 1),
    downvotes = (SELECT count(*) FROM public.post_votes WHERE post_id = p_post_id AND vote = -1)
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_post(UUID, SMALLINT) TO authenticated;

-- 3. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    depth INT NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 11),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    image_urls TEXT[] DEFAULT '{}' CHECK (array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 2),
    upvotes INT NOT NULL DEFAULT 0,
    downvotes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

-- Enforce comment nesting depth limit (12 levels: 0 to 11) and prevent cross-post reply hijacking
CREATE OR REPLACE FUNCTION public.handle_comment_depth_and_safety()
RETURNS trigger AS $$
DECLARE
  v_parent_depth INT;
  v_parent_post_id UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 0;
  ELSE
    SELECT depth, post_id INTO v_parent_depth, v_parent_post_id
    FROM public.comments
    WHERE id = NEW.parent_id;

    IF v_parent_post_id IS NULL THEN
      RAISE EXCEPTION 'Parent comment not found';
    END IF;

    -- Cross-post hijacking prevention
    IF v_parent_post_id <> NEW.post_id THEN
      RAISE EXCEPTION 'Cannot reply to a comment belonging to another post';
    END IF;

    -- 12-level ceiling (0 to 11 = 12 total levels)
    IF v_parent_depth >= 11 THEN
      RAISE EXCEPTION 'Maximum comment nesting depth (12 levels) reached';
    END IF;

    NEW.depth := v_parent_depth + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_depth_and_safety ON public.comments;
CREATE TRIGGER trg_comment_depth_and_safety
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_depth_and_safety();

CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reply_count = reply_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_count ON public.comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

-- 4. Storage Bucket: communities-images (Client WebP, 1MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('communities-images', 'communities-images', true, 1048576, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public read on communities-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'communities-images');

CREATE POLICY "Users can upload WebP images to communities-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'communities-images' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Users can delete own WebP images in communities-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'communities-images' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- 5. Storage Bucket: public-attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('public-attachments', 'public-attachments', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public read on public-attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-attachments');

CREATE POLICY "Users can upload to their own folder in public-attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-attachments' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Users can delete own files in public-attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'public-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));
