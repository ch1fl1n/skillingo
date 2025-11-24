// Tipos mínimos derivados desde database.types para uso simplificado en componentes.
import { Database } from './database.types';

export type PublicTables = Database['public']['Tables'];
export type UserRow = PublicTables['users']['Row'];
export type SkillRow = PublicTables['skills']['Row'];
export type LessonRow = PublicTables['lessons']['Row'];
export type LessonAttemptRow = PublicTables['lesson_attempts']['Row'];
export type UserProgressRow = PublicTables['user_progress']['Row'];
export type AchievementRow = PublicTables['achievements']['Row'];
export type UserAchievementRow = PublicTables['user_achievements']['Row'];
export type CommunityPostRow = PublicTables['community_posts']['Row'];
export type PostRatingRow = PublicTables['post_ratings']['Row'];
export type ProficiencyScoreRow = PublicTables['skill_proficiency_scores']['Row'];
export type ProficiencyMilestoneRow = PublicTables['proficiency_milestones']['Row'];
