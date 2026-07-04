// lib/theossindex-engine.ts
// Canonical Constitution v1.0.0 · DOI: 10.5281/zenodo.19941449
// DO NOT MODIFY THE FORMULA
import 'server-only';

export type RiskZone =
  | 'structural_advantage'
  | 'controlled_stability'
  | 'fragile_balance'
  | 'destabilization_risk'
  | 'structural_instability';

export interface TheOSSIndexInput {
  er: number; // Execution Rhythm       [0–100]
  pr: number; // Pressure Regulation    [0–100]
  ri: number; // Recovery Integrity     [0–100] — leading indicator
  a:  number; // Acceleration Intensity [0–100] — amplifier / risk factor
}

export interface ActionRecommendation {
  priority:      'critical' | 'high' | 'medium';
  dimension:     'er' | 'pr' | 'ri' | 'a';
  dimensionName: string;
  message:       string;
}

export interface TheOSSIndexResult {
  oss:               number;   // Final score [0–100]
  ssc:               number;   // Structural Stability Core (geometric mean)
  riskZone:          RiskZone;
  riskZoneName:      string;
  riskZoneColor:     string;
  hpLrTrapDetected:  boolean;
  maxReachableOSS:   number;   // Given current A, max possible OSS
  recommendations:   ActionRecommendation[];
}

// ─── Risk zone metadata ───────────────────────────────────────────────────
export const RISK_ZONE_META: Record<RiskZone, {
  name: string; color: string; range: string; bg: string; border: string;
}> = {
  structural_advantage:   { name: 'Structural Advantage',  color: '#0A6640', range: '80–100', bg: 'rgba(10,102,64,0.08)',  border: '#0A6640' },
  controlled_stability:   { name: 'Controlled Stability',  color: '#059669', range: '65–79',  bg: 'rgba(5,150,105,0.08)',  border: '#059669' },
  fragile_balance:        { name: 'Fragile Balance',        color: '#F59E0B', range: '50–64',  bg: 'rgba(245,158,11,0.08)', border: '#F59E0B' },
  destabilization_risk:   { name: 'Destabilization Risk',   color: '#DC2626', range: '35–49',  bg: 'rgba(220,38,38,0.08)', border: '#DC2626' },
  structural_instability: { name: 'Structural Instability', color: '#991B1B', range: '0–34',   bg: 'rgba(153,27,27,0.1)',  border: '#991B1B' },
};

// ─── Core formula ─────────────────────────────────────────────────────────
export function getRiskZone(oss: number): RiskZone {
  if (oss >= 80) return 'structural_advantage';
  if (oss >= 65) return 'controlled_stability';
  if (oss >= 50) return 'fragile_balance';
  if (oss >= 35) return 'destabilization_risk';
  return 'structural_instability';
}

export function calculateTheOSSIndex(input: TheOSSIndexInput): TheOSSIndexResult {
  const { er, pr, ri, a } = input;

  // Step 1 — Structural Stability Core (geometric mean)
  const ssc = Math.cbrt(er * pr * ri);

  // Step 2 — Apply acceleration penalty
  const raw = ssc / (1 + a / 100);

  // Step 3 — Clamp to [0, 100]
  const oss = Math.min(100, Math.max(0, raw));

  const riskZone          = getRiskZone(oss);
  const hpLrTrapDetected  = er > 75 && pr > 70 && ri < 55 && a > 70;
  const maxReachableOSS   = Math.min(100, 100 / (1 + a / 100));
  const meta              = RISK_ZONE_META[riskZone];

  return {
    oss:             Math.round(oss * 10) / 10,
    ssc:             Math.round(ssc * 10) / 10,
    riskZone,
    riskZoneName:    meta.name,
    riskZoneColor:   meta.color,
    hpLrTrapDetected,
    maxReachableOSS: Math.round(maxReachableOSS * 10) / 10,
    recommendations: buildRecommendations(input, riskZone),
  };
}

// ─── Questionnaire → dimensions ──────────────────────────────────────────
// Answers: 4 dims × 5 questions, each 1–5 Likert
// Formula: (sum − 5) / 20 × 100 → range [0, 100]
export function answersToDimensions(answers: number[][]): TheOSSIndexInput {
  const dims = answers.map(dim => {
    const sum = dim.reduce((a, b) => a + b, 0);  // range [5, 25]
    return Math.round(((sum - 5) / 20) * 100);    // range [0, 100]
  });
  return { er: dims[0], pr: dims[1], ri: dims[2], a: dims[3] };
}

// ─── Max reachable OSS given A ────────────────────────────────────────────
export function maxReachableOSS(a: number): number {
  return Math.round((100 / (1 + a / 100)) * 10) / 10;
}

// ─── Action recommendations ───────────────────────────────────────────────
function buildRecommendations(input: TheOSSIndexInput, zone: RiskZone): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];

  // RI is the leading indicator — always check first
  if (input.ri < 55) {
    recs.push({ priority: 'critical', dimension: 'ri', dimensionName: 'Recovery Integrity',
      message: 'Recovery Integrity is critically low. Establish post-project debriefs, normalize time off, and introduce deliberate recovery protocols immediately. RI is your leading indicator — it deteriorates before OSS visibly drops.' });
  } else if (input.ri < 70) {
    recs.push({ priority: 'high', dimension: 'ri', dimensionName: 'Recovery Integrity',
      message: 'Recovery Integrity needs attention. Introduce consistent post-mortem processes and monitor trend quarterly.' });
  }

  if (input.pr < 50) {
    recs.push({ priority: 'critical', dimension: 'pr', dimensionName: 'Pressure Regulation',
      message: 'Pressure Regulation is failing. Implement distributed decision-making and load-balancing mechanisms immediately.' });
  } else if (input.pr < 65) {
    recs.push({ priority: 'high', dimension: 'pr', dimensionName: 'Pressure Regulation',
      message: 'Pressure Regulation is weakening. Monitor decision quality under stress and introduce escalation safeguards.' });
  }

  if (input.a > 70 && (zone === 'destabilization_risk' || zone === 'structural_instability')) {
    recs.push({ priority: 'critical', dimension: 'a', dimensionName: 'Acceleration Intensity',
      message: `Acceleration Intensity (${input.a}) exceeds structural capacity. At A=${input.a}, your maximum achievable OSS is ${Math.round(100 / (1 + input.a / 100))}. Consider pausing new initiatives.` });
  }

  if (input.er < 40) {
    recs.push({ priority: 'high', dimension: 'er', dimensionName: 'Execution Rhythm',
      message: 'Execution Rhythm is severely impaired. Establish basic cadence and sprint tracking before any acceleration.' });
  }

  if (recs.length === 0) {
    recs.push({ priority: 'medium', dimension: 'ri', dimensionName: 'Recovery Integrity',
      message: zone === 'structural_advantage'
        ? 'Excellent structural position. Monitor Recovery Integrity quarterly — it is your early warning indicator.'
        : 'Maintain current trajectory. Focus on RI as your leading indicator.' });
  }

  return recs;
}

// ─── Validation ───────────────────────────────────────────────────────────
// Scenario tests (verified canonical):
// ER=PR=RI=100, A=0  → OSS=100  ✅
// any dim=0          → OSS=0    ✅
// ER=PR=RI=80, A=90  → OSS≈42.1 ✅
// ER=82,PR=74,RI=52,A=78 → OSS≈38.2, HPLR=true ✅

// ─── Trigger Zone (PDF 2 Part III — 4-zone board action system) ────────────
export type TriggerZone = 'green' | 'yellow' | 'orange' | 'red';

export const TRIGGER_ZONE_META: Record<TriggerZone, { label: string; action: string; color: string }> = {
  green:  { label: 'Controlled Synchronization', action: 'Acceleration may be authorized', color: '#0A6640' },
  yellow: { label: 'Volatility Expansion',        action: 'Expansion restricted; recovery reinforced', color: '#F59E0B' },
  orange: { label: 'Structural Risk',             action: 'All non-core growth frozen; governance intervention', color: '#EA580C' },
  red:    { label: 'Collapse Acceleration',       action: 'Mandatory stabilization cycle; all expansion ceases', color: '#DC2626' },
};

export function getTriggerZone(oss: number): TriggerZone {
  if (oss >= 65) return 'green';
  if (oss >= 50) return 'yellow';
  if (oss >= 35) return 'orange';
  return 'red';
}

// ─── Trend Alert (PDF 1 §1.10 — ΔOSS/ΔTime thresholds) ────────────────────
export type TrendAlert = 'none' | 'yellow' | 'red';

export function getTrendAlert(history: { oss: number; date: string }[]): TrendAlert {
  if (history.length < 2) return 'none';
  const prev = history[history.length - 2].oss;
  const curr = history[history.length - 1].oss;
  if (prev === 0) return 'none';
  const pct = Math.abs((curr - prev) / prev) * 100;
  if (pct > 15) return 'red';
  if (pct > 8) return 'yellow';
  return 'none';
}

// ─── Backward-compatible aliases (deprecated; use TheOSSIndex* names) ──────
// The canonical engineering namespace is TheOSSIndex (per DRA™ Canonical
// Constitution v1.0.0). These aliases preserve compatibility with any
// call sites not yet migrated; new code MUST use the TheOSSIndex* names.
export type OSSInput = TheOSSIndexInput;
export type OSSResult = TheOSSIndexResult;
export const calculateOSS = calculateTheOSSIndex;
