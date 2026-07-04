// app/board-rhythm/page.tsx — Board Decision Rhythm Module (4-step quarterly control loop)
// PDF 2 Part IV: OSS Review → Acceleration Authorization → Capital Allocation → CEO Brief
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { resolveEntitlement } from '@/lib/entitlements';
import { calculateTheOSSIndex, RISK_ZONE_META, TRIGGER_ZONE_META, getTriggerZone, getTrendAlert, type RiskZone } from '@/lib/theossindex-engine';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export const metadata = { title: 'Board Rhythm | Dual-Rhythm Architecture™' };

export default async function BoardRhythmPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const entitlement = await resolveEntitlement(userId);
  if (!entitlement.canBoardRhythm) {
    return (
      <main className="min-h-screen bg-surface-muted flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-ink mb-3">Enterprise Feature</h1>
          <p className="text-sm text-ink-muted mb-6">
            The Board Decision Rhythm Module is available on the Enterprise plan ($2,500/mo).
            It guides your board through the 4-step quarterly control loop defined in the Dual-Rhythm Architecture™ framework.
          </p>
          <Link href="/dashboard" className="btn-primary text-sm px-6 py-3 inline-block">Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  const db = createServerClient();

  const { data: assessments } = await db
    .from('theossindex_assessments')
    .select('id, org_name, er, pr, ri, a, oss, risk_zone, hp_lr_trap, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20);

  const latest = assessments?.[assessments.length - 1] ?? null;

  if (!latest) {
    return (
      <main className="min-h-screen bg-surface-muted">
        <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-xs font-bold tracking-widest uppercase text-ink">← Dual-Rhythm Architecture™</Link>
          <UserButton />
        </header>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-sm text-ink-muted mb-6">No assessment data yet. Run a diagnostic first.</p>
          <Link href="/agent" className="btn-primary text-sm px-6 py-3 inline-block">Start Diagnostic →</Link>
        </div>
      </main>
    );
  }

  const result = calculateTheOSSIndex({ er: latest.er, pr: latest.pr, ri: latest.ri, a: latest.a });
  const meta = RISK_ZONE_META[latest.risk_zone as RiskZone];
  const triggerZone = getTriggerZone(latest.oss);
  const triggerMeta = TRIGGER_ZONE_META[triggerZone];
  const trendAlert = getTrendAlert((assessments ?? []).map(a => ({ oss: a.oss, date: a.created_at })));

  return (
    <main className="min-h-screen bg-surface-muted">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-xs font-bold tracking-widest uppercase text-ink">← Dual-Rhythm Architecture™</Link>
        <UserButton />
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-ink mb-2">Board Decision Rhythm</h1>
        <p className="text-sm text-ink-muted mb-8">
          Quarterly structural control loop · {latest.org_name ?? 'Your Organization'} · OSS™ {latest.oss}
        </p>

        {/* Step 1: OSS Review */}
        <div className="bg-white border border-border rounded-large p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">1</div>
            <h2 className="font-bold text-ink">OSS™ Stability Review</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide mb-1">OSS™ Score</p>
              <p className="font-mono text-3xl font-bold" style={{ color: meta.color }}>{latest.oss}</p>
              <p className="text-xs font-bold mt-1" style={{ color: meta.color }}>{meta.name}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide mb-1">Board Trigger</p>
              <p className="text-sm font-bold" style={{ color: triggerMeta.color }}>{triggerMeta.label}</p>
              <p className="text-xs text-ink-muted mt-1">{triggerMeta.action}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { k: 'ER', v: latest.er }, { k: 'PR', v: latest.pr },
              { k: 'RI', v: latest.ri }, { k: 'A',  v: latest.a  },
            ].map(d => (
              <div key={d.k} className="bg-surface-muted rounded-brand p-2">
                <p className="text-xs font-bold text-ink-faint">{d.k}</p>
                <p className="font-mono font-bold text-ink">{d.v}</p>
              </div>
            ))}
          </div>
          {latest.hp_lr_trap && (
            <div className="mt-4 bg-danger-bg border border-danger/30 rounded-brand p-3">
              <p className="text-xs font-bold text-danger">🚨 HP/LR Trap Detected — Most dangerous structural condition</p>
            </div>
          )}
          {trendAlert !== 'none' && (
            <div className={`mt-4 rounded-brand p-3 border ${trendAlert === 'red' ? 'bg-danger-bg border-danger/30' : 'bg-warning-bg border-warning/30'}`}>
              <p className={`text-xs font-bold ${trendAlert === 'red' ? 'text-danger' : 'text-amber-700'}`}>
                {trendAlert === 'red' ? '🔴 Red Alert' : '🟡 Yellow Alert'} — OSS™ changed &gt;{trendAlert === 'red' ? '15%' : '8%'} since last assessment
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Acceleration Authorization */}
        <div className="bg-white border border-border rounded-large p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">2</div>
            <h2 className="font-bold text-ink">Acceleration Authorization</h2>
          </div>
          <p className="text-xs text-ink-muted mb-3">
            Before authorizing any new expansion initiative, the board must answer:
          </p>
          <div className="space-y-3">
            <div className="bg-surface-muted rounded-brand p-3">
              <p className="text-xs text-ink-muted">Does current Recovery Integrity support the next phase of expansion?</p>
              <p className="text-sm font-bold mt-1" style={{ color: latest.ri < 55 ? '#DC2626' : latest.ri < 70 ? '#F59E0B' : '#0A6640' }}>
                RI = {latest.ri} → {latest.ri < 55 ? 'NO — Recovery below critical threshold. Acceleration must be deferred.' : latest.ri < 70 ? 'CAUTION — Recovery is strained. Limited acceleration only with recovery investment.' : 'YES — Recovery capacity supports measured acceleration.'}
              </p>
            </div>
            <div className="bg-surface-muted rounded-brand p-3">
              <p className="text-xs text-ink-muted">Maximum achievable OSS at current acceleration (A={latest.a}):</p>
              <p className="text-sm font-bold mt-1 text-primary">{result.maxReachableOSS} / 100</p>
              <p className="text-xs text-ink-faint mt-1">
                {result.maxReachableOSS < 50 ? 'Ceiling is too low — reduce A before expecting stability gains.' : 'Ceiling allows improvement — focus on ER/PR/RI gains.'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Capital Allocation */}
        <div className="bg-white border border-border rounded-large p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">3</div>
            <h2 className="font-bold text-ink">Capital Allocation</h2>
          </div>
          {triggerZone === 'green' ? (
            <p className="text-sm text-ink-muted">OSS™ is in the green zone. Acceleration budget may be authorized. Monitor RI quarterly.</p>
          ) : triggerZone === 'yellow' ? (
            <p className="text-sm text-ink-muted">OSS™ is in the yellow zone. Expansion budget should be restricted. Reinforce recovery functions before new commitments.</p>
          ) : (
            <p className="text-sm text-danger font-semibold">
              OSS™ is in the {triggerMeta.label} zone. All non-core growth must be frozen. Reallocate resources to structural recovery (RI investment). Governance intervention required.
            </p>
          )}
        </div>

        {/* Step 4: CEO Brief */}
        <div className="bg-white border border-border rounded-large p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">4</div>
            <h2 className="font-bold text-ink">CEO Stability Brief</h2>
          </div>
          <p className="text-xs text-ink-muted mb-4">
            Generate a structured brief answering the 3 non-negotiable questions every CEO must address:
          </p>
          <ol className="text-xs text-ink-muted space-y-1 mb-4 list-decimal list-inside">
            <li>Where is the current organizational overload point?</li>
            <li>Is the recovery window being compressed?</li>
            <li>Is there a synchronization mismatch?</li>
          </ol>
          <a
            href="/api/board-brief"
            target="_blank"
            className="btn-primary text-sm px-5 py-2.5 inline-block"
          >
            Generate CEO Brief →
          </a>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-xs text-ink-muted hover:text-primary">← Back to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
