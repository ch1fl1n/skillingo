-- =============================================
-- Community Likes and Comments System
-- =============================================
-- This migration adds likes and comments functionality to community posts
-- Features:
-- - Post likes with user tracking
-- - Nested comments with replies
-- - Comment likes
-- - Automatic counts and aggregations
-- - RLS policies for security

-- =============================================
-- TABLES
-- =============================================

-- Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 2000),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE
);

-- Comment Likes Table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

-- =============================================
-- INDEXES for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- =============================================
-- ADD CACHED COUNTS TO COMMUNITY_POSTS
-- =============================================

ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Update existing posts to have correct counts
UPDATE public.community_posts
SET likes_count = 0, comments_count = 0
WHERE likes_count IS NULL OR comments_count IS NULL;

-- =============================================
-- FUNCTIONS for Automatic Count Updates
-- =============================================

-- Function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set updated_at and is_edited on comment update
CREATE OR REPLACE FUNCTION public.update_comment_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.is_edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for post likes count
DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger for post comments count
DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger for comment metadata updates
DROP TRIGGER IF EXISTS trg_update_comment_metadata ON public.post_comments;
CREATE TRIGGER trg_update_comment_metadata
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION public.update_comment_metadata();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- POST LIKES POLICIES
-- Anyone can view likes
CREATE POLICY "Anyone can view post likes"
ON public.post_likes FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- POST COMMENTS POLICIES
-- Anyone can view approved post comments
CREATE POLICY "Anyone can view comments on approved posts"
ON public.post_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts
    WHERE id = post_comments.post_id
    AND status = 'approved'
  )
);

-- Users can insert comments on approved posts
CREATE POLICY "Users can comment on approved posts"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_posts
    WHERE id = post_id
    AND status = 'approved'
  )
);

-- Users can update their own comments
CREATE POLICY "Users can edit their own comments"
ON public.post_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Moderators can delete any comment
CREATE POLICY "Moderators can delete any comment"
ON public.post_comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('moderator', 'admin')
  )
);

-- COMMENT LIKES POLICIES
-- Anyone can view comment likes
CREATE POLICY "Anyone can view comment likes"
ON public.comment_likes FOR SELECT
TO authenticated
USING (true);

-- Users can like comments
CREATE POLICY "Users can like comments"
ON public.comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unlike comments
CREATE POLICY "Users can unlike comments"
ON public.comment_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- HELPER VIEWS (Optional, for easier queries)
-- =============================================

-- View to get comments with user info and like counts
CREATE OR REPLACE VIEW public.comments_with_details AS
SELECT 
  c.id,
  c.post_id,
  c.parent_comment_id,
  c.content,
  c.created_at,
  c.updated_at,
  c.is_edited,
  c.user_id,
  u.username,
  u.avatar_url,
  u.level,
  COUNT(DISTINCT cl.id) as likes_count,
  COUNT(DISTINCT replies.id) as replies_count
FROM public.post_comments c
LEFT JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.comment_likes cl ON c.id = cl.comment_id
LEFT JOIN public.post_comments replies ON c.id = replies.parent_comment_id
GROUP BY c.id, u.username, u.avatar_url, u.level;

-- Grant access to the view
GRANT SELECT ON public.comments_with_details TO authenticated;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.post_likes IS 'Tracks which users liked which posts';
COMMENT ON TABLE public.post_comments IS 'Comments on community posts with support for nested replies';
COMMENT ON TABLE public.comment_likes IS 'Tracks which users liked which comments';
COMMENT ON COLUMN public.community_posts.likes_count IS 'Cached count of post likes (auto-updated by trigger)';
COMMENT ON COLUMN public.community_posts.comments_count IS 'Cached count of post comments (auto-updated by trigger)';
