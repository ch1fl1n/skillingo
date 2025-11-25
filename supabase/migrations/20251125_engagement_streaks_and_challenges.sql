-- ============================================================================
-- RSK-002: Low Engagement - Streaks, Achievements, Seasonal Challenges
-- ============================================================================

-- ============================================================================
-- Daily Activity Tracking (for Streaks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_xp_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track daily activity (used to compute streak)
CREATE TABLE IF NOT EXISTS user_daily_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  lesson_completed INT NOT NULL DEFAULT 0,
  wiki_contributed BOOLEAN DEFAULT false,
  xp_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- ============================================================================
-- Seasonal Challenges
-- ============================================================================

CREATE TABLE IF NOT EXISTS seasonal_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'skill_mastery', 'community', 'streak', 'speed'
  season_name TEXT NOT NULL, -- e.g., "Winter 2025"
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  xp_reward INT NOT NULL DEFAULT 100,
  target_value INT NOT NULL DEFAULT 10, -- e.g., complete 10 lessons
  badge_icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, season_name)
);

-- User progress on seasonal challenges
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES seasonal_challenges(id) ON DELETE CASCADE,
  current_value INT NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- ============================================================================
-- Notification Preferences and History
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_streak_notifications BOOLEAN DEFAULT true,
  enable_achievement_notifications BOOLEAN DEFAULT true,
  enable_challenge_notifications BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Queue for notifications (processed by Edge Function)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'streak_save', 'achievement_unlock', 'challenge_milestone'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  send_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date ON user_daily_activity(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_seasonal_challenges_active ON seasonal_challenges(starts_at, ends_at) WHERE starts_at <= now() AND ends_at >= now();
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON user_challenge_progress(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_send ON notification_queue(status, send_at) WHERE status IN ('pending', 'failed');

-- ============================================================================
-- RLS for Engagement Tables
-- ============================================================================

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own streak
CREATE POLICY "users_read_own_streak" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all streaks
CREATE POLICY "admins_read_all_streaks" ON user_streaks
  FOR SELECT USING ((SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text = 'admin');

-- Users can view daily activity
CREATE POLICY "users_read_own_activity" ON user_daily_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can view active challenges
CREATE POLICY "challenges_public_read" ON seasonal_challenges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can see their challenge progress
CREATE POLICY "users_read_own_challenge_progress" ON user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users manage own notification settings
CREATE POLICY "users_manage_notification_settings" ON user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers: Auto-create streak and daily activity records
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_user_has_streak()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_streak_on_user_create ON auth.users;
CREATE TRIGGER ensure_streak_on_user_create
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_has_streak();

-- ============================================================================
-- Helper Function: Log daily activity from lesson completion
-- ============================================================================

CREATE OR REPLACE FUNCTION log_daily_activity(p_user_id UUID, p_xp_earned INT DEFAULT 0)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_daily_activity (user_id, activity_date, lesson_completed, xp_earned)
  VALUES (p_user_id, CURRENT_DATE, 1, p_xp_earned)
  ON CONFLICT (user_id, activity_date) DO UPDATE
  SET lesson_completed = user_daily_activity.lesson_completed + 1,
      xp_earned = user_daily_activity.xp_earned + EXCLUDED.xp_earned;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Function: Update streak based on daily activity
-- Returns: new_streak_length, streak_saved (boolean), should_notify (boolean)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE (new_streak_length INT, streak_saved BOOLEAN, should_notify BOOLEAN) AS $$
DECLARE
  v_current_streak INT;
  v_last_activity DATE;
  v_today DATE;
  v_streak_saved BOOLEAN;
  v_should_notify BOOLEAN;
BEGIN
  SELECT current_streak, last_activity_date INTO v_current_streak, v_last_activity
  FROM user_streaks
  WHERE user_id = p_user_id;

  v_today := CURRENT_DATE;
  v_streak_saved := false;
  v_should_notify := false;

  -- If user was active yesterday or today, continue streak
  IF v_last_activity >= v_today - INTERVAL '1 day' THEN
    UPDATE user_streaks
    SET
      current_streak = current_streak + 1,
      last_activity_date = v_today,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      updated_at = now()
    WHERE user_id = p_user_id;

    v_streak_saved := true;
    v_should_notify := true;

  ELSE
    -- Streak broken: reset to 1
    UPDATE user_streaks
    SET
      current_streak = 1,
      last_activity_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  SELECT current_streak, v_streak_saved, v_should_notify INTO new_streak_length, streak_saved, should_notify
  FROM user_streaks
  WHERE user_id = p_user_id;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON user_streaks TO authenticated;
GRANT SELECT ON user_daily_activity TO authenticated;
GRANT SELECT ON seasonal_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_challenge_progress TO authenticated;
GRANT ALL ON user_notification_settings TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
