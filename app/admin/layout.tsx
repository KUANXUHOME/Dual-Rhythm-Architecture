// app/admin/layout.tsx — Admin console layout with email-allowlist auth
import { auth, currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'Admin | Dual-Rhythm Architecture™' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) notFound();

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!adminEmails.includes(email.toLowerCase())) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold tracking-widest uppercase text-ink">Dual-Rhythm Architecture™ <span className="text-ink-faint">Admin</span></span>
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-ink-muted hover:text-primary">Overview</Link>
            <Link href="/admin/leads" className="text-xs text-ink-muted hover:text-primary">Leads</Link>
            <Link href="/admin/assessments" className="text-xs text-ink-muted hover:text-primary">Assessments</Link>
            <Link href="/admin/users" className="text-xs text-ink-muted hover:text-primary">Users</Link>
            <Link href="/admin/subscriptions" className="text-xs text-ink-muted hover:text-primary">Subscriptions</Link>
          </nav>
        </div>
        <span className="text-xs text-ink-faint">{email}</span>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
