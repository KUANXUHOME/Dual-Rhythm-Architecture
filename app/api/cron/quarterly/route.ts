// app/api/cron/quarterly/route.ts — Quarterly reassessment email cron
// Triggered by Vercel Cron (vercel.json) every quarter (Jan/Apr/Jul/Oct 1st, 09:00 UTC)
// Sends quarterly_reassess email to active subscribers whose last assessment >90 days ago

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: subscribers } = await db
    .from('subscriptions')
    .select('user_id, user_email, tier')
    .in('status', ['trialing', 'active', 'past_due'])
    .in('tier', ['consultant', 'quarterly_track', 'enterprise', 'certification']);

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ sent: 0, total: 0 });
  }

  let sent = 0;
  for (const sub of subscribers) {
    const { data: latest } = await db
      .from('theossindex_assessments')
      .select('created_at')
      .eq('user_id', sub.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const needsReassess = !latest || new Date(latest.created_at) < new Date(ninetyDaysAgo);
    if (!needsReassess) continue;

    const { data: recentEmail } = await db
      .from('email_log')
      .select('id')
      .eq('to_email', sub.user_email)
      .eq('template', 'quarterly_reassess')
      .gt('created_at', thirtyDaysAgo)
      .limit(1)
      .maybeSingle();

    if (recentEmail) continue;

    try {
      await sendEmail('quarterly_reassess', sub.user_email, {}, sub.user_id);
      sent++;
    } catch (err) {
      console.error('[cron/quarterly] email failed for', sub.user_email, err);
    }
  }

  return NextResponse.json({ sent, total: subscribers.length });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
