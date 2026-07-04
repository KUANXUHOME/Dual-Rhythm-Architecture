// app/error.tsx
'use client';
import { useEffect } from 'react';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="min-h-screen bg-surface-subtle flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-4xl font-bold text-ink-faint mb-4">Error</p>
        <h2 className="font-bold text-lg text-ink mb-2">Something went wrong</h2>
        <button onClick={reset} className="btn-primary text-sm mt-4">Try again</button>
      </div>
    </main>
  );
}
