-- 004_subscriptions.sql — Subscription state machine + entitlement tracking
-- Run in Supabase SQL Editor after 003_sub_indicators.sql.

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  TEXT NOT NULL,
  user_email               TEXT NOT NULL,
  tier                     TEXT NOT NULL CHECK (tier IN
    ('quick_score','ceo_diagnostic','consultant','quarterly_track','enterprise','certification')),
  status                   TEXT NOT NULL CHECK (status IN
    ('trialing','active','past_due','canceled','reactivated')),
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT UNIQUE,
  stripe_price_id          TEXT,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT FALSE,
  grace_until              TIMESTAMPTZ,
  metadata                 JSONB DEFAULT '{}'::JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_user       ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status     ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_stripe_sub ON subscriptions(stripe_subscription_id);

CREATE TRIGGER trg_subs_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION _update_updated_at();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_anon_subs" ON subscriptions
  FOR ALL USING (false) WITH CHECK (false);
