-- Migration: indexes, and unique constraints for core tables

-- Unique constraints (upserts)
ALTER TABLE public.post_ratings
  ADD CONSTRAINT post_ratings_post_user_unique UNIQUE (post_id, user_id);

ALTER TABLE public.user_achievements
  ADD CONSTRAINT user_achievements_user_achievement_unique UNIQUE (user_id, achievement_id);

ALTER TABLE public.user_progress
  ADD CONSTRAINT user_progress_user_skill_unique UNIQUE (user_id, skill_id);

-- Helpful indexes (FKs and filters)
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON public.community_posts (status);

CREATE INDEX IF NOT EXISTS idx_lessons_skill_id ON public.lessons (skill_id);

CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_id ON public.lesson_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson_id ON public.lesson_attempts (lesson_id);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_post_id ON public.moderation_queue (post_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_moderator_id ON public.moderation_queue (moderator_id);

CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON public.post_ratings (post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON public.post_ratings (user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements (achievement_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_skill_id ON public.user_progress (skill_id);
