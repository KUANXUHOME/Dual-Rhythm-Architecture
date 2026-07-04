// app/api/assess/route.ts — Save manual assessment (questionnaire flow)

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { calculateTheOSSIndex, answersToDimensions } from '@/lib/theossindex-engine';
import { z } from 'zod';

const schema = z.object({
  answers: z.array(z.array(z.number().int().min(1).max(5)).length(5)).length(4),
  orgName: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });

    const { answers, orgName } = parsed.data;
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';

    const input  = answersToDimensions(answers);
    const result = calculateTheOSSIndex(input);

    const db = createServerClient();
    const { data, error } = await db.from('theossindex_assessments').insert({
      user_id: userId,
      user_email: userEmail,
      org_name: orgName ?? null,
      answers,
      er: input.er, pr: input.pr, ri: input.ri, a: input.a,
      oss: result.oss, ssc: result.ssc,
      risk_zone: result.riskZone,
      hp_lr_trap: result.hpLrTrapDetected,
      status: 'complete',
    }).select('id').single();

    if (error) throw error;
    return NextResponse.json({ assessmentId: data.id, oss: result.oss, riskZone: result.riskZone });

  } catch (err) {
    console.error('[assess]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
