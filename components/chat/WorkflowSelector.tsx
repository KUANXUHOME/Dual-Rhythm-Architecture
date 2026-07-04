// components/chat/WorkflowSelector.tsx — Agent workflow picker (monetization driver)
'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock, Sparkles } from 'lucide-react';

interface WorkflowOption {
  id: string;
  name: string;
  description: string;
  deliverable: string;
  tier: 'free' | 'paid';
  estimatedMinutes: number;
  icon: string;
}

interface Props {
  isPaid: boolean;
  onSelect?: (workflowId: string) => void;
}

export function WorkflowSelector({ isPaid, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('stability_diagnostic');
  const ref = useRef<HTMLDivElement>(null);

  const workflows: WorkflowOption[] = [
    { id: 'stability_diagnostic', name: 'Stability Diagnostic', description: 'Full OSS™ assessment', deliverable: 'Score + breakdown + PDF', tier: 'free', estimatedMinutes: 10, icon: '📊' },
    { id: 'quarterly_review', name: 'Quarterly Board Review', description: 'Q-over-Q comparison', deliverable: 'Trend + board points', tier: 'paid', estimatedMinutes: 12, icon: '📅' },
    { id: 'ma_diligence', name: 'M&A Due Diligence', description: 'Integration risk', deliverable: 'Risk profile + red flags', tier: 'paid', estimatedMinutes: 15, icon: '🔗' },
    { id: 'crisis_response', name: 'Crisis Response', description: 'Acute instability', deliverable: '48h stabilization', tier: 'paid', estimatedMinutes: 8, icon: '🚨' },
    { id: 'team_restructuring', name: 'Team Restructuring', description: 'Reorg impact', deliverable: 'Impact forecast + timeline', tier: 'paid', estimatedMinutes: 14, icon: '🔄' },
  ];

  const current = workflows.find(w => w.id === selected) ?? workflows[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink px-2 py-1 rounded-brand hover:bg-surface-muted transition-all"
      >
        <span>{current.icon}</span>
        <span className="font-medium">{current.name}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-white border border-border rounded-large shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-surface-muted">
            <p className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" />
              Agent Workflows
            </p>
            <p className="text-[10px] text-ink-faint mt-0.5">
              {isPaid ? 'All workflows unlocked' : 'Free tier — upgrade for premium workflows'}
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {workflows.map(w => {
              const isLocked = w.tier === 'paid' && !isPaid;
              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (!isLocked) {
                      setSelected(w.id);
                      onSelect?.(w.id);
                      setOpen(false);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 border-b border-border last:border-0 transition-all
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5 cursor-pointer'}
                    ${w.id === selected ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{w.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-ink">{w.name}</p>
                        {isLocked && <Lock size={10} className="text-ink-faint" />}
                        {w.tier === 'paid' && !isLocked && (
                          <span className="text-[9px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">PRO</span>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">{w.description}</p>
                      <p className="text-[10px] text-ink-faint mt-0.5">
                        {w.estimatedMinutes} min · {w.deliverable}
                      </p>
                    </div>
                    {w.id === selected && (
                      <Check size={14} className="text-primary shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {!isPaid && (
            <div className="px-3 py-2 border-t border-border bg-surface-muted">
              <a href="/dashboard" className="text-[10px] text-primary font-semibold hover:underline">
                Upgrade to unlock all workflows →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
