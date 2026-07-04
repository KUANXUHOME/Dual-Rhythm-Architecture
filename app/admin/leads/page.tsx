// app/admin/leads/page.tsx — Lead list
import { createServerClient } from '@/lib/supabase';
import { formatShortDate } from '@/lib/utils';

export const metadata = { title: 'Leads | Admin' };

export default async function AdminLeads() {
  const db = createServerClient();
  const { data: leads } = await db
    .from('dra_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-6">Leads ({leads?.length ?? 0})</h1>
      <div className="bg-white border border-border rounded-large overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted border-b border-border">
            <tr className="text-left text-xs font-semibold text-ink-faint uppercase tracking-wide">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">OSS</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads?.map(l => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                <td className="px-4 py-3 text-ink">{l.email}</td>
                <td className="px-4 py-3 text-ink-muted">{l.org_name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{l.role ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{l.source ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-ink">{l.oss_score ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    l.status === 'new' ? 'bg-primary/5 text-primary' :
                    l.status === 'contacted' ? 'bg-warning/10 text-amber-700' :
                    l.status === 'converted' ? 'bg-emerald/10 text-emerald' :
                    'bg-border text-ink-faint'
                  }`}>{l.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-faint">{formatShortDate(l.created_at)}</td>
              </tr>
            )) ?? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">No leads yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
