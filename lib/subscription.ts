// lib/subscription.ts — Subscription state machine + Stripe webhook helpers

import { createServerClient } from './supabase';

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  user_email: string;
  tier: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'reactivated';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  grace_until: string | null;
}

// Map Stripe Price IDs to tiers. In production, these come from Stripe Dashboard.
// Payment Links already encode the price; subscription.metadata.tier is the fallback.
// Map Stripe Price IDs to tiers. In production, these come from Stripe Dashboard.
// Payment Links already encode the price; subscription.metadata.tier is the fallback.
const DEFAULT_TIER = 'consultant' as const;

// Optional price_id → tier map (extend as Stripe prices are created).
// metadata.tier always takes precedence; this is a fallback when metadata is absent.
const PRICE_TIER_MAP: Record<string, string> = {};

function inferTier(
  metadata: Record<string, string> | null | undefined,
  priceId?: string,
): string {
  if (metadata?.tier) return metadata.tier;
  if (priceId && PRICE_TIER_MAP[priceId]) return PRICE_TIER_MAP[priceId];
  // Fallback: if we can't determine, default to consultant (safest paid tier)
  return DEFAULT_TIER;
}

/**
 * Upsert a subscription record from a Stripe subscription event.
 * Called from webhook handler for customer.subscription.* events.
 */
export async function upsertSubscription(
  subscription: {
    id: string;
    customer: string | { id: string };
    status: string;
    current_period_start?: number;
    current_period_end?: number;
    cancel_at_period_end?: boolean;
    items?: { data: Array<{ price: { id: string } }> };
    metadata?: Record<string, string> | null;
  },
  userEmail: string,
  userId: string,
): Promise<void> {
  const db = createServerClient();
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = inferTier(subscription.metadata, priceId);
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const status = mapStripeStatus(subscription.status);
  const graceUntil = status === 'past_due'
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await db.from('subscriptions').upsert({
    user_id: userId,
    user_email: userEmail,
    tier,
    status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId ?? null,
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    grace_until: graceUntil,
  }, {
    onConflict: 'stripe_subscription_id',
  });
}

function mapStripeStatus(stripeStatus: string): SubscriptionRecord['status'] {
  switch (stripeStatus) {
    case 'trialing': return 'trialing';
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'unpaid': return 'canceled';
    default: return 'active';
  }
}

/**
 * Get the user's active subscription (if any).
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const db = createServerClient();
  const { data } = await db
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as SubscriptionRecord | null;
}

/**
 * Mark a subscription as canceled (called on subscription.deleted webhook).
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  const db = createServerClient();
  await db.from('subscriptions')
    .update({ status: 'canceled', grace_until: null })
    .eq('stripe_subscription_id', stripeSubscriptionId);
}
