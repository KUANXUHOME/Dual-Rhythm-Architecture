// lib/entitlements.ts — Tier-based entitlement resolution
// Replaces the old "isPaid = has paid assessment" logic in usage-limits.ts

import { createServerClient } from './supabase';

export type Tier = 'free' | 'ceo_diagnostic' | 'consultant' | 'enterprise';

export interface Entitlement {
  tier: Tier;
  dailyMessageLimit: number;
  canDownloadPDF: boolean;
  canViewTrend: boolean;
  canAccessBenchmark: boolean;
  canBoardRhythm: boolean;
  canCEOBrief: boolean;
  maxOrgProfiles: number;
  tierLabel: string;
}

const ENTITLEMENTS: Record<Tier, Omit<Entitlement, 'tier'>> = {
  free: {
    dailyMessageLimit: 20,
    canDownloadPDF: false,
    canViewTrend: false,
    canAccessBenchmark: false,
    canBoardRhythm: false,
    canCEOBrief: false,
    maxOrgProfiles: 1,
    tierLabel: 'Free',
  },
  ceo_diagnostic: {
    dailyMessageLimit: 100,
    canDownloadPDF: true,
    canViewTrend: false,
    canAccessBenchmark: false,
    canBoardRhythm: false,
    canCEOBrief: false,
    maxOrgProfiles: 1,
    tierLabel: 'CEO Diagnostic',
  },
  consultant: {
    dailyMessageLimit: 100,
    canDownloadPDF: true,
    canViewTrend: true,
    canAccessBenchmark: true,
    canBoardRhythm: false,
    canCEOBrief: true,
    maxOrgProfiles: 5,
    tierLabel: 'Consultant License',
  },
  enterprise: {
    dailyMessageLimit: 100,
    canDownloadPDF: true,
    canViewTrend: true,
    canAccessBenchmark: true,
    canBoardRhythm: true,
    canCEOBrief: true,
    maxOrgProfiles: 10,
    tierLabel: 'Enterprise',
  },
};

const SUB_TIER_MAP: Record<string, Tier> = {
  quick_score: 'free',
  ceo_diagnostic: 'ceo_diagnostic',
  consultant: 'consultant',
  quarterly_track: 'consultant',
  enterprise: 'enterprise',
  certification: 'enterprise',
};

export function getEntitlement(tier: Tier): Entitlement {
  return { tier, ...ENTITLEMENTS[tier] };
}

export const FREE_ENTITLEMENT = getEntitlement('free');

/**
 * Resolve a user's entitlement by checking:
 * 1. Active subscription (trialing/active/past_due)
 * 2. Any paid assessment (ceo_diagnostic one-time)
 * 3. Fall back to free
 */
export async function resolveEntitlement(userId: string): Promise<Entitlement> {
  const db = createServerClient();

  // 1. Check active subscription
  const { data: sub } = await db
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sub) {
    const tier = SUB_TIER_MAP[sub.tier] ?? 'free';
    return getEntitlement(tier);
  }

  // 2. Check for any paid assessment (one-time $299)
  const { data: paid } = await db
    .from('theossindex_assessments')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['paid', 'report_ready'])
    .limit(1);

  if (paid && paid.length > 0) {
    return getEntitlement('ceo_diagnostic');
  }

  // 3. Free
  return FREE_ENTITLEMENT;
}
