// components/chat/ChatInterface.tsx — Dual-Rhythm Architecture™ Agent chat interface
'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDRAgent, type Message } from '@/hooks/useDRAgent';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { UsageBanner } from './UsageBanner';
import { TheOSSIndexResultInline, type OSSDisplayDTO } from './TheOSSIndexResultInline';
import { ModelSelector } from './ModelSelector';
import { WorkflowSelector } from './WorkflowSelector';
import { buildUpgradeLink } from '@/lib/stripe';

interface Props {
  conversationId?: string;
  initialMessages?: Message[];
  orgName?: string;
}

function parseOSSScores(text: string): { er: number; pr: number; ri: number; a: number; sub?: unknown } | null {
  const m = text.match(/<OSS_SCORES>(\{[^<]*?\})<\/OSS_SCORES>/);
  if (!m) return null;
  try {
    const s = JSON.parse(m[1]);
    if (typeof s.er === 'number' && s.ready) return s;
  } catch { /* ignore */ }
  return null;
}

function stripScoresTag(text: string): string {
  return text.replace(/<OSS_SCORES>[^<]*<\/OSS_SCORES>/g, '').trim();
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hello. I'm the **Dual-Rhythm Architecture™** organizational stability agent.

I'll help you measure your organization's structural stability using The OSS Index™ — a peer-reviewed, physics-based framework (DOI: 10.5281/zenodo.19941449).

This diagnostic takes 10–15 minutes.

**To get started:** What's your organization's name, and what's your role?`,
};

export function ChatInterface({ conversationId, initialMessages, orgName }: Props) {
  const { user } = useUser();
  const email     = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const bottomRef = useRef<HTMLDivElement>(null);
  const [convId]                       = useState(conversationId ?? '');
  const [dailyExceeded, setDailyExceeded] = useState(false);
  const [ossScores, setOSSScores]         = useState<{ er: number; pr: number; ri: number; a: number; sub?: unknown } | null>(null);
  const [assessmentId, setAssessmentId]   = useState('');
  const [ossDisplay, setOSSDisplay]       = useState<OSSDisplayDTO | null>(null);
  const [selectedModelId, setSelectedModelId] = useState('deepseek-chat');
  const [isPaid, setIsPaid] = useState(false);

  // Fetch user's paid status for model gating
  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => { if (data.isPaid !== undefined) setIsPaid(data.isPaid); })
      .catch(() => {});
  }, []);

  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading } = useDRAgent({
    api: '/api/chat',
    body: {
      conversationId: convId || undefined,
      orgName,
      modelId: selectedModelId,
    },
    async onFinish(msg) {
      const scores = parseOSSScores(msg.content);
      if (scores) {
        setOSSScores(scores);
        try {
          const res = await fetch('/api/assessments/from-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              er: scores.er, pr: scores.pr, ri: scores.ri, a: scores.a,
              sub: scores.sub,
              conversationId: convId || undefined,
              orgName,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.assessmentId) setAssessmentId(data.assessmentId);
            if (data.display) setOSSDisplay(data.display);
          }
        } catch { /* non-fatal */ }
      }
    },
    onError(err) {
      if (err.status === 429) setDailyExceeded(true);
    },
  });

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    } else {
      setMessages([WELCOME]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const upgradeLink = assessmentId
    ? buildUpgradeLink(assessmentId, email)
    : 'https://buy.stripe.com/dRmdR9879bI45rW96J2Fa01';

  return (
    <div className="flex flex-col h-full">
      {dailyExceeded && <UsageBanner upgradeLink={upgradeLink} />}

      {/* Top toolbar: model selector + workflow selector */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-surface-muted/50">
        <WorkflowSelector isPaid={isPaid} />
        <ModelSelector
          selectedModelId={selectedModelId}
          onSelect={setSelectedModelId}
          isPaid={isPaid}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map(m => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.role === 'assistant' ? stripScoresTag(m.content) : m.content}
            />
          ))}

          {ossScores && assessmentId && ossDisplay && (
            <TheOSSIndexResultInline
              scores={ossScores}
              display={ossDisplay}
              assessmentId={assessmentId}
              email={email}
            />
          )}

          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-[8px] font-bold tracking-tight">DRA</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <InputArea
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isLoading || dailyExceeded}
            placeholder={
              dailyExceeded
                ? 'Daily limit reached — upgrade to continue'
                : 'Reply to the agent…'
            }
          />
        </div>
      </div>
    </div>
  );
}
