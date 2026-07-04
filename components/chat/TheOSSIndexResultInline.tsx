// components/chat/TheOSSIndexResultInline.tsx — Inline The OSS Index™ result card in the chat
// Pure display component. No engine import. No formula in client bundle.
// The display DTO is computed server-side by /api/assessments/from-chat and passed via props.
'use client';
import { buildUpgradeLink } from '@/lib/stripe';

export interface OSSDisplayDTO {
  oss:              number;
  riskZoneName:     string;
  riskZoneColor:    string;
  riskZoneRange:    string;
  hpLrTrapDetected: boolean;
}

interface Props {
  scores: { er: number; pr: number; ri: number; a: number };
  display: OSSDisplayDTO;
  assessmentId: string;
  email?: string;
}

export function TheOSSIndexResultInline({ scores, display, assessmentId, email }: Props) {
  const payLink = buildUpgradeLink(assessmentId, email ?? '');

  return (
    <div className="border border-primary/20 bg-surface-subtle rounded-large p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary">The OSS Index™ Diagnostic Result</span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-5">
        <div className="text-7xl font-bold font-mono" style={{ color: display.riskZoneColor }}>{display.oss}</div>
        <div>
          <div className="text-base font-bold" style={{ color: display.riskZoneColor }}>{display.riskZoneName}</div>
          <div className="text-xs text-ink-muted mt-1">Range: {display.riskZoneRange}</div>
          {display.hpLrTrapDetected && (
            <div className="text-xs font-bold text-danger mt-1">🚨 HP/LR Trap detected</div>
          )}
        </div>
      </div>

      {/* Dimension bars — raw user input scores, not formula */}
      <div className="space-y-2">
        {[
          { k: 'ER', n: 'Execution Rhythm',     v: scores.er },
          { k: 'PR', n: 'Pressure Regulation',  v: scores.pr },
          { k: 'RI', n: 'Recovery Integrity',   v: scores.ri },
          { k: 'A',  n: 'Acceleration',         v: scores.a  },
        ].map(d => {
          const c = d.k === 'A'
            ? (d.v < 30 ? '#0A6640' : d.v < 60 ? '#F59E0B' : '#DC2626')
            : (d.v >= 70 ? '#0A6640' : d.v >= 50 ? '#F59E0B' : '#DC2626');
          return (
            <div key={d.k} className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold w-5 text-ink">{d.k}</span>
              <span className="text-ink-muted w-28">{d.n}</span>
              <div className="flex-1 bg-border rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${d.v}%`, backgroundColor: c }} />
              </div>
              <span className="font-mono font-bold w-7 text-right" style={{ color: c }}>{d.v}</span>
            </div>
          );
        })}
      </div>

      {/* Upsell */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-ink-muted mb-3">Unlock the complete board-ready analysis, 3 priority recommendations, and PDF report.</p>
        <a href={payLink} className="btn-gold inline-block text-sm px-6 py-2.5">
          Unlock Full Report — $299 →
        </a>
      </div>
    </div>
  );
}
