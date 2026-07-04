// app/admin/subscriptions/page.tsx — Subscription list
import { createServerClient } from '@/lib/supabase';
import { formatShortDate } from '@/lib/utils';

export const metadata = { title: 'Subscriptions | Admin' };

export default async function AdminSubscriptions() {
  const db = createServerClient();
  const { data: subs } = await db
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">Subscriptions ({subs?.length ?? 0})</h1>
      <div className="bg-white border border-border rounded-large overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted border-b border-border">
            <tr className="text-left text-xs font-semibold text-ink-faint uppercase tracking-wide">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Period End</th>
              <th className="px-4 py-3">Stripe Sub ID</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {subs?.map(s => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                <td className="px-4 py-3 text-ink">{s.user_email}</td>
                <td className="px-4 py-3 text-ink-muted">{s.tier}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    s.status === 'active' ? 'bg-primary/5 text-primary' :
                    s.status === 'past_due' ? 'bg-warning/10 text-amber-700' :
                    s.status === 'canceled' ? 'bg-border text-ink-faint' :
                    'bg-border text-ink-faint'
                  }`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-faint">{s.current_period_end ? formatShortDate(s.current_period_end) : '—'}</td>
                <td className="px-4 py-3 text-xs font-mono text-ink-faint">{s.stripe_subscription_id?.slice(0, 20) ?? '—'}…</td>
                <td className="px-4 py-3 text-xs text-ink-faint">{formatShortDate(s.created_at)}</td>
              </tr>
            )) ?? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">No subscriptions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
