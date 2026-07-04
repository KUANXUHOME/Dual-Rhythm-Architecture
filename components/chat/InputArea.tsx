// components/chat/InputArea.tsx
'use client';
import { type FormEvent, type ChangeEvent, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? 'Message the agent… (Enter to send, Shift+Enter for new line)'}
        rows={1}
        className="flex-1 resize-none border border-border rounded-brand px-4 py-3 text-sm text-ink 
                   placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 
                   bg-surface disabled:bg-surface-muted disabled:cursor-not-allowed
                   leading-relaxed min-h-[46px] max-h-32 overflow-y-auto"
        style={{ fieldSizing: 'content' } as React.CSSProperties}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-brand 
                   hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        <Send size={15} />
      </button>
    </form>
  );
}
