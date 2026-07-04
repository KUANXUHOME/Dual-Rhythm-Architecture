// lib/benchmark.ts — Synthetic reference benchmarks (not cohort-derived)
// Based on PDF public data + reasonable industry assumptions.
// Phase 2: switch to real anonymized cohort medians when N≥50/industry.

export interface Benchmark {
  key: string;
  label: string;
  oss: number;
  ri: number;
  a: number;
  note: string;
}

export const BENCHMARKS: Benchmark[] = [
  { key: 'saas',          label: 'SaaS / Tech',         oss: 58, ri: 52, a: 72, note: 'Synthetic reference — high acceleration sector' },
  { key: 'manufacturing', label: 'Manufacturing',        oss: 68, ri: 60, a: 45, note: 'Synthetic reference — stable cadence sector' },
  { key: 'finance',       label: 'Financial Services',   oss: 62, ri: 55, a: 60, note: 'Synthetic reference — regulated sector' },
  { key: 'ai-intensive',  label: 'AI-Intensive',         oss: 55, ri: 48, a: 78, note: 'Synthetic reference — extreme acceleration' },
  { key: 'pre-ipo',       label: 'Pre-IPO',              oss: 51, ri: 45, a: 75, note: 'Synthetic reference — pre-public acceleration' },
];

export function getBenchmarks(): Benchmark[] {
  return BENCHMARKS;
}
