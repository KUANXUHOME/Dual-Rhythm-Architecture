// app/api/leads/route.ts — Lead capture (no auth required) + welcome email trigger
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  orgName: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  ossScore: z.number().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

    const { email, orgName, role, source, ossScore, userId } = parsed.data;
    const db = createServerClient();

    // Insert lead (unique index on email prevents duplicates)
    const { error } = await db.from('dra_leads').upsert({
      email,
      org_name: orgName ?? null,
      role: role ?? null,
      source: source ?? null,
      oss_score: ossScore ?? null,
      user_id: userId ?? null,
      status: 'new',
    }, { onConflict: 'email' });

    if (error && error.code !== '23505') { // 23505 = unique violation (already exists, fine)
      throw error;
    }

    // Send welcome email (non-fatal)
    try {
      await sendEmail('welcome', email, { orgName: orgName ?? '' }, userId);
    } catch { /* non-fatal */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[leads]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
