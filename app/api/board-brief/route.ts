// app/api/board-brief/route.ts — Generate CEO Stability Brief
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { calculateTheOSSIndex, getTrendAlert } from '@/lib/theossindex-engine';
import { resolveEntitlement } from '@/lib/entitlements';
import { generateBrief } from '@/lib/board-brief';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entitlement = await resolveEntitlement(userId);
  if (!entitlement.canCEOBrief) {
    return NextResponse.json({ error: 'Upgrade to Consultant License or above to access CEO Brief' }, { status: 403 });
  }

  const db = createServerClient();

  // Get latest assessment + history for trend
  const { data: assessments } = await db
    .from('theossindex_assessments')
    .select('id, org_name, er, pr, ri, a, oss, risk_zone, hp_lr_trap, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20);

  if (!assessments || assessments.length === 0) {
    return NextResponse.json({ error: 'No assessments found. Run a diagnostic first.' }, { status: 404 });
  }

  const latest = assessments[assessments.length - 1];
  const result = calculateTheOSSIndex({ er: latest.er, pr: latest.pr, ri: latest.ri, a: latest.a });
  const trendAlert = getTrendAlert(assessments.map(a => ({ oss: a.oss, date: a.created_at })));

  const brief = generateBrief({
    orgName: latest.org_name ?? 'Your Organization',
    oss: result.oss,
    ri: latest.ri,
    er: latest.er,
    pr: latest.pr,
    a: latest.a,
    hpLrTrap: result.hpLrTrapDetected,
    maxReachableOSS: result.maxReachableOSS,
    riskZoneName: result.riskZoneName,
    trendAlert,
  });

  return NextResponse.json({
    markdown: brief.markdown,
    orgName: latest.org_name,
    generatedAt: new Date().toISOString(),
  });
}
