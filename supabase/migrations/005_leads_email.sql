-- 005_leads_email.sql — Lead capture extensions + email log
-- Run in Supabase SQL Editor after 004_subscriptions.sql.

-- ── Leads table extensions ──
ALTER TABLE dra_leads
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS org_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','converted','archived'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique
  ON dra_leads(email) WHERE email IS NOT NULL;

-- ── Email send log ──
CREATE TABLE IF NOT EXISTS email_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT,
  to_email     TEXT NOT NULL,
  template     TEXT NOT NULL,
  resend_id    TEXT,
  status       TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','delivered','bounced','complained','failed')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_user     ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_template ON email_log(template);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_anon_email" ON email_log FOR ALL USING (false) WITH CHECK (false);
