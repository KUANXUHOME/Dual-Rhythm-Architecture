-- 003_sub_indicators.sql — Sub-indicator capture + refund status + webhook_failures table
-- Run in Supabase SQL Editor after 002_rls.sql.

-- ── Sub-indicators + journey arc (Phase 2) ──
ALTER TABLE theossindex_assessments
  ADD COLUMN IF NOT EXISTS sub_indicators JSONB,  -- {"er":[5×0-100],"pr":[5],"ri":[5],"a":[5]}
  ADD COLUMN IF NOT EXISTS journey_id UUID;       -- Phase 2 transformation arc

-- Extend status to include 'refunded' (admin refunds via Stripe)
ALTER TABLE theossindex_assessments
  DROP CONSTRAINT IF EXISTS theossindex_assessments_status_check;
ALTER TABLE theossindex_assessments
  ADD CONSTRAINT theossindex_assessments_status_check
  CHECK (status IN ('draft','complete','paid','report_ready','refunded'));

-- ── webhook_failures table (H10 compensation) ──
-- Records Stripe webhook processing failures for admin manual retry/regeneration.
CREATE TABLE IF NOT EXISTS webhook_failures (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES theossindex_assessments(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  error         TEXT,
  retries       INTEGER NOT NULL DEFAULT 0,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whfail_unresolved
  ON webhook_failures(assessment_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_whfail_created
  ON webhook_failures(created_at DESC);

ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_anon_whfail" ON webhook_failures
  FOR ALL USING (false) WITH CHECK (false);
