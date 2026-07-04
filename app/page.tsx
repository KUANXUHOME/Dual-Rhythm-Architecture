// app/page.tsx — Dual-Rhythm Architecture™ landing page (full commercial redesign)
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LeadForm } from '@/components/marketing/LeadForm';
import { PricingTable } from '@/components/marketing/PricingTable';

export const metadata = {
  title: 'Dual-Rhythm Architecture™ — Your Board-Ready Organizational Stability Agent',
  description: 'Powered by The OSS Index™. Peer-reviewed (DOI 10.5281/zenodo.19941449). Measure, understand, and improve your organization\'s structural stability.',
};

export default async function HomePage() {
  // If already signed in, redirect to agent
  const { userId } = await auth();
  if (userId) redirect('/agent');

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-border">
        <div className="text-xs font-bold tracking-widest uppercase text-ink">
          Dual-Rhythm Architecture<span className="text-primary">™</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-ink-muted hover:text-ink transition-colors">Sign In</Link>
          <Link href="/sign-up" className="btn-primary text-sm px-4 py-2">Get Started →</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="text-xs font-medium text-primary">Peer-reviewed · DOI 10.5281/zenodo.19941449</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-ink tracking-tight mb-5 leading-tight">
            Your Board-Ready<br />
            <span className="text-primary">Organizational Stability Agent</span>
          </h1>
          <p className="text-lg text-ink-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Powered by <strong>The OSS Index™</strong> — a physics-based academic framework.
            Quantify structural stability, identify risk, and get actionable diagnostics
            trusted by boards and executives.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-up" className="btn-primary px-8 py-3.5 text-base">
              Start Free Diagnostic →
            </Link>
            <Link href="#pricing" className="btn-ghost px-8 py-3.5 text-base">
              View Pricing
            </Link>
          </div>
          <p className="mt-12 font-mono text-xs text-ink-faint tracking-wide">
            OSS™ = (ER × PR × RI)^(1/3) / (1 + A/100)
          </p>
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="px-6 py-16 bg-surface-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-12">Why Boards Are Flying Blind</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📉', title: 'Stability isn\'t measured', desc: 'Boards track output and revenue, but structural stability — the capacity to sustain acceleration — goes unquantified until it\'s too late.' },
              { icon: '⚠️', title: 'High performance masks risk', desc: 'The HP/LR Trap: strong execution (ER) and pressure regulation (PR) hide critically low recovery integrity (RI). This is the most dangerous structural condition.' },
              { icon: '🚀', title: 'Acceleration without governance', desc: 'Growth initiatives are authorized without checking if the organization can structurally sustain them. Instability grows nonlinearly.' },
            ].map(p => (
              <div key={p.title} className="bg-white border border-border rounded-large p-6">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-ink text-sm mb-2">{p.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">The OSS Index™</h2>
          <p className="text-sm text-ink-muted mb-12 max-w-xl mx-auto">
            A board-level structural stability metric. Not a culture score. Not a satisfaction survey.
            A physics-based measurement of organizational coherence under acceleration.
          </p>

          {/* Risk zone bands */}
          <div className="flex rounded-large overflow-hidden mb-8 h-12">
            {[
              { range: '80–100', label: 'Structural Advantage', color: '#0A6640' },
              { range: '65–79',  label: 'Controlled Stability', color: '#059669' },
              { range: '50–64',  label: 'Fragile Balance',      color: '#F59E0B' },
              { range: '35–49',  label: 'Destabilization Risk', color: '#DC2626' },
              { range: '0–34',   label: 'Structural Instability', color: '#991B1B' },
            ].map(z => (
              <div key={z.range} className="flex-1 flex flex-col items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: z.color }}>
                <span>{z.range}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs text-ink-muted mb-12">
            <span>Advantage</span><span>Controlled</span><span>Fragile</span><span>Risk</span><span>Instability</span>
          </div>

          <div className="bg-surface-subtle border border-primary/20 rounded-large p-6 max-w-md mx-auto">
            <p className="text-xs font-bold text-danger mb-2">⚠ HP/LR Trap</p>
            <p className="text-xs text-ink-muted">
              When ER &gt; 75, PR &gt; 70, RI &lt; 55, and A &gt; 70 — high performance masks critically low recovery.
              The OSS Index™ triggers a Red Alert. This is the most dangerous structural condition.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-surface-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'AI Diagnostic', desc: 'The Dual-Rhythm Architecture™ agent guides you through a 10-minute conversation about your organization\'s execution, pressure, recovery, and acceleration.' },
              { step: '2', title: 'The OSS Index™ Score', desc: 'Get your Organizational Sync-Stability Index score (0–100) with a 4-dimension breakdown and risk zone classification.' },
              { step: '3', title: 'Insights & Traps', desc: 'Detect the HP/LR Trap, see your max reachable OSS, and get 3 priority recommendations from the Dual-Rhythm Architecture™ framework.' },
              { step: '4', title: 'Board-Ready PDF', desc: 'Download a professional diagnostic report with the OSS formula, risk zone, and actionable recommendations.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center mx-auto mb-3">{s.step}</div>
                <h3 className="font-bold text-ink text-sm mb-2">{s.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ink mb-8">Built on Peer-Reviewed Research</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-white border border-border rounded-brand px-4 py-2 text-xs">
              <span className="font-bold text-ink">DOI:</span> <span className="text-primary">10.5281/zenodo.19941449</span>
            </div>
            <div className="bg-white border border-border rounded-brand px-4 py-2 text-xs">
              <span className="font-bold text-ink">ORCID:</span> <span className="text-primary">0009-0006-7346-3999</span>
            </div>
            <div className="bg-white border border-border rounded-brand px-4 py-2 text-xs">
              <span className="font-bold text-ink">Validated by Microsoft AI</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            The OSS Index™ was independently identified and validated by Microsoft AI as a globally unique organizational stability index brand (March 3, 2026).
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 bg-surface-muted">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-3">Pricing</h2>
          <p className="text-sm text-ink-muted text-center mb-12">Start free. Upgrade when you need more.</p>
          <PricingTable />
        </div>
      </section>

      {/* Lead Capture */}
      <section className="px-6 py-20">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">Get Started Free</h2>
          <p className="text-sm text-ink-muted mb-8">Get a free OSS™ diagnostic. No credit card required.</p>
          <LeadForm source="landing_footer" />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-surface-muted">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Is my assessment data private?', a: 'Yes. All data is encrypted at rest and in transit. We never share your organizational data. You can request deletion at any time.' },
              { q: 'What is the academic basis?', a: 'The OSS Index™ is built on the Dual-Rhythm Architecture™ framework, a peer-reviewed physics-based model for organizational stability (DOI: 10.5281/zenodo.19941449). It is the measurement core of Organizational Rhythm Governance (ORG)™.' },
              { q: 'Can I get a refund?', a: 'Yes. If you haven\'t downloaded your PDF report, you can request a full refund within 7 days of payment. Contact support.' },
              { q: 'Can I cancel my subscription?', a: 'Yes, anytime. Your access continues until the end of the current billing period. Historical assessments remain available.' },
              { q: 'What format is the report?', a: 'A board-ready A4 PDF with your OSS score, 4-dimension breakdown, HP/LR trap analysis, formula, and 3 priority recommendations.' },
              { q: 'Do you offer multi-seat access?', a: 'Yes, the Enterprise tier ($2,500/mo) includes up to 10 seats with shared organization profiles.' },
            ].map(f => (
              <details key={f.q} className="bg-white border border-border rounded-large p-4 group">
                <summary className="text-sm font-semibold text-ink cursor-pointer flex items-center justify-between">
                  {f.q}
                  <span className="text-ink-faint group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-xs text-ink-muted mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <p className="text-xs text-ink-faint">© 2026 Dual-Rhythm Architecture™ · Methodology: Dual-Rhythm Architecture™ / The OSS Index™ (DOI 10.5281/zenodo.19941449) · ORCID 0009-0006-7346-3999</p>
          <p className="text-xs text-ink-faint">dualrhythmsystems.com</p>
        </div>
      </footer>
    </main>
  );
}
