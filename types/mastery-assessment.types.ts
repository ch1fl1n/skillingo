/**
 * MASTERY-BASED ASSESSMENT TYPES
 * 
 * Types for a mastery-oriented evaluation system that focuses on:
 * - Constructive conversational feedback instead of numerical grades
 * - Mastery (dominio) vs non-mastery (no dominio) communication
 * - Qualitative and quantitative appreciation
 * - Objective-based achievement tracking (logrado/no logrado)
 * - Grade derivation from mastery level
 */

// ==================== CORE MASTERY TYPES ====================

/**
 * Mastery level indicators
 */
export type MasteryLevel = 'no_dominio' | 'parcial' | 'dominio';

/**
 * Achievement status for a specific objective
 */
export type AchievementStatus = 'logrado' | 'no_logrado' | 'en_progreso';

/**
 * Single learning objective definition
 */
export interface LearningObjective {
  id: string;
  label: string;
  description?: string;
  weight?: number; // Importance weight (0-1)
  category?: string; // e.g., 'conceptual', 'practical', 'creative'
}

/**
 * Result for a single question/task
 */
export interface TaskResult {
  id: string;
  objectiveId?: string | null;
  correct: boolean;
  selectedIndex?: number | null;
  correctIndex?: number | null;
  timeSpent?: number; // seconds
  attempts?: number;
}

/**
 * Qualitative feedback component
 */
export interface QualitativeFeedback {
  strengths: string[]; // What the learner did well
  areas_for_improvement: string[]; // Constructive areas to work on
  personalized_message: string; // Conversational, encouraging message
}

/**
 * Quantitative feedback component
 */
export interface QuantitativeFeedback {
  correct_count: number;
  total_count: number;
  percentage: number;
  accuracy_trend?: 'improving' | 'stable' | 'declining';
}

/**
 * Feedback for a single objective
 */
export interface ObjectiveFeedback {
  id: string;
  label: string;
  status: AchievementStatus;
  qualitative: QualitativeFeedback;
  quantitative: QuantitativeFeedback;
  suggested_next_steps: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: 'article' | 'video' | 'exercise' | 'documentation';
  }>;
}

/**
 * Grade derivation explanation
 */
export interface GradeDerivation {
  basis: string; // Explanation of how grade derives from mastery
  mastery_percentage: number; // 0-100
  objectives_achieved: number;
  objectives_total: number;
  recommended_grade_label: string; // e.g., "Aprobado (Dominio)", "No Aprobado"
  numeric_equivalent?: number; // Optional numeric grade if needed (0-100)
}

/**
 * Complete mastery-based assessment result
 */
export interface MasteryAssessmentResult {
  assessment_id: string;
  assessed_at: string; // ISO timestamp
  overall_mastery: boolean;
  mastery_level: MasteryLevel;
  conversational_summary: string; // Main conversational feedback
  objectives: ObjectiveFeedback[];
  grade_derivation: GradeDerivation;
  recommendations: {
    should_retry: boolean;
    should_advance: boolean;
    practice_focus: string[];
    estimated_time_to_mastery?: string; // e.g., "2-3 more practice sessions"
  };
  metadata?: {
    lesson_id?: string | number;
    user_id?: string;
    skill_id?: string | number;
    duration_seconds?: number;
  };
}

// ==================== COMMUNITY POST ASSESSMENT TYPES ====================

/**
 * Evaluation criteria for community posts
 */
export interface CommunityPostCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
}

/**
 * Default criteria for community post evaluation
 */
export const DEFAULT_POST_CRITERIA: CommunityPostCriteria[] = [
  {
    id: 'clarity',
    name: 'Claridad',
    description: 'El contenido es claro, bien estructurado y fácil de entender',
    weight: 0.25
  },
  {
    id: 'relevance',
    name: 'Relevancia',
    description: 'El contenido es relevante para la comunidad y aporta valor',
    weight: 0.25
  },
  {
    id: 'accuracy',
    name: 'Precisión',
    description: 'La información es correcta y está bien fundamentada',
    weight: 0.25
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'El contenido fomenta la discusión y participación constructiva',
    weight: 0.25
  }
];

/**
 * Evaluation of a single criterion for a community post
 */
export interface CriterionEvaluation {
  criterion_id: string;
  criterion_name: string;
  status: AchievementStatus;
  score: number; // 0-100
  feedback: string;
  suggestions: string[];
}

/**
 * Complete community post assessment
 */
export interface CommunityPostAssessment {
  post_id: number;
  assessed_at: string;
  overall_quality: MasteryLevel;
  should_approve: boolean;
  criteria_evaluations: CriterionEvaluation[];
  conversational_feedback: string;
  moderator_notes?: string;
  improvement_suggestions: string[];
  grade_derivation: {
    overall_score: number; // 0-100
    criteria_met: number;
    criteria_total: number;
    recommendation: 'approve' | 'request_revision' | 'reject';
    explanation: string;
  };
}

// ==================== INPUT TYPES FOR API ====================

/**
 * Input for lesson mastery assessment
 */
export interface LessonMasteryInput {
  lessonId: string | number;
  userId?: string;
  objectives: LearningObjective[];
  tasks: TaskResult[];
  passingThreshold?: number; // Default 70%
  language?: 'es' | 'en';
  includeResources?: boolean;
}

/**
 * Input for community post assessment
 */
export interface CommunityPostMasteryInput {
  postId: number;
  title: string;
  content: string;
  category?: string;
  authorId?: string;
  criteria?: CommunityPostCriteria[];
  language?: 'es' | 'en';
  moderationContext?: {
    previous_violations?: number;
    community_reputation?: number;
  };
}

// ==================== HISTORICAL TRACKING ====================

/**
 * Historical mastery progression for a user
 */
export interface MasteryProgressHistory {
  user_id: string;
  skill_id: number;
  assessments: Array<{
    assessment_id: string;
    timestamp: string;
    mastery_level: MasteryLevel;
    objectives_achieved: number;
    objectives_total: number;
  }>;
  overall_trend: 'improving' | 'stable' | 'declining';
  current_mastery_level: MasteryLevel;
  strengths: string[];
  growth_areas: string[];
}

// ==================== API RESPONSE TYPES ====================

/**
 * Standard API response wrapper
 */
export interface MasteryAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    request_id?: string;
    processing_time_ms?: number;
  };
}

/**
 * Batch assessment result
 */
export interface BatchMasteryResult {
  total_processed: number;
  successful: number;
  failed: number;
  results: MasteryAssessmentResult[];
  errors?: Array<{
    item_id: string;
    error: string;
  }>;
}

// ==================== PROFICIENCY MILESTONE ASSESSMENT TYPES ====================

/**
 * CEFR proficiency level
 */
export type CEFRLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' | 'high_a1' | 'high_a2' | 'high_b1' | 'high_b2';

/**
 * Unlock condition for milestone
 */
export interface MilestoneUnlock {
  type: 'skill' | 'lesson' | 'feature' | 'content';
  id: number | string;
  name: string;
  description?: string;
}

/**
 * Proficiency milestone definition
 */
export interface ProficiencyMilestone {
  id: string;
  skill_id: number;
  cefr_level: CEFRLevel;
  score_threshold: number; // 0-160
  title: string;
  description: string;
  badge_icon?: string;
  xp_reward: number;
  unlocks?: MilestoneUnlock[];
  created_at: string;
}

/**
 * Progress toward a specific milestone
 */
export interface MilestoneProgress {
  milestone_id: string;
  user_id: string;
  skill_id: number;
  cefr_level: CEFRLevel;
  current_score: number;
  score_threshold: number;
  progress_percentage: number; // 0-100
  achieved: boolean;
  achieved_at?: string;
  days_until_next_milestone?: number;
  estimated_completion_date?: string;
}

/**
 * Milestone achievement feedback
 */
export interface MilestoneAchievementFeedback {
  achieved: boolean;
  mastery_level: 'no_dominio' | 'parcial' | 'dominio';
  current_milestone: ProficiencyMilestone;
  next_milestone?: ProficiencyMilestone;
  
  // Conversational feedback
  congratulations_message: string;
  summary: string; // Constructive, conversational summary
  
  // Qualitative feedback
  strengths_demonstrated: string[];
  next_phase_focus: string[];
  
  // Quantitative feedback
  total_assessments: number;
  consecutive_successes: number;
  improvement_rate: number; // percentage improvement from previous score
  
  // Rewards & unlocks
  xp_earned: number;
  unlocked_features: MilestoneUnlock[];
  
  // Recommendations
  recommendations: {
    should_celebrate: boolean;
    estimated_time_to_next_milestone?: string;
    suggested_practice_focus: string[];
    advanced_resources: Array<{
      title: string;
      url: string;
      difficulty: 'advanced' | 'expert';
    }>;
  };
  
  // Grade derivation
  grade_explanation: string; // Why this CEFR level was achieved
}

/**
 * Input for milestone progress assessment
 */
export interface MilestoneProgressInput {
  user_id: string;
  skill_id: number;
  current_score: number; // 0-160 (score from skill_proficiency_scores.current_score)
  previous_score?: number;
  language?: 'es' | 'en';
  include_unlocks?: boolean;
}

/**
 * Milestone assessment result
 */
export interface MilestoneAssessmentResult {
  assessment_id: string;
  assessed_at: string;
  user_id: string;
  skill_id: number;
  
  // Current state
  current_milestone: ProficiencyMilestone;
  current_cefr_level: CEFRLevel;
  current_score: number;
  
  // Previous state
  previous_milestone?: ProficiencyMilestone;
  previous_cefr_level?: CEFRLevel;
  previous_score?: number;
  
  // Progression
  level_achieved: boolean;
  level_improved: boolean;
  score_improvement: number; // Delta from previous
  
  // Feedback
  feedback: MilestoneAchievementFeedback;
  
  // Database updates needed
  updates_required: {
    update_proficiency_score: boolean;
    update_cefr_level: boolean;
    award_xp: number;
    unlock_features: MilestoneUnlock[];
  };
  
  metadata?: {
    duration_seconds?: number;
    consecutive_assessments?: number;
    streak_days?: number;
  };
}
