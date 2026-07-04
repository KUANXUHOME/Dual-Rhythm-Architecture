// app/admin/users/page.tsx — User list (assessments + subscriptions join)
import { createServerClient } from '@/lib/supabase';

export const metadata = { title: 'Users | Admin' };

interface UserEntry {
  email: string;
  assessments: number;
  sub?: { tier: string; status: string };
}

export default async function AdminUsers() {
  const db = createServerClient();

  const [{ data: assessments }, { data: subs }] = await Promise.all([
    db.from('theossindex_assessments')
      .select('user_id, user_email')
      .order('created_at', { ascending: false }),
    db.from('subscriptions')
      .select('user_id, user_email, tier, status')
      .order('created_at', { ascending: false }),
  ]);

  // Build a user map
  const userMap = new Map<string, UserEntry>();
  for (const a of assessments ?? []) {
    const u = userMap.get(a.user_id) ?? { email: a.user_email, assessments: 0 };
    u.assessments++;
    userMap.set(a.user_id, u);
  }
  for (const s of subs ?? []) {
    const u: UserEntry = userMap.get(s.user_id) ?? { email: s.user_email, assessments: 0 };
    u.sub = { tier: s.tier, status: s.status };
    userMap.set(s.user_id, u);
  }

  const users = Array.from(userMap.entries()).sort((a, b) => b[1].assessments - a[1].assessments);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">Users ({users.length})</h1>
      <div className="bg-white border border-border rounded-large overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted border-b border-border">
            <tr className="text-left text-xs font-semibold text-ink-faint uppercase tracking-wide">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Assessments</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(([uid, u]) => (
              <tr key={uid} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                <td className="px-4 py-3 text-ink">{u.email}</td>
                <td className="px-4 py-3 font-mono text-ink">{u.assessments}</td>
                <td className="px-4 py-3 text-ink-muted">{u.sub?.tier ?? '—'}</td>
                <td className="px-4 py-3">
                  {u.sub ? (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      u.sub.status === 'active' ? 'bg-primary/5 text-primary' :
                      u.sub.status === 'past_due' ? 'bg-warning/10 text-amber-700' :
                      'bg-border text-ink-faint'
                    }`}>{u.sub.status}</span>
                  ) : (
                    <span className="text-xs text-ink-faint">free</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
