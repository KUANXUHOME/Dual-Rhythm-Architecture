// components/chat/ModelSelector.tsx — AI model dropdown selector
'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Lock } from 'lucide-react';

interface ModelOption {
  id: string;
  label: string;
  providerLabel: string;
  description: string;
  contextWindow: string;
  tier: 'free' | 'paid';
}

interface Props {
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  isPaid: boolean;
}

export function ModelSelector({ selectedModelId, onSelect, isPaid }: Props) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        if (data.models) setModels(data.models);
      })
      .catch(() => {
        // Fallback: at least show default model info
        setModels([{
          id: 'deepseek-chat',
          label: 'DeepSeek Chat',
          providerLabel: 'DeepSeek',
          description: 'Default model',
          contextWindow: '64K',
          tier: 'free' as const,
        }]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = models.find(m => m.id === selectedModelId) ?? models[0];

  // Group by provider
  const providers = Array.from(new Set(models.map(m => m.providerLabel)));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink px-2 py-1 rounded-brand hover:bg-surface-muted transition-all"
        title={selected?.description}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-medium">{loading ? 'Loading…' : selected?.label ?? 'Select model'}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !loading && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-border rounded-large shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-surface-muted">
            <p className="text-xs font-bold text-ink">Select AI Model</p>
            <p className="text-[10px] text-ink-faint mt-0.5">
              {isPaid ? 'All models unlocked' : 'Free tier — upgrade for premium models'}
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {providers.map(providerName => (
              <div key={providerName}>
                <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider px-3 py-1.5 bg-surface-muted/50">
                  {providerName}
                </p>
                {models.filter(m => m.providerLabel === providerName).map(m => {
                  const isLocked = m.tier === 'paid' && !isPaid;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        if (!isLocked) {
                          onSelect(m.id);
                          setOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 border-b border-border last:border-0 transition-all
                        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5 cursor-pointer'}
                        ${m.id === selectedModelId ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                            {m.label}
                            {isLocked && <Lock size={10} className="text-ink-faint" />}
                          </p>
                          <p className="text-[10px] text-ink-muted mt-0.5 line-clamp-2">{m.description}</p>
                          <p className="text-[10px] text-ink-faint mt-0.5">{m.contextWindow} context</p>
                        </div>
                        {m.id === selectedModelId && (
                          <Check size={14} className="text-primary shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
