// lib/supabase.ts — Supabase client (server)

import { createClient } from '@supabase/supabase-js';

// ─── Server client (service role — API routes only, never expose to browser) ──
export function createServerClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  if (!url || !key) throw new Error('[supabase] Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ─── Types ────────────────────────────────────────────────────────────────
export type AssessmentStatus = 'draft' | 'complete' | 'paid' | 'report_ready' | 'refunded';

export interface DbAssessment {
  id: string;
  user_id: string;
  user_email: string;
  org_name: string | null;
  er: number;
  pr: number;
  ri: number;
  a: number;
  oss: number;
  ssc: number;
  risk_zone: string;
  hp_lr_trap: boolean;
  status: AssessmentStatus;
  report_storage_path: string | null;
  stripe_session_id: string | null;
  conversation_id: string | null;
  answers: number[][] | null;
  sub_indicators: { er?: number[]; pr?: number[]; ri?: number[]; a?: number[] } | null;
  journey_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbConversation {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  assessment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}
