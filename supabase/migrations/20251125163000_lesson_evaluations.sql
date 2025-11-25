-- Migration: lesson_evaluations table
-- Creates a table to store mastery-based evaluations per lesson per user.
-- Run with: supabase migration apply (según entorno CI/local)

CREATE TABLE IF NOT EXISTS public.lesson_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  overall_mastery TEXT NOT NULL CHECK (overall_mastery IN ('achieved','not-achieved')),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  objectives_data JSONB NOT NULL,
  feedback_data JSONB NOT NULL,
  next_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  resources_suggested TEXT[] DEFAULT ARRAY[]::TEXT[],
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_evaluations_user_idx ON public.lesson_evaluations(user_id);
CREATE INDEX IF NOT EXISTS lesson_evaluations_lesson_idx ON public.lesson_evaluations(lesson_id);
CREATE INDEX IF NOT EXISTS lesson_evaluations_mastery_idx ON public.lesson_evaluations(overall_mastery);
