/**
 * CEFR Proficiency Levels
 * 
 * International standard for measuring learning proficiency!
 * A1/A2 = Basic User
 * B1/B2 = Independent User
 * C1/C2 = Proficient User
 */
export type CEFRLevel = 
  | 'very_early_a1'  // 0-9 points: Just starting out! 🌱
  | 'early_a1'       // 10-19 points: Building foundation! 🧱
  | 'high_a1'        // 20-29 points: Basic understanding! 📚
  | 'a2'             // 30-59 points: Getting confident! 💪
  | 'early_b1'       // 60-79 points: Intermediate skills! 🚀
  | 'high_b1'        // 80-99 points: Strong competence! ⭐
  | 'early_b2'       // 100-114 points: Advanced abilities! 🌟
  | 'high_b2'        // 115-129 points: Professional level! 🏆
  | 'c1_c2';         // 130-160 points: Expert mastery! 👑

/**
 * Proficiency Score Model
 * 
 * Tracks user's score in a specific skill!
 * Score ranges from 0-160 and maps to CEFR levels!
 */
export interface SkillProficiencyScore {
  id: string;
  user_id: string;
  skill_id: number; // Changed from string to number to match database
  current_score: number; // 0-160 scale
  cefr_level: CEFRLevel; // Calculated from score
  previous_score: number; // For tracking progress
  assessments_completed: number; // How many assessments taken
  last_assessment_date: string;
  next_assessment_date: string; // Recommended next assessment
  confidence_interval: number; // ±N points (statistical confidence)
  created_at: string;
  updated_at: string;
}

/**
 * CEFR Level Descriptor
 * 
 * Describes what a user can do at each proficiency level!
 * These are used to show users their capabilities!
 */
export interface CEFRLevelDescriptor {
  level: CEFRLevel;
  score_range: [number, number]; // [min, max] inclusive
  title: string; // e.g., "Early A1"
  display_name: string; // User-friendly name
  description: string; // What can the user do?
  capabilities: string[]; // Specific abilities at this level
  next_level_preview?: string; // What's next?
  icon_emoji: string; // Visual indicator
  color: string; // UI color for this level
}

/**
 * Assessment Question
 * 
 * Used to evaluate skill proficiency!
 * Adaptive testing adjusts difficulty based on performance!
 */
export interface ProficiencyAssessment {
  id: string;
  skill_id: number;
  difficulty_level: number; // 1-10 scale
  cefr_target: CEFRLevel; // Which level does this assess?
  question_type: AssessmentQuestionType;
  question_data: AssessmentQuestionData; // JSONB with question details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  correct_answer: any; // JSONB with correct answer
  points_value: number; // How many points for correct answer
  time_limit_seconds?: number; // Optional time constraint
  created_at: string;
}

/**
 * Assessment Question Types
 * 
 * Different ways to test proficiency!
 */
export type AssessmentQuestionType = 
  | 'multiple_choice'    // Select the best answer
  | 'code_completion'    // Fill in missing code
  | 'code_review'        // Identify errors or improvements
  | 'practical_task'     // Complete a real-world task
  | 'scenario_based'     // Apply knowledge to scenario
  | 'free_response'      // Open-ended question
  | 'match_pairs'        // Match concepts together
  | 'ordering'           // Put steps in correct order
  | 'true_false';        // Verify statement accuracy

/**
 * Assessment Question Data Structure
 * 
 * Flexible JSONB structure for different question types!
 */
export interface AssessmentQuestionData {
  prompt: string; // The question text
  options?: string[]; // For multiple choice
  code_snippet?: string; // For code-related questions
  scenario?: string; // For scenario-based questions
  hints?: string[]; // Optional hints for learners
  explanation?: string; // Shown after answering
  examples?: string[]; // Reference examples
  media_url?: string; // Images, diagrams, etc.
  rubric?: ScoringRubric; // For free-response grading
}

/**
 * Scoring Rubric for Free-Response Questions
 * 
 * Criteria for evaluating open-ended answers!
 */
export interface ScoringRubric {
  criteria: RubricCriterion[];
  max_points: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  points: number;
  indicators: string[]; // What to look for
}

/**
 * User Assessment Attempt
 * 
 * Records when user takes a proficiency assessment!
 */
export interface UserAssessmentAttempt {
  id: string;
  user_id: string;
  skill_id: number;
  assessment_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user_answer: any; // JSONB with their answer
  is_correct: boolean;
  points_earned: number;
  time_taken_seconds: number;
  difficulty_level: number;
  attempted_at: string;
  feedback?: string; // Optional personalized feedback
}

/**
 * Proficiency Progress Report
 * 
 * Comprehensive view of user's journey in a skill!
 * Shows progress over time and predictions!
 */
export interface ProficiencyProgressReport {
  user_id: string;
  skill_id: number;
  skill_name: string;
  current_score: number;
  current_level: CEFRLevel;
  score_history: ScoreHistoryPoint[];
  milestones_reached: ProficiencyMilestone[];
  next_milestone: ProficiencyMilestone;
  estimated_time_to_next_level: number; // hours
  practice_recommendations: PracticeRecommendation[];
  strengths: string[]; // What they're good at
  areas_for_improvement: string[]; // What to work on
  generated_at: string;
}

/**
 * Score History Point
 * 
 * Track score changes over time!
 * Great for charts and progress visualization!
 */
export interface ScoreHistoryPoint {
  score: number;
  cefr_level: CEFRLevel;
  date: string;
  event_type: 'assessment' | 'practice' | 'milestone' | 'decay';
  change_amount: number; // +/- points from previous
}

/**
 * Proficiency Milestone
 * 
 * Celebrate achievements at key proficiency levels!
 */
export interface ProficiencyMilestone {
  id: string;
  skill_id: number;
  cefr_level: CEFRLevel;
  score_threshold: number;
  title: string; // "Basic Proficiency Achieved!"
  description: string;
  badge_icon: string; // Visual badge
  xp_reward: number; // Gamification integration!
  unlocks?: string[]; // What becomes available at this level
  created_at: string;
}

/**
 * User Milestone Achievement
 * 
 * Track which milestones user has reached!
 */
export interface UserMilestoneAchievement {
  id: string;
  user_id: string;
  milestone_id: string;
  skill_id: number;
  score_at_achievement: number;
  achieved_at: string;
  celebrated: boolean; // Did we show celebration modal?
}

/**
 * Practice Recommendation
 * 
 * AI-powered suggestions for skill improvement!
 * Based on user's current level and performance!
 */
export interface PracticeRecommendation {
  skill_id: number;
  recommended_lesson_ids: string[];
  focus_areas: string[]; // Specific topics to practice
  difficulty_level: number; // Recommended difficulty
  estimated_impact: number; // Expected score increase
  reason: string; // Why this recommendation?
  priority: 'high' | 'medium' | 'low';
}

/**
 * Adaptive Assessment Session
 * 
 * Dynamic assessment that adapts difficulty!
 * Uses Item Response Theory (IRT) principles!
 */
export interface AdaptiveAssessmentSession {
  id: string;
  user_id: string;
  skill_id: number;
  current_difficulty: number; // Adjusts based on performance
  questions_completed: number;
  questions_correct: number;
  estimated_score: number; // Running score estimate
  confidence_level: number; // How confident in the estimate (0-100%)
  started_at: string;
  completed_at?: string;
  final_score?: number;
  final_cefr_level?: CEFRLevel;
}

/**
 * Score Decay Configuration
 * 
 * Skills can decay over time without practice!
 * This encourages regular engagement!
 */
export interface ScoreDecayConfig {
  id: string;
  skill_id: number;
  decay_enabled: boolean;
  decay_rate_per_day: number; // Points lost per day without practice
  decay_starts_after_days: number; // Grace period before decay
  min_score: number; // Score won't decay below this
  created_at: string;
  updated_at: string;
}

/**
 * Learning Velocity Metrics
 * 
 * Track how quickly user is progressing!
 * Used for personalized pacing and recommendations!
 */
export interface LearningVelocity {
  user_id: string;
  skill_id: number;
  points_per_week: number; // Average score increase
  assessments_per_week: number; // Activity level
  learning_pace: 'accelerated' | 'steady' | 'gradual' | 'stalled';
  momentum_score: number; // 0-100, higher = more consistent
  projected_next_level_date: string; // When will they reach next CEFR?
  calculated_at: string;
}

/**
 * Proficiency Certificate
 * 
 * Official recognition of skill mastery!
 * Generated when user reaches significant milestones!
 */
export interface ProficiencyCertificate {
  id: string;
  user_id: string;
  skill_id: number;
  cefr_level_achieved: CEFRLevel;
  score_at_certification: number;
  certificate_number: string; // Unique verification number
  issued_at: string;
  valid_until?: string; // Optional expiration
  verification_url: string; // Public verification link
  pdf_url?: string; // Downloadable certificate
  is_public: boolean; // Can others see this?
  metadata: {
    assessments_taken: number;
    total_study_hours: number;
    skills_demonstrated: string[];
  };
}

/**
 * Peer Comparison Data
 * 
 * Optional feature to show how user compares to others!
 * (Only if user opts in!)
 */
export interface PeerComparison {
  user_id: string;
  skill_id: number;
  user_score: number;
  user_percentile: number; // Top X% of learners
  average_score: number; // Overall average
  cohort_average?: number; // Same time learning
  similar_learners: SimilarLearner[];
  generated_at: string;
}

export interface SimilarLearner {
  score_range: [number, number];
  count: number;
  average_study_hours: number;
}

/**
 * Proficiency Prediction Model
 * 
 * ML-powered predictions of future performance!
 * Uses historical data to forecast progress!
 */
export interface ProficiencyPrediction {
  user_id: string;
  skill_id: number;
  current_score: number;
  predicted_score_1_week: number;
  predicted_score_1_month: number;
  predicted_score_3_months: number;
  confidence: number; // 0-100% confidence in prediction
  factors_considered: string[]; // What influenced prediction
  recommended_actions: string[]; // How to improve predictions
  model_version: string;
  predicted_at: string;
}

/**
 * Assessment Analytics
 * 
 * Aggregate data about assessments!
 * Used for improving question quality and difficulty!
 */
export interface AssessmentAnalytics {
  assessment_id: string;
  total_attempts: number;
  correct_attempts: number;
  average_time_seconds: number;
  difficulty_rating: number; // Calculated from success rate
  discrimination_index: number; // How well it differentiates skill levels
  needs_review: boolean; // Flag problematic questions
  last_analyzed: string;
}

/**
 * Study Session
 * 
 * Track focused practice sessions for proficiency building!
 */
export interface StudySession {
  id: string;
  user_id: string;
  skill_id: number;
  session_type: 'practice' | 'assessment' | 'review' | 'challenge';
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  questions_attempted: number;
  questions_correct: number;
  score_change: number; // How score changed this session
  focus_areas: string[];
  notes?: string; // User's notes about session
}

/**
 * Proficiency Badge
 * 
 * Visual achievement markers for proficiency levels!
 */
export interface ProficiencyBadge {
  id: string;
  name: string;
  description: string;
  cefr_level: CEFRLevel;
  badge_image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

/**
 * Complete Proficiency Overview
 * 
 * Dashboard summary of all user's skill proficiencies!
 */
export interface UserProficiencyOverview {
  user_id: string;
  total_skills_learning: number;
  total_score_points: number; // Sum across all skills
  average_cefr_level: CEFRLevel; // Most common level
  highest_proficiency: {
    skill_id: number;
    skill_name: string;
    score: number;
    cefr_level: CEFRLevel;
  };
  recent_improvements: {
    skill_id: number;
    skill_name: string;
    score_increase: number;
    period_days: number;
  }[];
  certificates_earned: number;
  badges_collected: number;
  total_assessments_taken: number;
  total_study_hours: number;
  updated_at: string;
}
