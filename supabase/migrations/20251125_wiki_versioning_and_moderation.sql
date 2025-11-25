-- ============================================================================
-- RSK-001: Data Integrity - Wiki Versioning and Moderation
-- ============================================================================

-- Enable uuid and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Core Wiki Tables with Versioning and Optimistic Locking
-- ============================================================================

-- wiki_pages: live content with integer version for optimistic locking
CREATE TABLE IF NOT EXISTS wiki_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'archived')),
  version INT NOT NULL DEFAULT 1, -- incremented on each edit
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}' -- stores tags, category, etc.
);

-- wiki_revisions: immutable history of all edits
CREATE TABLE IF NOT EXISTS wiki_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  version INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  diff_from_prev TEXT, -- JSON diff summary (not full diff to save space)
  UNIQUE(page_id, version)
);

-- wiki_audit: detailed audit log for compliance
CREATE TABLE IF NOT EXISTS wiki_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'approve', 'reject', 'rollback', 'archive')),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_role TEXT NOT NULL, -- snapshot of role at time of action
  object_id TEXT, -- revision id or other context
  diff_summary JSONB, -- what changed
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- anomalies: tracks unusual patterns (repeated reverts, flagged content)
CREATE TABLE IF NOT EXISTS wiki_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES wiki_pages(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('high_revert_rate', 'spam_flag', 'edit_conflict', 'vandalism_pattern')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  count INT NOT NULL DEFAULT 1,
  threshold_exceeded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- Indexes for Performance and Queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON wiki_pages(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_status_created ON wiki_pages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_created_by ON wiki_pages(created_by);
CREATE INDEX IF NOT EXISTS idx_wiki_revisions_page_id ON wiki_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_revisions_created_by ON wiki_revisions(created_by);
CREATE INDEX IF NOT EXISTS idx_wiki_audit_page_id_created ON wiki_audit(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_audit_actor_id ON wiki_audit(actor_id);
CREATE INDEX IF NOT EXISTS idx_wiki_audit_action ON wiki_audit(action);
CREATE INDEX IF NOT EXISTS idx_wiki_anomalies_resolved ON wiki_anomalies(resolved, threshold_exceeded_at DESC);

-- ============================================================================
-- Materialized View for Public Content (Read-Only, Approved Only)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS wiki_public AS
  SELECT
    id,
    slug,
    title,
    content,
    version,
    created_by,
    created_at,
    approved_by,
    approved_at,
    metadata
  FROM wiki_pages
  WHERE status = 'approved' AND approved_at IS NOT NULL
  ORDER BY created_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wiki_public_id ON wiki_public(id);
CREATE INDEX IF NOT EXISTS idx_wiki_public_slug ON wiki_public(slug);

-- Refresh command (typically run via scheduler or trigger)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY wiki_public;

-- ============================================================================
-- Trigger: Auto-increment version and record revision on update
-- ============================================================================

CREATE OR REPLACE FUNCTION wiki_handle_update()
RETURNS TRIGGER AS $$
DECLARE
  v_old_version INT;
  v_new_version INT;
BEGIN
  -- Check for optimistic locking conflict
  IF OLD.version != NEW.version THEN
    RAISE EXCEPTION 'Version mismatch: expected %, got %', OLD.version, NEW.version
      USING ERRCODE = 'custom_conflict';
  END IF;

  v_old_version := OLD.version;
  v_new_version := OLD.version + 1;
  NEW.version := v_new_version;
  NEW.updated_at := now();

  -- Insert revision record (audit trail)
  INSERT INTO wiki_revisions (page_id, version, title, content, change_summary, created_by, diff_from_prev)
  VALUES (
    NEW.id,
    v_new_version,
    NEW.title,
    NEW.content,
    COALESCE(NEW.metadata->>'summary', 'Edit'),
    (SELECT auth.uid()), -- Current user from JWT
    jsonb_build_object(
      'old_title', OLD.title,
      'new_title', NEW.title,
      'content_changed', OLD.content != NEW.content
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wiki_update_trigger ON wiki_pages;
CREATE TRIGGER wiki_update_trigger
  BEFORE UPDATE ON wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION wiki_handle_update();

-- ============================================================================
-- Trigger: Log all actions to audit table
-- ============================================================================

CREATE OR REPLACE FUNCTION wiki_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_actor_id UUID;
  v_actor_role TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    v_actor_id := '00000000-0000-0000-0000-000000000000'::uuid; -- system/anonymous
  END IF;

  -- Determine action from TG_OP
  CASE TG_OP
    WHEN 'INSERT' THEN v_action := 'create';
    WHEN 'UPDATE' THEN
      IF NEW.status != OLD.status THEN
        v_action := CASE
          WHEN NEW.status = 'approved' THEN 'approve'
          WHEN NEW.status = 'archived' THEN 'archive'
          ELSE 'update'
        END;
      ELSE
        v_action := 'update';
      END IF;
    ELSE v_action := 'unknown';
  END CASE;

  -- Get actor role from auth.users metadata
  SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role' INTO v_actor_role;
  IF v_actor_role IS NULL THEN v_actor_role := 'learner'; END IF;

  INSERT INTO wiki_audit (page_id, action, actor_id, actor_role, object_id, diff_summary)
  VALUES (
    NEW.id,
    v_action,
    v_actor_id,
    v_actor_role,
    NEW.id::text,
    jsonb_build_object(
      'status_change', CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('from', OLD.status, 'to', NEW.status) ELSE NULL END,
      'version', NEW.version
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wiki_audit_trigger ON wiki_pages;
CREATE TRIGGER wiki_audit_trigger
  AFTER INSERT OR UPDATE ON wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION wiki_audit_log();

-- ============================================================================
-- Trigger: Detect and log anomalies (e.g., high revert rate)
-- ============================================================================

CREATE OR REPLACE FUNCTION wiki_detect_anomalies()
RETURNS TRIGGER AS $$
DECLARE
  v_revert_count INT;
  v_revert_threshold INT := 3; -- flag if >3 reverts in 1 hour
BEGIN
  IF TG_OP = 'INSERT' AND NEW.action = 'rollback' THEN
    -- Count reverts in last hour
    SELECT COUNT(*) INTO v_revert_count
    FROM wiki_audit
    WHERE page_id = NEW.page_id
      AND action = 'rollback'
      AND created_at > now() - interval '1 hour';

    IF v_revert_count > v_revert_threshold THEN
      INSERT INTO wiki_anomalies (page_id, anomaly_type, severity, count)
      VALUES (NEW.page_id, 'high_revert_rate', 'high', v_revert_count)
      ON CONFLICT DO NOTHING;

      -- Notify anomalies channel (Realtime)
      PERFORM pg_notify('anomalies', jsonb_build_object(
        'type', 'high_revert_rate',
        'page_id', NEW.page_id,
        'count', v_revert_count
      )::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wiki_anomaly_trigger ON wiki_audit;
CREATE TRIGGER wiki_anomaly_trigger
  AFTER INSERT ON wiki_audit
  FOR EACH ROW
  EXECUTE FUNCTION wiki_detect_anomalies();

-- ============================================================================
-- RLS (Row Level Security) Policies for wiki_pages
-- ============================================================================

ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_anomalies ENABLE ROW LEVEL SECURITY;

-- Learners can read approved content only
CREATE POLICY "learners_read_approved"
  ON wiki_pages
  FOR SELECT
  USING (
    status = 'approved'
    OR (auth.uid() = created_by AND status = 'pending') -- draft owned by self
  );

-- Learners can create (insert) but default to pending
CREATE POLICY "learners_create_pending"
  ON wiki_pages
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND status = 'pending'
  );

-- Learners can update their own pending content before moderation
CREATE POLICY "learners_update_own_pending"
  ON wiki_pages
  FOR UPDATE
  USING (
    auth.uid() = created_by
    AND status = 'pending'
    AND (SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text = 'learner'
  )
  WITH CHECK (
    auth.uid() = created_by
    AND status = 'pending'
  );

-- Moderators can read, update (approve/reject), and view all
CREATE POLICY "moderators_full_access"
  ON wiki_pages
  FOR ALL
  USING (
    (SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text IN ('moderator', 'admin')
  );

-- Admins can delete
CREATE POLICY "admins_delete"
  ON wiki_pages
  FOR DELETE
  USING (
    (SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text = 'admin'
  );

-- RLS on wiki_revisions: readonly for authenticated users; audit admins can access
CREATE POLICY "revisions_read_authenticated"
  ON wiki_revisions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "revisions_admins_only"
  ON wiki_revisions
  FOR ALL
  USING (
    (SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text = 'admin'
  );

-- RLS on wiki_audit: admins/moderators only
CREATE POLICY "audit_moderators_and_admins"
  ON wiki_audit
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text IN ('moderator', 'admin')
  );

-- RLS on anomalies: admins only
CREATE POLICY "anomalies_admins_only"
  ON wiki_anomalies
  FOR SELECT
  USING (
    (SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role')::text = 'admin'
  );

-- ============================================================================
-- Helper Function: Rollback to a prior revision
-- ============================================================================

CREATE OR REPLACE FUNCTION wiki_rollback_to_revision(
  p_page_id UUID,
  p_target_version INT
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_revision wiki_revisions%ROWTYPE;
  v_current_version INT;
  v_rows_updated INT;
BEGIN
  -- Fetch the revision to restore
  SELECT * INTO v_revision
  FROM wiki_revisions
  WHERE page_id = p_page_id AND version = p_target_version
  LIMIT 1;

  IF v_revision IS NULL THEN
    RETURN QUERY SELECT false, 'Revision not found'::TEXT;
    RETURN;
  END IF;

  -- Get current version
  SELECT version INTO v_current_version
  FROM wiki_pages
  WHERE id = p_page_id;

  -- Perform optimistic update: set content from revision, increment version
  UPDATE wiki_pages
  SET
    title = v_revision.title,
    content = v_revision.content,
    version = v_current_version + 1,
    metadata = metadata || jsonb_build_object('rolled_back_from', v_current_version)
  WHERE id = p_page_id AND version = v_current_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN QUERY SELECT false, 'Rollback conflict: version mismatch'::TEXT;
  ELSE
    -- Log rollback in audit
    INSERT INTO wiki_audit (page_id, action, actor_id, actor_role, object_id, diff_summary)
    VALUES (
      p_page_id,
      'rollback',
      auth.uid(),
      COALESCE((SELECT (auth.jwt()->>'app_metadata')::jsonb->>'role'), 'learner'),
      p_target_version::text,
      jsonb_build_object('rolled_back_to_version', p_target_version)
    );

    RETURN QUERY SELECT true, format('Successfully rolled back to version %s', p_target_version)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grants and Permissions
-- ============================================================================

GRANT SELECT ON wiki_pages TO authenticated;
GRANT INSERT ON wiki_pages TO authenticated;
GRANT UPDATE ON wiki_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON wiki_revisions TO authenticated;
GRANT SELECT ON wiki_audit TO authenticated;
GRANT SELECT ON wiki_anomalies TO authenticated;
GRANT SELECT ON wiki_public TO anon; -- Anonymous users can read approved content
