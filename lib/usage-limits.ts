// lib/usage-limits.ts — Per-user daily usage limits (now powered by entitlements)
// Free users: 20 AI messages/day | Paid users: 100/day

import { createServerClient } from './supabase';
import { resolveEntitlement } from './entitlements';

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
  isPaid: boolean;
  tier: string;
}

export async function getUsageStatus(userId: string): Promise<UsageStatus> {
  const db = createServerClient();
  const today = new Date().toISOString().slice(0, 10);

  // Resolve entitlement (checks subscription + paid assessment)
  const entitlement = await resolveEntitlement(userId);
  const limit = entitlement.dailyMessageLimit;
  const isPaid = entitlement.tier !== 'free';

  // Get today's usage
  const { data: usage } = await db
    .from('usage_logs')
    .select('ai_messages_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const used = usage?.ai_messages_count ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    exceeded: used >= limit,
    isPaid,
    tier: entitlement.tier,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const db = createServerClient();
  const today = new Date().toISOString().slice(0, 10);

  await db.rpc('increment_usage', { p_user_id: userId, p_date: today });
}
