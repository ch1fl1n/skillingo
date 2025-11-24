-- ===== SKILL PROFICIENCY SCORES TABLE =====
-- Tracks user's proficiency score (0-160) for each skill
CREATE TABLE IF NOT EXISTS skill_proficiency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_score INT NOT NULL DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 160),
  cefr_level VARCHAR(20) NOT NULL, -- 'very_early_a1', 'early_a1', 'high_a1', 'a2', etc.
  previous_score INT DEFAULT 0,
  assessments_completed INT NOT NULL DEFAULT 0,
  last_assessment_date TIMESTAMP WITH TIME ZONE,
  next_assessment_date TIMESTAMP WITH TIME ZONE,
  confidence_interval INT DEFAULT 20, -- ±N points statistical confidence
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One score record per user per skill
  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_proficiency_scores_user_id ON skill_proficiency_scores(user_id);
CREATE INDEX idx_proficiency_scores_skill_id ON skill_proficiency_scores(skill_id);
CREATE INDEX idx_proficiency_scores_cefr_level ON skill_proficiency_scores(cefr_level);
CREATE INDEX idx_proficiency_scores_current_score ON skill_proficiency_scores(current_score);

-- ===== PROFICIENCY MILESTONES TABLE =====
-- Define milestones for each skill and CEFR level
CREATE TABLE IF NOT EXISTS proficiency_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  cefr_level VARCHAR(20) NOT NULL,
  score_threshold INT NOT NULL CHECK (score_threshold >= 0 AND score_threshold <= 160),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  badge_icon VARCHAR(100), -- Emoji or icon identifier
  xp_reward INT NOT NULL DEFAULT 0, -- Gamification integration!
  unlocks JSONB, -- What becomes available (lessons, features, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One milestone per skill per CEFR level
  UNIQUE(skill_id, cefr_level)
);

CREATE INDEX idx_milestones_skill_id ON proficiency_milestones(skill_id);
CREATE INDEX idx_milestones_score_threshold ON proficiency_milestones(score_threshold);

-- ===== SEED DATA: DEFAULT MILESTONES =====
-- Create default milestones for each CEFR level

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'very_early_a1',
  0,
  'First Steps',
  'Welcome to your learning journey!',
  '🌱',
  50
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'early_a1',
  10,
  'Foundation Builder',
  'Building your core knowledge!',
  '🧱',
  100
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'high_a1',
  20,
  'Basic Proficiency',
  'You can apply fundamental concepts!',
  '📚',
  150
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'a2',
  30,
  'Confident Learner',
  'Building independence in your skills!',
  '💪',
  250
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'early_b1',
  60,
  'Intermediate Mastery',
  'Handling real-world applications!',
  '🚀',
  500
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'high_b1',
  80,
  'Skilled Practitioner',
  'Strong competence demonstrated!',
  '⭐',
  750
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'early_b2',
  100,
  'Advanced Abilities',
  'Professional-level skills emerging!',
  '🌟',
  1000
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'high_b2',
  115,
  'Professional Proficiency',
  'You can work at a professional level!',
  '🏆',
  1500
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

INSERT INTO proficiency_milestones (skill_id, cefr_level, score_threshold, title, description, badge_icon, xp_reward)
SELECT 
  s.id,
  'c1_c2',
  130,
  'Expert Mastery',
  'You have achieved expert-level mastery!',
  '👑',
  2500
FROM skills s
ON CONFLICT (skill_id, cefr_level) DO NOTHING;

-- ===== COMMENTS & DOCUMENTATION =====

COMMENT ON TABLE skill_proficiency_scores IS 'Tracks user proficiency using 0-160 CEFR-aligned scoring system, similar to Duolingo Score';
COMMENT ON TABLE proficiency_assessments IS 'Question bank for adaptive proficiency assessments with varying difficulty levels';
COMMENT ON TABLE user_assessment_attempts IS 'Complete history of all user assessment attempts for analytics';
COMMENT ON TABLE proficiency_score_history IS 'Time-series data of score changes for progress tracking and visualization';
COMMENT ON TABLE proficiency_milestones IS 'Achievement milestones at each CEFR level with rewards';
COMMENT ON TABLE score_decay_config IS 'Configuration for score decay mechanism to encourage regular practice';
COMMENT ON TABLE proficiency_certificates IS 'Official certificates recognizing skill proficiency achievements';
