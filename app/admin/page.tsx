// app/admin/page.tsx — Admin overview dashboard
import { createServerClient } from '@/lib/supabase';

export const metadata = { title: 'Overview | Admin' };

export default async function AdminOverview() {
  const db = createServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: totalAssessments }, { count: paidAssessments }, { count: subscriptions }, { count: emails }] = await Promise.all([
    db.from('theossindex_assessments').select('*', { count: 'exact', head: true }),
    db.from('theossindex_assessments').select('*', { count: 'exact', head: true }).in('status', ['paid', 'report_ready']),
    db.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'past_due']),
    db.from('email_log').select('*', { count: 'exact', head: true }).gte('sent_at', today),
  ]);

  const stats = [
    { label: 'Total Assessments', value: totalAssessments ?? 0 },
    { label: 'Paid Assessments', value: paidAssessments ?? 0 },
    { label: 'Active Subscriptions', value: subscriptions ?? 0 },
    { label: 'Emails Sent Today', value: emails ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-border rounded-large p-5">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-2">{s.label}</p>
            <p className="font-mono text-3xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
