// app/dashboard/page.tsx — Board-ready dashboard with trend, radar, benchmark, trigger zones
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import {
  RISK_ZONE_META,
  TRIGGER_ZONE_META,
  getTriggerZone,
  getTrendAlert,
  type TrendAlert,
} from '@/lib/theossindex-engine';
import { formatShortDate } from '@/lib/utils';
import { buildUpgradeLink, buildSubscriptionLink } from '@/lib/stripe';
import { resolveEntitlement } from '@/lib/entitlements';
import { getBenchmarks } from '@/lib/benchmark';
import { OssTrendChart } from '@/components/dashboard/OssTrendChart';
import { DimensionRadar } from '@/components/dashboard/DimensionRadar';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import type { RiskZone } from '@/lib/theossindex-engine';

export const metadata = { title: 'Dashboard | Dual-Rhythm Architecture™' };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

  const db = createServerClient();
  const entitlement = await resolveEntitlement(userId);

  const { data: assessments } = await db
    .from('theossindex_assessments')
    .select('id, org_name, er, pr, ri, a, oss, risk_zone, status, hp_lr_trap, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(50);

  const { data: usage } = await db
    .from('usage_logs')
    .select('ai_messages_count')
    .eq('user_id', userId)
    .eq('date', new Date().toISOString().slice(0, 10))
    .single();

  const usedToday = usage?.ai_messages_count ?? 0;
  const benchmarks = getBenchmarks();

  // Latest assessment (reverse: DB sorted asc, latest is last)
  const latest = assessments?.[assessments.length - 1] ?? null;
  const latestMeta = latest ? RISK_ZONE_META[latest.risk_zone as RiskZone] ?? RISK_ZONE_META.structural_instability : null;
  const triggerZone = latest ? getTriggerZone(latest.oss) : null;
  const triggerMeta = triggerZone ? TRIGGER_ZONE_META[triggerZone] : null;

  // Trend data for chart (all assessments chronologically)
  const trendData = (assessments ?? []).map(a => ({ date: a.created_at, oss: a.oss, ri: a.ri }));
  const trendAlert: TrendAlert = getTrendAlert(trendData);

  // Reverse for display (newest first)
  const displayAssessments = [...(assessments ?? [])].reverse().slice(0, 30);

  return (
    <main className="min-h-screen bg-surface-muted">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/agent" className="text-xs font-bold tracking-widest uppercase text-ink">Dual-Rhythm Architecture<span className="text-primary">™</span></Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/5 text-primary border border-primary/20">{entitlement.tierLabel}</span>
          <span className="text-xs text-ink-muted">{email}</span>
          <UserButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-border rounded-large p-4">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1">Assessments</p>
            <p className="font-mono text-2xl font-bold text-ink">{assessments?.length ?? 0}</p>
          </div>
          <div className="bg-white border border-border rounded-large p-4">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1">Messages Today</p>
            <p className="font-mono text-2xl font-bold text-ink">{usedToday}<span className="text-sm text-ink-faint"> / {entitlement.dailyMessageLimit}</span></p>
          </div>
          <div className="bg-white border border-border rounded-large p-4">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1">Latest OSS™</p>
            <p className="font-mono text-2xl font-bold" style={{ color: latestMeta?.color ?? '#9CA3AF' }}>
              {latest?.oss ?? '—'}
            </p>
          </div>
          <div className="bg-white border border-border rounded-large p-4">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1">Tier</p>
            <p className="font-mono text-sm font-bold text-primary pt-1">{entitlement.tierLabel}</p>
          </div>
        </div>

        {/* Trend alert banner */}
        {trendAlert !== 'none' && (
          <div className={`rounded-large p-4 mb-6 border ${trendAlert === 'red' ? 'bg-danger-bg border-danger/30' : 'bg-warning-bg border-warning/30'}`}>
            <p className={`text-sm font-bold ${trendAlert === 'red' ? 'text-danger' : 'text-amber-700'}`}>
              {trendAlert === 'red' ? '🔴 Red Alert' : '🟡 Yellow Alert'} — OSS™ change exceeds {trendAlert === 'red' ? '15%' : '8%'} since last assessment
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {trendAlert === 'red'
                ? 'Mandatory structural intervention recommended. Freeze expansion. Deploy governance override.'
                : 'Escalate to board attention. Initiate diagnostic review of pressure sources and recovery bottlenecks.'}
            </p>
          </div>
        )}

        {/* Trigger zone (board action) */}
        {triggerMeta && latest && (
          <div className="bg-white border border-border rounded-large p-5 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: triggerMeta.color }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: triggerMeta.color }}>
                Board Trigger: {triggerMeta.label}
              </span>
            </div>
            <p className="text-sm text-ink">{triggerMeta.action}</p>
          </div>
        )}

        {/* Trend + Radar section */}
        {entitlement.canViewTrend ? (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <OssTrendChart data={trendData} />
            {latest && <DimensionRadar er={latest.er} pr={latest.pr} ri={latest.ri} a={latest.a} />}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary/5 to-gold/5 border border-primary/20 rounded-large p-8 mb-8 text-center">
            <h3 className="font-bold text-ink mb-2">Unlock Trend Tracking & Benchmarking</h3>
            <p className="text-sm text-ink-muted mb-4 max-w-md mx-auto">
              Track your OSS™ score over time, compare against industry benchmarks, and get quarterly reassessment reminders.
            </p>
            <a href={buildSubscriptionLink('consultant', email)} className="btn-gold text-sm px-6 py-3 inline-block">
              Upgrade to Consultant License — $499/mo →
            </a>
          </div>
        )}

        {/* Benchmark comparison */}
        {entitlement.canAccessBenchmark && latest && (
          <div className="bg-white border border-border rounded-large p-5 mb-8">
            <h3 className="text-sm font-bold text-ink mb-1">Industry Benchmark Comparison</h3>
            <p className="text-xs text-ink-faint mb-4">Your OSS™: {latest.oss} vs synthetic reference benchmarks</p>
            <div className="space-y-2">
              {benchmarks.map(b => {
                return (
                  <div key={b.key} className="flex items-center gap-3 text-xs">
                    <span className="w-32 text-ink-muted">{b.label}</span>
                    <div className="flex-1 bg-border rounded-full h-2 relative">
                      <div className="absolute h-2 rounded-full" style={{ width: `${b.oss}%`, backgroundColor: '#9CA3AF' }} />
                      <div className="absolute w-0.5 h-3 -top-0.5 bg-primary" style={{ left: `${latest.oss}%` }} title="Your OSS" />
                    </div>
                    <span className="font-mono w-8 text-right text-ink-faint">{b.oss}</span>
                  </div>
                );
              })}
              <p className="text-xs text-ink-faint pt-2 border-t border-border">▲ = Your OSS™ position. Benchmarks are synthetic references, not cohort-derived.</p>
            </div>
          </div>
        )}

        {/* CEO Brief (consultant+) */}
        {entitlement.canCEOBrief && latest && (
          <div className="mb-8">
            <Link href="/board-rhythm" className="block bg-white border border-border rounded-large p-5 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Board Decision Rhythm & CEO Brief</h3>
                  <p className="text-xs text-ink-muted mt-1">4-step quarterly control loop · CEO Stability Brief generator</p>
                </div>
                <span className="text-primary text-sm font-semibold">Open →</span>
              </div>
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink">Assessment History</h2>
          <Link href="/agent" className="btn-primary text-sm px-4 py-2">+ New Diagnostic</Link>
        </div>

        {/* List */}
        {!displayAssessments || displayAssessments.length === 0 ? (
          <div className="bg-white border border-border rounded-large p-16 text-center">
            <p className="text-3xl mb-3">📊</p>
            <h3 className="font-semibold text-ink mb-2">No assessments yet</h3>
            <p className="text-sm text-ink-muted mb-5">Start a diagnostic session to measure your organizational stability.</p>
            <Link href="/agent" className="btn-primary text-sm">Start Diagnostic →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {displayAssessments.map(a => {
              const meta = RISK_ZONE_META[a.risk_zone as RiskZone] ?? RISK_ZONE_META.structural_instability;
              return (
                <div key={a.id} className="bg-white border border-border rounded-large p-4 flex items-center gap-4">
                  <div className="font-mono text-2xl font-bold shrink-0" style={{ color: meta.color }}>{a.oss}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{a.org_name ?? 'Diagnostic'}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: meta.color }}>{meta.name}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{formatShortDate(a.created_at)}</p>
                    {a.hp_lr_trap && <p className="text-xs text-danger font-bold mt-0.5">🚨 HP/LR Trap</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {a.status === 'report_ready' ? (
                      <a href={`/api/report/${a.id}/download`} className="text-xs bg-primary text-white font-semibold px-3 py-2 rounded-brand hover:bg-primary/90">
                        PDF
                      </a>
                    ) : a.status === 'paid' ? (
                      <span className="text-xs bg-warning/10 text-amber-700 border border-warning/30 font-semibold px-3 py-2 rounded-brand">Generating…</span>
                    ) : (
                      <a href={buildUpgradeLink(a.id, email)} className="btn-gold text-xs px-3 py-2">$299</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
