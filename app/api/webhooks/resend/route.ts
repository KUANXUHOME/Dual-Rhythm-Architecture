// app/api/webhooks/resend/route.ts — Resend email status callbacks
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.type ?? '';
    const emailId = body?.data?.email_id ?? body?.data?.id;

    if (!emailId) return NextResponse.json({ received: true });

    const db = createServerClient();

    // Map Resend event types to email_log status
    let status: string | null = null;
    switch (eventType) {
      case 'email.delivered':  status = 'delivered'; break;
      case 'email.bounced':    status = 'bounced'; break;
      case 'email.complained': status = 'complained'; break;
      case 'email.failed':     status = 'failed'; break;
      default: break;
    }

    if (status) {
      await db.from('email_log')
        .update({ status })
        .eq('resend_id', emailId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[resend-webhook]', err);
    return NextResponse.json({ received: true });
  }
}
