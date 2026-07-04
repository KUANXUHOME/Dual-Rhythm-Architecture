// app/agent/page.tsx — New conversation / agent home
import { ChatInterface } from '@/components/chat/ChatInterface';

export const metadata = { title: 'Agent | DUAL-RHYTHM ARCHITECTURE™' };

export default function AgentPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="h-12 border-b border-border flex items-center px-4">
        <div className="text-xs text-ink-muted">New diagnostic session</div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
