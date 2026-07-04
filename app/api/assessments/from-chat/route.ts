// app/api/assessments/from-chat/route.ts
// Save a real assessment from chat scores (fixes B1: hardcoded bogus assessment)
// + backfill conversation.assessment_id (fixes B2: broken bidirectional link)

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { calculateTheOSSIndex, RISK_ZONE_META } from '@/lib/theossindex-engine';

const Body = z.object({
  er: z.number().min(0).max(100),
  pr: z.number().min(0).max(100),
  ri: z.number().min(0).max(100),
  a:  z.number().min(0).max(100),
  conversationId: z.string().uuid().optional(),
  orgName: z.string().max(200).optional(),
  sub: z.object({
    er: z.array(z.number().min(0).max(100)).length(5).optional(),
    pr: z.array(z.number().min(0).max(100)).length(5).optional(),
    ri: z.array(z.number().min(0).max(100)).length(5).optional(),
    a:  z.array(z.number().min(0).max(100)).length(5).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input', issues: parsed.error.format() }, { status: 400 });
    }
    const { er, pr, ri, a, conversationId, orgName, sub } = parsed.data;

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';

    const result = calculateTheOSSIndex({ er, pr, ri, a });
    const db = createServerClient();

    // Insert the REAL assessment (no hardcoded answers)
    const { data: assessment, error: insertErr } = await db
      .from('theossindex_assessments')
      .insert({
        user_id: userId,
        user_email: userEmail,
        org_name: orgName ?? null,
        er, pr, ri, a,
        oss: result.oss,
        ssc: result.ssc,
        risk_zone: result.riskZone,
        hp_lr_trap: result.hpLrTrapDetected,
        status: 'complete',
        conversation_id: conversationId ?? null,
        answers: null,
        sub_indicators: sub ?? null,
      })
      .select('id')
      .single();

    if (insertErr || !assessment) {
      console.error('[from-chat] insert failed:', insertErr);
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
    }

    // Backfill conversation.assessment_id (fixes B2)
    if (conversationId) {
      await db.from('dra_conversations')
        .update({ assessment_id: assessment.id })
        .eq('id', conversationId)
        .eq('user_id', userId);
    }

    // Send free assessment complete email (non-fatal)
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail('free_assessment_complete', userEmail, {
        oss: String(result.oss),
        orgName: orgName ?? 'Your Organization',
      }, userId);
    } catch { /* non-fatal */ }

    return NextResponse.json({
      assessmentId: assessment.id,
      display: {
        oss:              result.oss,
        riskZoneName:     result.riskZoneName,
        riskZoneColor:    result.riskZoneColor,
        riskZoneRange:    RISK_ZONE_META[result.riskZone].range,
        hpLrTrapDetected: result.hpLrTrapDetected,
      },
    });
  } catch (err) {
    console.error('[from-chat]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
