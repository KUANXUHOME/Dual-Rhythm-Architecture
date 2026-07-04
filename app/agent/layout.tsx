// app/agent/layout.tsx — Agent workspace layout with sidebar
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AgentSidebar } from '@/components/layout/AgentSidebar';

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <AgentSidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
