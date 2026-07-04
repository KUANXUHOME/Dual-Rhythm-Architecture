// components/layout/AgentSidebar.tsx
'use server';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { UserButton } from '@clerk/nextjs';
import { Plus, LayoutDashboard, MessageSquare } from 'lucide-react';

export async function AgentSidebar() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

  const db = createServerClient();
  const { data: conversations } = await db
    .from('dra_conversations')
    .select('id, org_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <aside className="w-56 bg-surface-muted border-r border-border flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/agent" className="block text-xs font-bold tracking-widest uppercase text-ink">
          Dual-Rhythm Architecture<span className="text-primary">™</span>
        </Link>
      </div>

      {/* New session */}
      <div className="px-3 py-3">
        <Link href="/agent" className="flex items-center gap-2 text-xs font-semibold text-ink-muted 
              hover:text-primary hover:bg-primary/5 px-2 py-2 rounded-brand transition-all w-full">
          <Plus size={14} />
          New Diagnostic
        </Link>
      </div>

      {/* Recent conversations */}
      {conversations && conversations.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider px-2 py-1.5">Recent</p>
          {conversations.map(c => (
            <Link key={c.id} href={`/agent/${c.id}`}
              className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink 
                         hover:bg-primary/5 px-2 py-2 rounded-brand transition-all truncate">
              <MessageSquare size={12} className="shrink-0 text-ink-faint" />
              <span className="truncate">{c.org_name ?? 'Diagnostic session'}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom nav with login state */}
      <div className="mt-auto border-t border-border px-3 py-3 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink
              hover:bg-primary/5 px-2 py-2 rounded-brand transition-all">
          <LayoutDashboard size={13} />
          Dashboard
        </Link>
        <div className="flex items-center gap-2 px-2 py-1">
          <UserButton appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          <span className="text-xs text-ink-muted truncate flex-1" title={email}>{email}</span>
        </div>
      </div>
    </aside>
  );
}
