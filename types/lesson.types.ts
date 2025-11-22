/**
 * Lesson and Quiz Types
 * 
 * These types match the JSONB structure stored in the lessons.content column
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Skill {
  id: number;
  name: string;
  description: string | null;
}

export interface Lesson {
  id: number;
  skill_id: number;
  title: string;
  difficulty: Difficulty;
  xp_reward: number;
  content: LessonContent;
  created_at: string;
}

export interface LessonContent {
  introduction: string;
  steps: LessonStep[];
  quiz?: Quiz;
  resources?: Resource[];
}

export interface LessonStep {
  id: number;
  type: 'text' | 'code' | 'video' | 'interactive';
  title: string;
  content: string;
  code_snippet?: string;
  image_url?: string;
}

export interface Quiz {
  questions: Question[];
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number; // Index of correct option (0-based)
  explanation?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'video' | 'article';
}

export interface LessonAttempt {
  id: number;
  user_id: string;
  lesson_id: number;
  score: number | null;
  completed: boolean;
  attempted_at: string;
}

export interface UserProgress {
  id: number;
  user_id: string;
  skill_id: number;
  progress_percent: number;
  last_updated: string;
}

/**
 * Enriched types with relational data
 */
export interface SkillWithProgress extends Skill {
  progress_percent?: number;
  total_lessons?: number;
  completed_lessons?: number;
}

export interface LessonWithCompletion extends Lesson {
  completed?: boolean;
  user_score?: number | null;
}
