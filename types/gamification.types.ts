// GAMIFICATION TYPES ✨

export interface DailyStreak {
  id: string;
  user_id: string;
  current_streak: number; // How many consecutive days?
  longest_streak: number; // Personal best! 🏆
  last_completed_date: string; // ISO 8601 date
  fire_count: number; // Visual representation of current streak
  is_active_today: boolean; // Did we complete today?
  created_at: string;
  updated_at: string;
}

/**
 * Friend Streak - Maintain streaks with up to 5 friends! 👥
 * 
 * Social accountability mechanism that keeps users engaged through
 * shared goals and friendly competition with their closest circle!
 */
export interface FriendStreak {
  id: string;
  user_id: string;
  friend_user_id: string;
  current_streak: number; // Joint streak count
  started_date: string;
  last_completed_date: string;
  is_broken: boolean; // Did one person miss a day?
  created_at: string;
  updated_at: string;
}

/**
 * League System - Competitive rankings for up to 30 users! 🏅
 * 
 * Users are grouped into leagues and compete for top positions.
 * Leagues refresh weekly to keep competition fresh and exciting!
 * Inspired by Duolingo's competitive spaces!
 */
export interface League {
  id: string;
  name: string; // e.g., "Bronze League", "Diamond League"
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  max_members: number; // Usually 30 for competitive balance
  current_members: number;
  start_date: string;
  end_date: string; // Weekly rotation
  created_at: string;
}

/**
 * League Membership - Where users compete! ⚔️
 * 
 * Tracks each user's participation in a league,
 * their ranking, and points earned during that period!
 */
export interface LeagueMembership {
  id: string;
  league_id: string;
  user_id: string;
  rank: number; // 1st, 2nd, 3rd, etc.
  points: number; // Total points earned this week
  xp_earned: number; // XP contribution to league standing
  is_promoted: boolean; // Did they rank high enough to promote?
  created_at: string;
  updated_at: string;
}

/**
 * Achievement System - Unlock amazing badges! 🎖️
 * 
 * Achievements recognize milestones and encourage exploration.
 * Each achievement is tied to specific user actions and progress!
 */
export interface Achievement {
  id: string;
  key: string; // Unique identifier like "first_lesson_complete"
  name: string; // "First Steps" - Readable name
  description: string; // "Complete your first lesson!"
  icon_url: string; // Emoji or image URL
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number; // Bonus XP for unlocking!
  unlock_condition: AchievementCondition; // What triggers it?
  created_at: string;
}

/**
 * Achievement Conditions - Define how to unlock achievements! 🔓
 * 
 * These conditions are checked when users complete actions.
 * Flexible system allows for complex unlock patterns!
 */
export type AchievementCondition = 
  | { type: 'lesson_count'; count: number } // Complete N lessons
  | { type: 'consecutive_days'; days: number } // N day streak
  | { type: 'score_threshold'; min_score: number } // Score at least X%
  | { type: 'skill_mastery'; skill_id: string } // Master a skill (100%)
  | { type: 'xp_milestone'; xp_amount: number } // Earn X XP
  | { type: 'league_rank'; rank: number } // Reach rank in league
  | { type: 'friends_joined'; count: number } // Invite N friends
  | { type: 'perfect_quiz'; skill_id?: string }; // Score 100% on quiz

/**
 * User Achievement - Track which achievements user has unlocked! 📜
 * 
 * When a user unlocks an achievement, we record it here
 * with the date and any achievement-specific stats!
 */
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string; // When they earned it!
  progress?: number; // For achievements with multiple tiers
  created_at: string;
}

/**
 * XP System - Experience points for progression! ⭐
 * 
 * XP accumulates as users complete lessons, quizzes, and challenges.
 * This is the backbone of our progression system!
 */
export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number; // Lifetime XP
  current_level: number; // User's current level (based on total_xp)
  xp_to_next_level: number; // How much more needed?
  xp_this_week: number; // For league calculations
  xp_this_month: number; // For monthly challenges
  updated_at: string;
}

/**
 * XP Transaction - Audit trail of all XP gains! 📊
 * 
 * Track every source of XP for transparency and analytics.
 * Users love seeing WHERE their points came from!
 */
export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number; // Can be positive or negative (penalties!)
  source: XPSource; // Where did this come from?
  source_id?: string; // Link to the source (lesson_id, achievement_id, etc.)
  reason: string; // Human-readable explanation
  created_at: string;
}

/**
 * XP Sources - All the ways to earn XP! 💰
 * 
 * Each action is categorized by what earned the points.
 * Great for gamification analytics and understanding player engagement!
 */
export type XPSource = 
  | 'lesson_completion' // Main way to earn XP!
  | 'quiz_perfect_score' // Extra for perfect scores!
  | 'daily_streak' // Bonus for maintaining streaks
  | 'achievement_unlock' // Achievement bonuses
  | 'league_bonus' // Bonus for high league ranks
  | 'challenge_completion' // Limited-time challenges
  | 'skill_mastery' // Reaching 100% on a skill
  | 'friend_referral' // Inviting friends
  | 'special_event'; // Time-limited events

/**
 * Notification Preferences - Respect user's notification settings! 🔔
 * 
 * Designed with retention in mind - 19% of users uninstall due to
 * excessive notifications! We give users FULL CONTROL!
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  daily_reminder_enabled: boolean; // Smart daily reminder
  daily_reminder_hour: number; // What time? (user's timezone)
  streak_reminder_enabled: boolean; // "Your streak is at risk!"
  achievement_notifications: boolean; // Celebrate unlocks!
  league_rank_changes: boolean; // When ranking changes
  friend_activity: boolean; // See what friends do
  special_events: boolean; // Limited-time events
  frequency_cap_per_day: number; // Max notifications per day
  quiet_hours_start: number; // e.g., 22 (10 PM)
  quiet_hours_end: number; // e.g., 8 (8 AM)
  created_at: string;
  updated_at: string;
}

/**
 * Smart Notification - Our adaptive notification system! 🎯
 * 
 * Uses a bandit algorithm (like Duolingo!) to determine
 * WHEN and WHAT to notify users for maximum engagement!
 */
export interface SmartNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>; // Additional context
  optimal_send_time: string; // AI-determined best time
  sent_at?: string; // When it was actually sent
  interacted_at?: string; // When/if user opened it
  is_read: boolean;
  created_at: string;
}

/**
 * Notification Types - Different message categories! 📬
 * 
 * Each type serves a specific engagement purpose!
 */
export type NotificationType = 
  | 'streak_maintenance' // "Keep your streak alive!"
  | 'streak_recovery' // "You can restart your streak!"
  | 'achievement_unlock' // "You unlocked an achievement!"
  | 'league_update' // "You're ranked #3 this week!"
  | 'friend_activity' // "Friend completed a lesson!"
  | 'new_challenge' // "New daily challenge available!"
  | 'level_up' // "Congratulations, you're level X!"
  | 'daily_reminder' // "Time to learn something new!"
  | 'special_event'; // "Limited-time event ending soon!"

/**
 * Learning Competencies - CCR Framework! 🎓
 * 
 * Based on the Center for Curriculum Redesign's research of 111 frameworks
 * and 861 research papers, condensing 250+ different terms into 10 core competencies!
 * 
 * Skills: Creativity, Critical Thinking, Communication, Collaboration
 * Character: Curiosity, Courage, Resilience, Ethics
 * Meta-Learning: Metacognition & Metaemotion
 */
export type CompetencyCategory = 'skills' | 'character' | 'meta-learning';

export interface Competency {
  id: string;
  key: string; // 'creativity', 'critical_thinking', etc.
  name: string; // "Creativity"
  category: CompetencyCategory; // 'skills' | 'character' | 'meta-learning'
  description: string; // What does this competency involve?
  icon_url?: string; // Visual representation
  created_at: string;
}

/**
 * User Competency Progress - Track mastery of each competency! 📈
 * 
 * As users complete lessons, they develop these competencies!
 * Each lesson can contribute to multiple competencies!
 */
export interface UserCompetencyProgress {
  id: string;
  user_id: string;
  competency_id: string;
  progress_percent: number; // 0-100%
  level: number; // Competency level (1-5?)
  lessons_contributed: number; // How many lessons taught this?
  xp_earned: number; // XP specifically for this competency
  updated_at: string;
}

/**
 * Gamification State - Summary of user's engagement! 🎮
 * 
 * This is the dashboard view of all gamification metrics!
 * Perfect for showing on the home screen!
 */
export interface UserGamificationStats {
  user_id: string;
  current_level: number;
  total_xp: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  league_id?: string;
  league_rank?: number;
  league_points?: number;
  achievements_unlocked: number;
  total_achievements: number;
  friend_streak_count: number;
  competencies_by_category: {
    skills: UserCompetencyProgress[];
    character: UserCompetencyProgress[];
    'meta-learning': UserCompetencyProgress[];
  };
  updated_at: string;
}
