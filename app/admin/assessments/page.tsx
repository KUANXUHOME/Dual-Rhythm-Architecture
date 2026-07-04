// app/admin/assessments/page.tsx — Assessment audit + manual PDF regeneration
import { createServerClient } from '@/lib/supabase';
import { formatShortDate } from '@/lib/utils';

export const metadata = { title: 'Assessments | Admin' };

export default async function AdminAssessments() {
  const db = createServerClient();
  const { data: assessments } = await db
    .from('theossindex_assessments')
    .select('id, user_email, org_name, oss, risk_zone, status, hp_lr_trap, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink mb-2">Assessment Audit</h1>
      <p className="text-xs text-ink-muted mb-6">Watch for <span className="font-bold text-warning">paid</span> status stuck — indicates webhook PDF generation failure. Use the regenerate button in the detail view.</p>
      <div className="bg-white border border-border rounded-large overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted border-b border-border">
            <tr className="text-left text-xs font-semibold text-ink-faint uppercase tracking-wide">
              <th className="px-4 py-3">OSS</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">HP/LR</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {assessments?.map(a => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                <td className="px-4 py-3 font-mono font-bold text-ink">{a.oss}</td>
                <td className="px-4 py-3 text-ink">{a.org_name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted text-xs">{a.user_email}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{a.risk_zone}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    a.status === 'report_ready' ? 'bg-primary/5 text-primary' :
                    a.status === 'paid' ? 'bg-warning/10 text-amber-700' :
                    a.status === 'complete' ? 'bg-border text-ink-faint' :
                    a.status === 'refunded' ? 'bg-danger-bg text-danger' :
                    'bg-border text-ink-faint'
                  }`}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-xs">{a.hp_lr_trap ? '🚨' : '—'}</td>
                <td className="px-4 py-3 text-xs text-ink-faint">{formatShortDate(a.created_at)}</td>
                <td className="px-4 py-3">
                  {a.status === 'paid' && (
                    <form action="/api/admin/regenerate-pdf" method="POST">
                      <input type="hidden" name="assessmentId" value={a.id} />
                      <button type="submit" className="text-xs bg-primary text-white font-semibold px-2 py-1 rounded-brand hover:bg-primary/90">
                        Regenerate PDF
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            )) ?? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-muted">No assessments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
