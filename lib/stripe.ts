// lib/stripe.ts — Stripe client + payment links (v22 API)

import Stripe from 'stripe';

// Lazy-init: the Stripe client is only constructed on first actual use (runtime),
// not at module-evaluation time (build). This prevents "Neither apiKey nor
// config.authenticator provided" during `next build` when STRIPE_SECRET_KEY
// is not present in the build environment.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// All 6 Stripe Payment Links
export const PAYMENT_LINKS = {
  quick_score:        'https://buy.stripe.com/bJefZhcnpbI407CdmZ2Fa00',
  ceo_diagnostic:     'https://buy.stripe.com/dRmdR9879bI45rW96J2Fa01',  // $299
  consultant_license: 'https://buy.stripe.com/bJe9AT3QTh2ocUofv72Fa02',  // $499/mo
  quarterly_track:    'https://buy.stripe.com/4gM8wPfzBaE05rW2Il2Fa03',  // $699/qtr
  enterprise:         'https://buy.stripe.com/fZubJ19bd7rO07C96J2Fa04',  // $2,500/mo
  certification:      'https://buy.stripe.com/6oU7sL7358vSdYs0Ad2Fa05',  // $5,000/yr
} as const;

/** Build CEO Diagnostic payment link with assessment ID for webhook matching */
export function buildUpgradeLink(assessmentId: string, email?: string): string {
  const url = new URL(PAYMENT_LINKS.ceo_diagnostic);
  url.searchParams.set('client_reference_id', assessmentId);
  if (email) url.searchParams.set('prefilled_email', email);
  return url.toString();
}

/** Build subscription payment link for consultant or enterprise tier */
export function buildSubscriptionLink(tier: 'consultant' | 'enterprise', email?: string): string {
  const link = tier === 'consultant' ? PAYMENT_LINKS.consultant_license : PAYMENT_LINKS.enterprise;
  const url = new URL(link);
  if (email) url.searchParams.set('prefilled_email', email);
  return url.toString();
}
