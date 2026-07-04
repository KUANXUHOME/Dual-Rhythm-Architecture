-- 002_rls.sql — Defense-in-depth: deny anon/authenticated direct table access
-- dra-v2 uses Clerk (not Supabase Auth), so auth.uid() is NULL for all requests.
-- Service-role key bypasses RLS, so all server-side access continues to work.
-- This ensures that even if the anon/publishable key leaks, no data is readable.
-- Run in Supabase SQL Editor.

-- Drop the permissive policies from 001_init.sql
DROP POLICY IF EXISTS "service_full" ON theossindex_assessments;
DROP POLICY IF EXISTS "service_full" ON dra_conversations;
DROP POLICY IF EXISTS "service_full" ON usage_logs;
DROP POLICY IF EXISTS "service_full" ON dra_leads;

-- Deny all direct (anon/authenticated) access; only service role can read/write
CREATE POLICY "deny_anon_assessments" ON theossindex_assessments
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "deny_anon_conversations" ON dra_conversations
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "deny_anon_usage" ON usage_logs
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "deny_anon_leads" ON dra_leads
  FOR ALL USING (false) WITH CHECK (false);
