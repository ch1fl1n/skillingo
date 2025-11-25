-- Post Ratings Table
CREATE TABLE IF NOT EXISTS post_ratings (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON post_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_rating_type ON post_ratings(rating_type);

-- Post Reports Table
CREATE TABLE IF NOT EXISTS post_reports (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_category TEXT NOT NULL CHECK (report_category IN ('offensive', 'spam', 'misinformation', 'inappropriate', 'other')),
  report_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_user_id ON post_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status);
CREATE INDEX IF NOT EXISTS idx_post_reports_created_at ON post_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE post_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_ratings
CREATE POLICY "Users can view all ratings" ON post_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own ratings" ON post_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON post_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_reports
CREATE POLICY "Admins can view all reports" ON post_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can view their own reports" ON post_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON post_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update post_reports updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_reports_updated_at_trigger
BEFORE UPDATE ON post_reports
FOR EACH ROW
EXECUTE FUNCTION update_post_reports_updated_at();

-- Function to count ratings for a post
CREATE OR REPLACE FUNCTION get_post_rating_counts(post_id BIGINT)
RETURNS TABLE(
  total_likes BIGINT,
  total_dislikes BIGINT,
  user_rating TEXT
) AS $$
DECLARE
  user_id_var UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM post_ratings WHERE post_ratings.post_id = post_id AND rating_type = 'like')::BIGINT,
    (SELECT COUNT(*) FROM post_ratings WHERE post_ratings.post_id = post_id AND rating_type = 'dislike')::BIGINT,
    (SELECT rating_type FROM post_ratings WHERE post_ratings.post_id = post_id AND user_id = user_id_var LIMIT 1)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE post_ratings IS 'Stores user ratings (like/dislike) for community posts';
COMMENT ON TABLE post_reports IS 'Stores reports of inappropriate community posts for moderation review';
COMMENT ON COLUMN post_ratings.rating_type IS 'Type of rating: like or dislike';
COMMENT ON COLUMN post_reports.status IS 'Report status: pending, reviewing, resolved, or dismissed';
