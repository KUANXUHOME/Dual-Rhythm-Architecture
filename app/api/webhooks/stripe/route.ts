// app/api/webhooks/stripe/route.ts — Stripe webhook: checkout + subscription events

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';
import { calculateTheOSSIndex } from '@/lib/theossindex-engine';
import { OSSReportDocument } from '@/lib/pdf-generator';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { formatDate } from '@/lib/utils';
import { upsertSubscription, cancelSubscription } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe-webhook] signature check failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = createServerClient();

  switch (event.type) {
    // ── One-time payment: CEO Diagnostic $299 ──
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Subscription checkout (consultant/enterprise) — skip PDF, let subscription.created handle it
      if (session.mode === 'subscription') {
        // The customer.subscription.created event will fire separately
        return NextResponse.json({ received: true });
      }

      // One-time payment — generate PDF
      const assessmentId = session.client_reference_id;
      if (!assessmentId) return NextResponse.json({ received: true });

      try {
        const { data: a, error } = await db
          .from('theossindex_assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();

        if (error || !a) {
          console.error('[stripe-webhook] assessment not found:', assessmentId);
          return NextResponse.json({ received: true });
        }

        // Idempotency: if already report_ready, skip
        if (a.status === 'report_ready') {
          console.log('[stripe-webhook] already report_ready, skipping:', assessmentId);
          return NextResponse.json({ received: true });
        }

        // Mark paid
        await db.from('theossindex_assessments')
          .update({ status: 'paid', stripe_session_id: session.id })
          .eq('id', assessmentId);

        // Generate PDF + upload (with one retry)
        const generateAndUpload = async () => {
          const result = calculateTheOSSIndex({ er: a.er, pr: a.pr, ri: a.ri, a: a.a });
          const doc = React.createElement(OSSReportDocument, {
            orgName:        a.org_name ?? 'Your Organization',
            userEmail:      a.user_email,
            assessmentDate: formatDate(a.created_at),
            input:          { er: a.er, pr: a.pr, ri: a.ri, a: a.a },
            result,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @react-pdf/renderer v4 + React 19 type incompatibility
          const pdfBuffer = await renderToBuffer(doc as any);
          const storagePath = `reports/${assessmentId}.pdf`;
          const { error: uploadErr } = await db.storage
            .from('theossindex-reports')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
          if (uploadErr) throw uploadErr;
          return storagePath;
        };

        let storagePath: string | null = null;
        try {
          storagePath = await generateAndUpload();
        } catch (firstErr) {
          console.warn('[stripe-webhook] first attempt failed, retrying once:', firstErr);
          try {
            storagePath = await generateAndUpload();
          } catch (retryErr) {
            console.error('[stripe-webhook] retry also failed, logging to webhook_failures:', retryErr);
            await db.from('webhook_failures').insert({
              assessment_id: assessmentId,
              event_type: 'checkout.session.completed',
              error: String(retryErr),
              retries: 2,
            }).then(() => {}, () => {});
            await alertAdminWebhookFailure(assessmentId, 'checkout.session.completed', String(retryErr));
            return NextResponse.json({ received: true });
          }
        }

        // Mark report ready
        await db.from('theossindex_assessments')
          .update({ status: 'report_ready', report_storage_path: storagePath })
          .eq('id', assessmentId);

        console.log('[stripe-webhook] PDF ready:', assessmentId);

        // Send payment confirmation email (SP4)
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail('payment_confirmation', a.user_email, {
            oss: String(result_oss(a)),
            orgName: a.org_name ?? 'Your Organization',
          }, a.user_id);
        } catch { /* non-fatal */ }

      } catch (err) {
        console.error('[stripe-webhook] processing error:', err);
        await db.from('webhook_failures').insert({
          assessment_id: assessmentId,
          event_type: 'checkout.session.completed',
          error: String(err),
          retries: 0,
        }).then(() => {}, () => {});
        await alertAdminWebhookFailure(assessmentId, 'checkout.session.completed', String(err));
      }
      break;
    }

    // ── Subscription lifecycle events ──
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      // Fetch customer email + Clerk userId from Stripe customer metadata
      try {
        const customer = await getStripe().customers.retrieve(sub.customer as string) as Stripe.Customer;
        const userEmail = customer.email ?? '';
        const userId = (customer.metadata as Record<string, string>)?.clerkUserId ?? '';

        if (userId) {
          await upsertSubscription(sub, userEmail, userId);

          // Send subscription email (SP4)
          try {
            const { sendEmail } = await import('@/lib/email');
            const subStatus = sub.status;
            if (subStatus === 'active' || subStatus === 'trialing') {
              await sendEmail('subscription_active', userEmail, { tier: sub.metadata?.tier ?? 'subscription' }, userId);
            }
          } catch { /* non-fatal */ }
        }
      } catch (err) {
        console.error('[stripe-webhook] subscription upsert failed:', err);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      try {
        await cancelSubscription(sub.id);
        // Send cancellation email
        const customer = await getStripe().customers.retrieve(sub.customer as string) as Stripe.Customer;
        if (customer.email) {
          try {
            const { sendEmail } = await import('@/lib/email');
            await sendEmail('subscription_canceled', customer.email, {}, (customer.metadata as Record<string,string>)?.clerkUserId);
          } catch { /* non-fatal */ }
        }
      } catch (err) {
        console.error('[stripe-webhook] subscription cancel failed:', err);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as { subscription?: string | null }).subscription;
      if (subId) {
        // Update subscription period end
        try {
          const sub = await getStripe().subscriptions.retrieve(subId);
          const customer = await getStripe().customers.retrieve(sub.customer as string) as Stripe.Customer;
          const userId = (customer.metadata as Record<string, string>)?.clerkUserId ?? '';
          if (userId) {
            await upsertSubscription(sub, customer.email ?? '', userId);
          }
        } catch (err) {
          console.error('[stripe-webhook] invoice.paid processing failed:', err);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as { subscription?: string | null }).subscription;
      if (subId) {
        try {
          const sub = await getStripe().subscriptions.retrieve(subId);
          const customer = await getStripe().customers.retrieve(sub.customer as string) as Stripe.Customer;
          const userId = (customer.metadata as Record<string, string>)?.clerkUserId ?? '';
          if (userId) {
            await upsertSubscription(sub, customer.email ?? '', userId);
            // Send past_due email
            try {
              const { sendEmail } = await import('@/lib/email');
              if (customer.email) {
                await sendEmail('subscription_past_due', customer.email, {}, userId);
              }
            } catch { /* non-fatal */ }
          }
        } catch (err) {
          console.error('[stripe-webhook] invoice.payment_failed processing failed:', err);
        }
      }
      break;
    }

    default:
      // Unhandled event type — acknowledge
      break;
  }

  return NextResponse.json({ received: true });
}

// Helper to extract OSS from assessment for email
function result_oss(a: { er: number; pr: number; ri: number; a: number }): number {
  return calculateTheOSSIndex({ er: a.er, pr: a.pr, ri: a.ri, a: a.a }).oss;
}

async function alertAdminWebhookFailure(
  assessmentId: string | null,
  eventType: string,
  error: string,
): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  for (const email of adminEmails) {
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail('webhook_failure_alert', email, {
        assessmentId: assessmentId ?? 'unknown',
        eventType,
        error: error.slice(0, 500),
        timestamp: new Date().toISOString(),
      }, undefined);
    } catch { /* non-fatal: don't let alerting failure cause more issues */ }
  }
}
