-- supabase/migrations/001_init.sql
-- DUAL-RHYTHM ARCHITECTURE™ — Database Schema
-- Run once in Supabase SQL Editor

-- ═══════════════════════════════════════════════════
-- 1. Assessments
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS theossindex_assessments (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              TEXT NOT NULL,
  user_email           TEXT NOT NULL,
  org_name             TEXT,
  answers              JSONB,
  er                   NUMERIC(5,1) NOT NULL,
  pr                   NUMERIC(5,1) NOT NULL,
  ri                   NUMERIC(5,1) NOT NULL,
  a                    NUMERIC(5,1) NOT NULL,
  oss                  NUMERIC(5,1) NOT NULL,
  ssc                  NUMERIC(5,1) NOT NULL,
  risk_zone            TEXT NOT NULL CHECK (risk_zone IN (
                         'structural_advantage','controlled_stability',
                         'fragile_balance','destabilization_risk','structural_instability')),
  hp_lr_trap           BOOLEAN NOT NULL DEFAULT FALSE,
  status               TEXT NOT NULL DEFAULT 'complete'
                         CHECK (status IN ('draft','complete','paid','report_ready')),
  report_storage_path  TEXT,
  stripe_session_id    TEXT,
  conversation_id      UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user    ON theossindex_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status  ON theossindex_assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created ON theossindex_assessments(user_id, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION _update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_assessments_updated
  BEFORE UPDATE ON theossindex_assessments
  FOR EACH ROW EXECUTE FUNCTION _update_updated_at();

-- RLS: only service role + user can access their own rows
ALTER TABLE theossindex_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON theossindex_assessments USING (TRUE) WITH CHECK (TRUE);

-- ═══════════════════════════════════════════════════
-- 2. Conversations (AI chat history)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dra_conversations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  org_name    TEXT,
  messages    JSONB NOT NULL DEFAULT '[]'::JSONB,
  assessment_id UUID REFERENCES theossindex_assessments(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user    ON dra_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON dra_conversations(user_id, created_at DESC);

ALTER TABLE dra_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON dra_conversations USING (TRUE) WITH CHECK (TRUE);

-- ═══════════════════════════════════════════════════
-- 3. Usage logs (daily per-user rate limiting)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS usage_logs (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            TEXT NOT NULL,
  date               DATE NOT NULL,
  ai_messages_count  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_logs(user_id, date);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON usage_logs USING (TRUE) WITH CHECK (TRUE);

-- Increment function for atomic counter updates
CREATE OR REPLACE FUNCTION increment_usage(p_user_id TEXT, p_date DATE)
RETURNS VOID LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN
  INSERT INTO usage_logs (user_id, date, ai_messages_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET ai_messages_count = usage_logs.ai_messages_count + 1;
END;
$$;

-- ═══════════════════════════════════════════════════
-- 4. Lead capture (email gate)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dra_leads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL,
  source     TEXT,
  oss_score  NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dra_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON dra_leads USING (TRUE) WITH CHECK (TRUE);

-- ═══════════════════════════════════════════════════
-- 5. Supabase Storage bucket for PDF reports
-- ═══════════════════════════════════════════════════
-- Run via Supabase Dashboard: Storage → New Bucket → "theossindex-reports" → Private
-- OR:
INSERT INTO storage.buckets (id, name, public)
VALUES ('theossindex-reports', 'theossindex-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'dra_service_storage'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "dra_service_storage" ON storage.objects
      FOR ALL USING (bucket_id = 'theossindex-reports')
    $policy$;
  END IF;
END $$;
