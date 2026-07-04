// lib/email.ts — Resend email service with 8 lifecycle templates

import { Resend } from 'resend';
import { createServerClient } from './supabase';

// Lazy-init: the Resend client is only constructed on first actual use (runtime),
// not at module-evaluation time (build). This prevents "Missing API key" during
// `next build` when RESEND_API_KEY is not present in the build environment.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? '');
  }
  return _resend;
}
const FROM = 'Dual-Rhythm Architecture™ <noreply@updates.dualrhythmsystems.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dualrhythmsystems.com';

const SUBJECTS: Record<string, string> = {
  welcome:                  'Welcome to Dual-Rhythm Architecture™ — Your stability journey starts here',
  free_assessment_complete: 'Your The OSS Index™ Score is ready — See your results',
  payment_confirmation:     'Your board-ready report is ready to download',
  subscription_active:      'Your Dual-Rhythm Architecture™ subscription is active',
  subscription_past_due:    'Action needed: Payment failed for your subscription',
  subscription_canceled:    'Your subscription has been canceled',
  quarterly_reassess:       'Time for your quarterly The OSS Index™ reassessment',
  win_back:                 'We miss you — Special offer to return to Dual-Rhythm Architecture™',
  webhook_failure_alert:    '[ALERT] Stripe webhook processing failure',
};

export async function sendEmail(
  template: string,
  to: string,
  vars: Record<string, string>,
  userId?: string,
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping:', template);
    return false;
  }

  const html = renderTemplate(template, vars);
  const subject = SUBJECTS[template] ?? 'Dual-Rhythm Architecture™';

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  // Log to email_log table
  try {
    const db = createServerClient();
    await db.from('email_log').insert({
      user_id: userId ?? null,
      to_email: to,
      template,
      resend_id: data?.id ?? null,
      status: error ? 'failed' : 'sent',
    });
  } catch { /* non-fatal: don't let logging failure block email */ }

  if (error) {
    console.error('[email] send failed:', template, error);
    return false;
  }
  return true;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  const footer = `
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;">
    <p style="font-size:11px;color:#9CA3AF;line-height:1.6;">
      © 2026 Dual-Rhythm Architecture™ · Methodology: Dual-Rhythm Architecture™ / The OSS Index™ (DOI: 10.5281/zenodo.19941449)<br>
      <a href="${APP_URL}/dashboard" style="color:#0A6640;">Go to dashboard</a> ·
      <a href="${APP_URL}" style="color:#9CA3AF;">Unsubscribe</a>
    </p>
  `;

  const base = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1A14;">`;

  switch (template) {
    case 'welcome':
      return `${base}
        <h1 style="font-size:22px;color:#0A6640;margin:0 0 16px;">Welcome to Dual-Rhythm Architecture™</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Thanks for joining! You're now ready to measure your organization's structural stability using the peer-reviewed The OSS Index™.</p>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Start your free diagnostic — it takes 10–15 minutes and gives you an instant The OSS Index™ score.</p>
        <a href="${APP_URL}/agent" style="display:inline-block;background:#0A6640;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Start Free Diagnostic →</a>
        ${footer}</div>`;

    case 'free_assessment_complete':
      return `${base}
        <h1 style="font-size:22px;color:#0A6640;margin:0 0 16px;">Your The OSS Index™ Score: ${vars.oss ?? '—'}</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Your organizational stability diagnostic is complete. Your The OSS Index™ score is <strong>${vars.oss ?? '—'}</strong>.</p>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Unlock the full board-ready report with 4-dimensional breakdown, HP/LR trap analysis, and priority recommendations.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#C9A84C;color:#0F1A14;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Unlock Full Report — $299 →</a>
        ${footer}</div>`;

    case 'payment_confirmation':
      return `${base}
        <h1 style="font-size:22px;color:#0A6640;margin:0 0 16px;">Your report is ready</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Your payment has been processed and your board-ready PDF report for <strong>${vars.orgName ?? 'your organization'}</strong> is now available.</p>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">The OSS Index™ Score: <strong>${vars.oss ?? '—'}</strong></p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0A6640;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Download PDF Report →</a>
        ${footer}</div>`;

    case 'subscription_active':
      return `${base}
        <h1 style="font-size:22px;color:#0A6640;margin:0 0 16px;">Subscription Active</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Your Dual-Rhythm Architecture™ <strong>${vars.tier ?? 'subscription'}</strong> is now active. You now have access to trend tracking, benchmarking, and quarterly reassessments.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0A6640;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Go to Dashboard →</a>
        ${footer}</div>`;

    case 'subscription_past_due':
      return `${base}
        <h1 style="font-size:22px;color:#DC2626;margin:0 0 16px;">Payment Failed</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">We were unable to process your subscription payment. Your access will continue for 7 days (grace period). Please update your payment method to avoid losing access.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#DC2626;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Update Payment →</a>
        ${footer}</div>`;

    case 'subscription_canceled':
      return `${base}
        <h1 style="font-size:22px;color:#4B5563;margin:0 0 16px;">Subscription Canceled</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Your Dual-Rhythm Architecture™ subscription has been canceled. Your historical assessments remain available, but trend tracking and benchmarking are now locked.</p>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Changed your mind? You can resubscribe anytime.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0A6640;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Resubscribe →</a>
        ${footer}</div>`;

    case 'quarterly_reassess':
      return `${base}
        <h1 style="font-size:22px;color:#0A6640;margin:0 0 16px;">Quarterly Reassessment Due</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">It's been 90 days since your last The OSS Index™ diagnostic. Run a new assessment to track your stability trend and see how your organization has evolved.</p>
        <a href="${APP_URL}/agent" style="display:inline-block;background:#0A6640;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Start Reassessment →</a>
        ${footer}</div>`;

    case 'win_back':
      return `${base}
        <h1 style="font-size:22px;color:#0A6640;margin:0 0 16px;">We miss you</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">Your organizational stability matters. Come back to Dual-Rhythm Architecture™ and get 20% off your first month with code <strong>COMEBACK20</strong>.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#0A6640;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Return to Dual-Rhythm Architecture™ →</a>
        ${footer}</div>`;

    case 'webhook_failure_alert':
      return `${base}
        <h1 style="font-size:22px;color:#DC2626;margin:0 0 16px;">Webhook Failure Alert</h1>
        <p style="font-size:14px;line-height:1.6;color:#4B5563;">A Stripe webhook could not be processed after retries. Manual intervention required.</p>
        <table style="font-size:13px;color:#0F1A14;width:100%;margin:12px 0;">
          <tr><td style="padding:4px 0;color:#6B7280;width:120px;">Assessment:</td><td><code>${vars.assessmentId ?? '—'}</code></td></tr>
          <tr><td style="padding:4px 0;color:#6B7280;">Event:</td><td><code>${vars.eventType ?? '—'}</code></td></tr>
          <tr><td style="padding:4px 0;color:#6B7280;">Time:</td><td>${vars.timestamp ?? '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#DC2626;background:#FEF2F2;padding:12px;border-radius:6px;font-family:monospace;word-break:break-all;">${(vars.error ?? '—').slice(0, 500)}</p>
        <p style="font-size:14px;color:#4B5563;">Check the <code>webhook_failures</code> table and the admin dashboard to regenerate the PDF manually.</p>
        <a href="${APP_URL}/admin/assessments" style="display:inline-block;background:#DC2626;color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Go to Admin →</a>
        ${footer}</div>`;

    default:
      return `${base}<p style="font-size:14px;color:#4B5563;">Dual-Rhythm Architecture™</p>${footer}</div>`;
  }
}
