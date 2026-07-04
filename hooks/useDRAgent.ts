// hooks/useDRAgent.ts — Custom streaming chat hook (no useChat dependency)
'use client';

import { useState, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Options {
  api?: string;
  body?: Record<string, unknown>;
  onFinish?: (message: Message) => void;
  onError?: (err: Error & { status?: number }) => void;
}

export function useDRAgent(options: Options = {}) {
  const { api = '/api/chat', body = {}, onFinish, onError } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setMessagesPublic = useCallback((ms: Message[]) => setMessages(ms), []);

  const sendMessage = useCallback(async (userContent: string) => {
    if (!userContent.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent.trim(),
      timestamp: new Date().toISOString(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    abortRef.current = new AbortController();

    const allMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    const reqBody = JSON.stringify({ ...body, messages: allMessages });

    // Inner: consume a streaming text response into the assistant message
    const consumeStream = async (res: Response) => {
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
        );
      }
      return fullText;
    };

    try {
      let res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody,
        signal: abortRef.current.signal,
      });

      // If primary (DeepSeek) fails with 5xx or network error, retry with NVIDIA fallback
      if (!res.ok && res.status >= 500) {
        const fallbackUrl = api + (api.includes('?') ? '&' : '?') + 'fallback=1';
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody,
          signal: abortRef.current.signal,
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = Object.assign(new Error(data.message ?? 'Request failed'), { status: res.status });
        throw err;
      }

      const fullText = await consumeStream(res);
      const finalMsg = { id: assistantId, role: 'assistant' as const, content: fullText };
      onFinish?.(finalMsg);

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const error = err as Error & { status?: number };
      setError(error);
      onError?.(error);
      // Remove empty assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantId || m.content));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, api, body, onFinish, onError]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  return {
    messages,
    setMessages: setMessagesPublic,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    isLoading,
    error,
    stop,
  };
}
