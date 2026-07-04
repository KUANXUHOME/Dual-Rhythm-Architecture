// app/agent/[id]/page.tsx — Existing conversation

import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  const db = createServerClient();

  const { data: conv, error } = await db
    .from('dra_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !conv) notFound();

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 border-b border-border flex items-center px-4">
        <div className="text-xs text-ink-muted">Diagnostic session · {conv.org_name ?? 'Unnamed'}</div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={id}
          initialMessages={conv.messages ?? []}
          orgName={conv.org_name ?? undefined}
        />
      </div>
    </div>
  );
}
