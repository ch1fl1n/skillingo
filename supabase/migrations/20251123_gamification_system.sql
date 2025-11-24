-- ===== DAILY STREAKS TABLE =====
-- Tracks daily practice streaks for motivation and habit building
CREATE TABLE IF NOT EXISTS daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0, -- Current consecutive days
  longest_streak INT NOT NULL DEFAULT 0, -- Personal best
  last_completed_date DATE NOT NULL, -- Last time user completed a lesson
  fire_count INT NOT NULL DEFAULT 0, -- Visual indicator for UI
  is_active_today BOOLEAN NOT NULL DEFAULT false, -- Did they complete today?
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_last_completed_date ON daily_streaks(last_completed_date);

-- ===== FRIEND STREAKS TABLE =====
-- Maintain accountability streaks between friends
CREATE TABLE IF NOT EXISTS friend_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0, -- Joint streak
  started_date DATE NOT NULL,
  last_completed_date DATE NOT NULL,
  is_broken BOOLEAN NOT NULL DEFAULT false, -- Did someone break it?
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate friendships (ensure A->B and B->A are linked)
  UNIQUE(user_id, friend_user_id),
  
  -- Ensure user can't streak with themselves
  CHECK (user_id != friend_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_streaks_user_id ON friend_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_streaks_friend_user_id ON friend_streaks(friend_user_id);

-- ===== LEAGUES TABLE =====
-- Competitive groupings for up to 30 users
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- e.g., "Bronze League", "Diamond League"
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  max_members INT NOT NULL DEFAULT 30,
  current_members INT NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Weekly rotation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure leagues don't overlap
  CHECK (start_date < end_date)
);

CREATE INDEX IF NOT EXISTS idx_leagues_tier ON leagues(tier);
CREATE INDEX IF NOT EXISTS idx_leagues_end_date ON leagues(end_date);

-- ===== LEAGUE MEMBERSHIPS TABLE =====
-- Track user participation in leagues
CREATE TABLE IF NOT EXISTS league_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INT NOT NULL, -- 1st, 2nd, 3rd, etc.
  points INT NOT NULL DEFAULT 0, -- Total points this week
  xp_earned INT NOT NULL DEFAULT 0, -- XP contributed to ranking
  is_promoted BOOLEAN NOT NULL DEFAULT false, -- Promoted to higher tier?
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One membership per user per league
  UNIQUE(league_id, user_id),
  
  -- Rank must be valid
  CHECK (rank > 0 AND rank <= 30)
);

CREATE INDEX IF NOT EXISTS idx_league_memberships_league_id ON league_memberships(league_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_user_id ON league_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_rank ON league_memberships(rank);

-- ===== ACHIEVEMENTS TABLE =====
-- Master list of all available achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE, -- e.g., "first_lesson_complete"
  name VARCHAR(255) NOT NULL, -- "First Steps"
  description TEXT NOT NULL, -- "Complete your first lesson!"
  icon_url VARCHAR(500), -- Emoji or image URL
  rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  xp_reward INT NOT NULL DEFAULT 0, -- Bonus for unlocking
  unlock_condition JSONB NOT NULL, -- Stores condition JSON
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure realistic XP rewards
  CHECK (xp_reward >= 0 AND xp_reward <= 10000)
);

CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(key);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- ===== USER ACHIEVEMENTS TABLE =====
-- Track which achievements users have unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  progress INT DEFAULT 0, -- For multi-tier achievements
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One unlock per user per achievement
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- ===== USER XP TABLE =====
-- Track experience points and leveling
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0, -- Lifetime XP
  current_level INT NOT NULL DEFAULT 1, -- Calculated from total_xp
  xp_to_next_level INT NOT NULL DEFAULT 100, -- For progress display
  xp_this_week INT NOT NULL DEFAULT 0, -- For league calculations
  xp_this_month INT NOT NULL DEFAULT 0, -- For monthly challenges
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One record per user
  UNIQUE(user_id),
  
  -- Constraints
  CHECK (total_xp >= 0),
  CHECK (current_level > 0),
  CHECK (xp_to_next_level > 0)
);

CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_current_level ON user_xp(current_level);
CREATE INDEX IF NOT EXISTS idx_user_xp_total_xp ON user_xp(total_xp);

-- ===== XP TRANSACTIONS TABLE =====
-- Audit trail of all XP gains and losses
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- Can be positive or negative
  source VARCHAR(100) NOT NULL, -- Where did this come from?
  source_id UUID, -- Link to source (lesson_id, achievement_id, etc.)
  reason TEXT NOT NULL, -- Human-readable explanation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Amount must not be zero
  CHECK (amount != 0)
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);

-- ===== NOTIFICATION PREFERENCES TABLE =====
-- User controls for notifications - respect their preferences!
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_reminder_hour INT DEFAULT 9, -- 0-23 hour
  streak_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  achievement_notifications BOOLEAN NOT NULL DEFAULT true,
  league_rank_changes BOOLEAN NOT NULL DEFAULT true,
  friend_activity BOOLEAN NOT NULL DEFAULT true,
  special_events BOOLEAN NOT NULL DEFAULT true,
  frequency_cap_per_day INT DEFAULT 3, -- Max notifications per day
  quiet_hours_start INT DEFAULT 22, -- e.g., 10 PM (22:00)
  quiet_hours_end INT DEFAULT 8, -- e.g., 8 AM (08:00)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One record per user
  UNIQUE(user_id),
  
  -- Constraints
  CHECK (daily_reminder_hour >= 0 AND daily_reminder_hour < 24),
  CHECK (quiet_hours_start >= 0 AND quiet_hours_start < 24),
  CHECK (quiet_hours_end >= 0 AND quiet_hours_end < 24),
  CHECK (frequency_cap_per_day > 0)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ===== SMART NOTIFICATIONS TABLE =====
-- Adaptive notifications with optimal timing
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- streak_maintenance, achievement_unlock, etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional context
  optimal_send_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  interacted_at TIMESTAMP WITH TIME ZONE, -- When user opened/clicked
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_notifications_user_id ON smart_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_type ON smart_notifications(type);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_optimal_send_time ON smart_notifications(optimal_send_time);

-- ===== COMPETENCIES TABLE =====
-- CCR Framework competencies for skill development
CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE, -- 'creativity', 'critical_thinking', etc.
  name VARCHAR(255) NOT NULL, -- "Creativity"
  category VARCHAR(50) NOT NULL CHECK (category IN ('skills', 'character', 'meta-learning')),
  description TEXT NOT NULL,
  icon_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competencies_key ON competencies(key);
CREATE INDEX IF NOT EXISTS idx_competencies_category ON competencies(category);

-- ===== USER COMPETENCY PROGRESS TABLE =====
-- Track mastery of each competency through lessons
CREATE TABLE IF NOT EXISTS user_competency_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  progress_percent INT NOT NULL DEFAULT 0, -- 0-100%
  level INT NOT NULL DEFAULT 1, -- Competency level
  lessons_contributed INT NOT NULL DEFAULT 0, -- How many lessons?
  xp_earned INT NOT NULL DEFAULT 0, -- XP for this competency
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One record per user per competency
  UNIQUE(user_id, competency_id),
  
  -- Constraints
  CHECK (progress_percent >= 0 AND progress_percent <= 100),
  CHECK (level > 0 AND level <= 5)
);

CREATE INDEX IF NOT EXISTS idx_user_competency_progress_user_id ON user_competency_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_competency_progress_competency_id ON user_competency_progress(competency_id);
CREATE INDEX IF NOT EXISTS idx_user_competency_progress_progress_percent ON user_competency_progress(progress_percent);

-- ===== SEED DATA: CCR COMPETENCIES =====
-- Insert the 10 core competencies from the Center for Curriculum Redesign framework

INSERT INTO competencies (key, name, category, description) VALUES
  -- Skills (Creativity, Critical Thinking, Communication, Collaboration)
  ('creativity', 'Creativity', 'skills', 'The ability to think of novel ideas, approaches, and solutions to problems'),
  ('critical_thinking', 'Critical Thinking', 'skills', 'The ability to analyze, evaluate, and reason through information'),
  ('communication', 'Communication', 'skills', 'The ability to express ideas clearly and effectively with various audiences'),
  ('collaboration', 'Collaboration', 'skills', 'The ability to work effectively with others toward shared goals'),
  
  -- Character (Curiosity, Courage, Resilience, Ethics)
  ('curiosity', 'Curiosity', 'character', 'The desire to explore, discover, and understand the world around you'),
  ('courage', 'Courage', 'character', 'The ability to face challenges and take risks despite uncertainty'),
  ('resilience', 'Resilience', 'character', 'The ability to recover from difficulties and adapt to change'),
  ('ethics', 'Ethics', 'character', 'The understanding of right and wrong, and the commitment to moral principles'),
  
  -- Meta-Learning (Metacognition & Metaemotion)
  ('metacognition', 'Metacognition', 'meta-learning', 'The ability to think about your own thinking and learning processes'),
  ('metaemotion', 'Metaemotion', 'meta-learning', 'The ability to understand and manage your own emotions effectively')
ON CONFLICT (key) DO NOTHING;

-- ===== SEED DATA: SAMPLE ACHIEVEMENTS =====

INSERT INTO achievements (key, name, description, icon_url, rarity, xp_reward, unlock_condition) VALUES
  ('first_lesson_complete', 'First Steps', 'Complete your first lesson!', '👣', 'common', 50, '{"type": "lesson_count", "count": 1}'),
  ('week_warrior', 'Week Warrior', 'Maintain a 7-day streak!', '🔥', 'uncommon', 200, '{"type": "consecutive_days", "days": 7}'),
  ('month_master', 'Month Master', 'Maintain a 30-day streak!', '🏆', 'rare', 500, '{"type": "consecutive_days", "days": 30}'),
  ('perfect_score', 'Perfect Score', 'Score 100% on a quiz!', '💯', 'uncommon', 100, '{"type": "perfect_quiz"}'),
  ('xp_collector', 'XP Collector', 'Earn 1000 XP!', '⭐', 'common', 0, '{"type": "xp_milestone", "xp_amount": 1000}'),
  ('skill_master', 'Skill Master', 'Master a skill to 100%!', '🎓', 'epic', 1000, '{"type": "skill_mastery"}'),
  ('league_champion', 'League Champion', 'Rank #1 in a league!', '🥇', 'legendary', 2000, '{"type": "league_rank", "rank": 1}')
ON CONFLICT (key) DO NOTHING;

-- ===== COMMENTS & DOCUMENTATION =====

COMMENT ON TABLE daily_streaks IS 'Tracks daily practice streaks to build consistent learning habits and encourage daily engagement.';
COMMENT ON TABLE friend_streaks IS 'Maintains accountability streaks between friends for social engagement and motivation.';
COMMENT ON TABLE leagues IS 'Competitive groupings for up to 30 users. Promotes healthy competition through weekly rankings.';
COMMENT ON TABLE achievements IS 'Master list of all available achievements. Unlocking achievements rewards player actions.';
COMMENT ON TABLE user_xp IS 'Tracks experience points (XP) and player levels. XP is the primary progression currency.';
COMMENT ON TABLE smart_notifications IS 'Adaptive notifications that use bandit algorithms to determine optimal send times.';
COMMENT ON TABLE competencies IS 'The 10 competencies from CCR framework: 4 Skills, 4 Character traits, 2 Meta-Learning abilities.';
COMMENT ON TABLE user_competency_progress IS 'Tracks development of competencies as users complete lessons. Used for assessing skill growth.';
