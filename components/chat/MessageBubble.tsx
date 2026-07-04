// components/chat/MessageBubble.tsx
import ReactMarkdown from 'react-markdown';

interface Props {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: Props) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bubble-user">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex gap-3 max-w-[85%]">
        {/* Agent avatar */}
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-[8px] font-bold tracking-tight">DRA</span>
        </div>
        <div className="bubble-agent prose prose-sm prose-slate max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
