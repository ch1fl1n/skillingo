-- ============================================================================
-- RSK-003: Performance Degradation - Pagination, Indexes, Caching
-- ============================================================================

-- ============================================================================
-- Materialized Views for Popular Content (Cached Aggregations)
-- ============================================================================

-- Popular wiki articles (top by views/helpful votes)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_wiki_articles AS
  SELECT
    wp.id,
    wp.slug,
    wp.title,
    wp.version,
    wp.created_by,
    wp.approved_at,
    COALESCE((wp.metadata->>'view_count')::INT, 0) as view_count,
    COALESCE((wp.metadata->>'helpful_votes')::INT, 0) as helpful_votes,
    LENGTH(wp.content) as content_length
  FROM wiki_pages wp
  WHERE wp.status = 'approved'
  ORDER BY helpful_votes DESC, view_count DESC
  LIMIT 100;

CREATE UNIQUE INDEX idx_popular_wiki_articles_id ON popular_wiki_articles(id);

-- Top contributors (by lesson completions + wiki edits)
CREATE MATERIALIZED VIEW IF NOT EXISTS top_contributors AS
  SELECT
    u.id,
    u.email,
    COUNT(DISTINCT la.lesson_id) as lessons_completed,
    COUNT(DISTINCT wr.page_id) as articles_contributed,
    MAX(u.total_xp) as current_xp
  FROM auth.users u
  LEFT JOIN lesson_attempts la ON u.id = la.user_id AND la.completed_at IS NOT NULL
  LEFT JOIN wiki_revisions wr ON u.id = wr.created_by
  GROUP BY u.id, u.email
  HAVING COUNT(DISTINCT la.lesson_id) > 0 OR COUNT(DISTINCT wr.page_id) > 0
  ORDER BY current_xp DESC
  LIMIT 500;

CREATE UNIQUE INDEX idx_top_contributors_id ON top_contributors(id);

-- ============================================================================
-- Enhanced Indexes for Query Performance
-- ============================================================================

-- lesson_attempts: fast queries by user and timestamp
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_completed ON lesson_attempts(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_lesson_user_completed ON lesson_attempts(lesson_id, user_id, completed_at DESC);

-- community_posts: efficient filtering and sorting
CREATE INDEX IF NOT EXISTS idx_community_posts_status_created ON community_posts(status, created_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_community_posts_user_created ON community_posts(user_id, created_at DESC);

-- user_progress: fast lookups by user and skill
CREATE INDEX IF NOT EXISTS idx_user_progress_user_skill ON user_progress(user_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_updated ON user_progress(user_id, updated_at DESC);

-- lessons: query by skill and order
CREATE INDEX IF NOT EXISTS idx_lessons_skill_order ON lessons(skill_id, order ASC);

-- Partial indexes for commonly filtered states
CREATE INDEX IF NOT EXISTS idx_moderation_queue_pending ON moderation_queue(created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_progress_incomplete ON user_progress(user_id) WHERE completed_at IS NULL;

-- ============================================================================
-- Computed Column View for User Level (Performance Cache)
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_user_level(p_total_xp INT)
RETURNS INT AS $$
BEGIN
  RETURN FLOOR(SQRT(p_total_xp::FLOAT / 100.0))::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Materialized view of user stats (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats_cache AS
  SELECT
    id,
    email,
    total_xp,
    compute_user_level(total_xp) as level,
    created_at,
    updated_at
  FROM auth.users
  WHERE total_xp > 0
  ORDER BY total_xp DESC;

CREATE UNIQUE INDEX idx_user_stats_cache_id ON user_stats_cache(id);

-- ============================================================================
-- Function: Keyset Pagination for Efficient Scrolling
-- Parameters:
--   p_last_id: ID of the last item from previous page (for keyset continuation)
--   p_last_created: created_at timestamp of the last item
--   p_limit: rows per page (default 20)
-- Returns: next batch of community posts
-- ============================================================================

CREATE OR REPLACE FUNCTION paginate_community_posts(
  p_status TEXT DEFAULT 'approved',
  p_last_id UUID DEFAULT NULL,
  p_last_created TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  helpful_votes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.title,
    cp.content,
    cp.user_id,
    cp.created_at,
    COALESCE((cp.metadata->>'helpful_votes')::INT, 0) as helpful_votes
  FROM community_posts cp
  WHERE
    cp.status = p_status
    AND (
      p_last_created IS NULL
      OR (cp.created_at, cp.id) < (p_last_created, p_last_id)
    )
  ORDER BY cp.created_at DESC, cp.id DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get lessons with summary (minimal columns for list view)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lessons_summary(p_skill_id INT)
RETURNS TABLE (
  id INT,
  skill_id INT,
  title TEXT,
  order_num INT,
  estimated_duration INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.skill_id,
    l.title,
    l.order,
    l.estimated_duration
  FROM lessons l
  WHERE l.skill_id = p_skill_id
  ORDER BY l.order ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get user progress summary (for dashboard, minimal data)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_progress_summary(p_user_id UUID)
RETURNS TABLE (
  skill_id INT,
  skill_name TEXT,
  proficiency_score FLOAT,
  lessons_completed INT,
  total_lessons INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    COALESCE(sps.proficiency_score, 0.0),
    COUNT(DISTINCT CASE WHEN la.completed_at IS NOT NULL THEN la.lesson_id END)::INT,
    COUNT(DISTINCT l.id)::INT
  FROM skills s
  LEFT JOIN skill_proficiency_scores sps ON s.id = sps.skill_id AND sps.user_id = p_user_id
  LEFT JOIN lessons l ON s.id = l.skill_id
  LEFT JOIN lesson_attempts la ON l.id = la.lesson_id AND la.user_id = p_user_id
  GROUP BY s.id, s.name, sps.proficiency_score
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Caching Strategy via JSON Aggregates (reduce round-trips)
-- ============================================================================

-- Fetch all metadata for a user in one query (lessons, progress, streaks, settings)
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  total_xp INT,
  level INT,
  current_streak INT,
  longest_streak INT,
  active_challenges INT,
  dashboard_data JSONB
) AS $$
DECLARE
  v_dashboard JSONB;
BEGIN
  SELECT
    u.id,
    u.total_xp,
    compute_user_level(u.total_xp),
    COALESCE(us.current_streak, 0),
    COALESCE(us.longest_streak, 0),
    COUNT(DISTINCT CASE WHEN ucp.completed = false THEN ucp.challenge_id END),
    jsonb_build_object(
      'skills', jsonb_agg(DISTINCT jsonb_build_object(
        'skill_id', ps.skill_id,
        'proficiency', ps.proficiency_score
      )),
      'recent_activity', jsonb_agg(DISTINCT jsonb_build_object(
        'lesson_id', la.lesson_id,
        'completed_at', la.completed_at
      ) ORDER BY la.created_at DESC LIMIT 5)
    )
  INTO
    user_id, total_xp, level, current_streak, longest_streak, active_challenges, v_dashboard
  FROM auth.users u
  LEFT JOIN user_streaks us ON u.id = us.user_id
  LEFT JOIN skill_proficiency_scores ps ON u.id = ps.user_id
  LEFT JOIN lesson_attempts la ON u.id = la.user_id
  LEFT JOIN user_challenge_progress ucp ON u.id = ucp.user_id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.total_xp, us.current_streak, us.longest_streak;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON popular_wiki_articles TO authenticated;
GRANT SELECT ON top_contributors TO authenticated;
GRANT SELECT ON user_stats_cache TO authenticated;
GRANT EXECUTE ON FUNCTION paginate_community_posts(TEXT, UUID, TIMESTAMPTZ, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lessons_summary(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;
