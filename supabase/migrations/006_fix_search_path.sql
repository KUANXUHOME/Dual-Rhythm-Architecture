-- 006_fix_search_path.sql — Fix Supabase "variable search_path" security warnings
-- Run this in Supabase SQL Editor if you already ran migrations 001-005 and got warnings.
-- This recreates the functions with explicit search_path = public.

-- Drop and recreate _update_updated_at with search_path
DROP FUNCTION IF EXISTS _update_updated_at();
CREATE OR REPLACE FUNCTION _update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- Drop and recreate increment_usage with search_path
DROP FUNCTION IF EXISTS increment_usage(TEXT, DATE);
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

-- Verify (should return 0 rows = no warnings)
SELECT proname, proconfig
FROM pg_proc
WHERE proname IN ('_update_updated_at', 'increment_usage')
AND NOT (proconfig @> ARRAY['search_path=public']);
