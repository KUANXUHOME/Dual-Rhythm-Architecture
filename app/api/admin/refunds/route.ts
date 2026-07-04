// app/api/admin/refunds/route.ts — Issue Stripe refund for an assessment
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!adminEmails.includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { assessmentId } = body;
  if (!assessmentId) return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 });

  const db = createServerClient();

  try {
    const { data: a, error } = await db
      .from('theossindex_assessments')
      .select('stripe_session_id, status')
      .eq('id', assessmentId)
      .single();

    if (error || !a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!a.stripe_session_id) return NextResponse.json({ error: 'No Stripe session' }, { status: 400 });

    // Retrieve the checkout session to get payment_intent
    const session = await getStripe().checkout.sessions.retrieve(a.stripe_session_id);
    if (!session.payment_intent) return NextResponse.json({ error: 'No payment intent' }, { status: 400 });

    // Issue refund
    await getStripe().refunds.create({
      payment_intent: session.payment_intent as string,
    });

    // Mark assessment as refunded
    await db.from('theossindex_assessments')
      .update({ status: 'refunded' })
      .eq('id', assessmentId);

    return NextResponse.json({ ok: true, message: 'Refund issued' });
  } catch (err) {
    console.error('[admin refunds]', err);
    return NextResponse.json({ error: 'Refund failed', detail: String(err) }, { status: 500 });
  }
}
