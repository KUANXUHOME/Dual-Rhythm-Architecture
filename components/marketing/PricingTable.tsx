// components/marketing/PricingTable.tsx — 3-tier pricing display
import { buildSubscriptionLink } from '@/lib/stripe';

const TIERS = [
  {
    name: 'CEO Diagnostic',
    price: '$299',
    period: 'one-time',
    desc: 'Full diagnostic + board-ready PDF report',
    features: [
      'AI-guided 10-minute diagnostic',
      'The OSS Index™ score (0–100)',
      '4-dimension breakdown (ER/PR/RI/A)',
      'HP/LR Trap detection',
      '3 priority recommendations',
      'Board-ready PDF report',
      '100 messages/day (permanent)',
    ],
    cta: 'Start Diagnostic',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Consultant License',
    price: '$499',
    period: '/month',
    desc: 'Quarterly tracking + trend + benchmarking',
    features: [
      'Everything in CEO Diagnostic',
      'Quarterly reassessments (4/yr)',
      'OSS™ 3-year trend charts',
      'RI leading-indicator tracking',
      'Industry benchmark comparison',
      'CEO Stability Brief generator',
      '5 organization profiles',
      'Quarterly email reminders',
    ],
    cta: 'Subscribe',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$2,500',
    period: '/month',
    desc: 'Board governance + multi-seat + API',
    features: [
      'Everything in Consultant License',
      'Board Decision Rhythm Module',
      '4-step quarterly control loop',
      'CEO Stability Brief (auto-generated)',
      'Trigger zone board actions',
      '10 seats (shared organization)',
      'Priority support',
      'API access (Phase 2)',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export function PricingTable({ email }: { email?: string }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {TIERS.map(tier => {
        const link = tier.name === 'Consultant License'
          ? buildSubscriptionLink('consultant', email)
          : tier.name === 'Enterprise'
            ? buildSubscriptionLink('enterprise', email)
            : tier.href;
        return (
          <div
            key={tier.name}
            className={`rounded-large p-6 border-2 flex flex-col ${
              tier.highlight
                ? 'border-primary bg-primary/5 shadow-lg scale-105'
                : 'border-border bg-white'
            }`}
          >
            {tier.highlight && (
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Recommended</div>
            )}
            <h3 className="text-lg font-bold text-ink mb-1">{tier.name}</h3>
            <p className="text-xs text-ink-muted mb-4">{tier.desc}</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-ink">{tier.price}</span>
              <span className="text-sm text-ink-muted">{tier.period}</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {tier.features.map((f, i) => (
                <li key={i} className="text-xs text-ink-muted flex items-start gap-2">
                  <span className="text-primary shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={link}
              className={`text-center text-sm font-semibold py-3 rounded-brand transition-all ${
                tier.highlight
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'border border-border text-ink hover:border-primary hover:text-primary'
              }`}
            >
              {tier.cta} →
            </a>
          </div>
        );
      })}
    </div>
  );
}
