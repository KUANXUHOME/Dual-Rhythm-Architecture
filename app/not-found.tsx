// app/not-found.tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface-subtle flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-6xl font-bold text-ink-faint mb-4">404</p>
        <h1 className="font-bold text-xl text-ink mb-2">Page not found</h1>
        <Link href="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    </main>
  );
}
