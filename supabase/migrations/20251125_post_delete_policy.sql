-- =============================================
-- Allow users to delete their own community posts
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Moderators can delete any post" ON public.community_posts;

-- Add delete policy for post owners
CREATE POLICY "Users can delete their own posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Moderators/admins can also delete any post
CREATE POLICY "Moderators can delete any post"
ON public.community_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('moderator', 'admin')
  )
);
