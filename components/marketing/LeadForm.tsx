// components/marketing/LeadForm.tsx — Lead capture form for landing page
'use client';
import { useState } from 'react';
import { toast } from 'sonner';

export function LeadForm({ source = 'landing_footer' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), orgName: orgName.trim() || undefined, role: role.trim() || undefined, source }),
      });
      if (res.ok) {
        toast.success('Thanks! Check your inbox for next steps.');
        setEmail(''); setOrgName(''); setRole('');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="work@email.com"
          className="border border-border rounded-brand px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />
        <input
          type="text"
          value={orgName}
          onChange={e => setOrgName(e.target.value)}
          placeholder="Organization (optional)"
          className="border border-border rounded-brand px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />
      </div>
      <input
        type="text"
        value={role}
        onChange={e => setRole(e.target.value)}
        placeholder="Your role — CEO, CHRO, Consultant… (optional)"
        className="w-full border border-border rounded-brand px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full text-sm px-6 py-3 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Get Started Free →'}
      </button>
    </form>
  );
}
