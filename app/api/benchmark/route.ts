// app/api/benchmark/route.ts — Public benchmark endpoint
import { NextResponse } from 'next/server';
import { getBenchmarks } from '@/lib/benchmark';

export async function GET() {
  return NextResponse.json({
    benchmarks: getBenchmarks(),
    disclaimer: 'Synthetic reference benchmarks, not cohort-derived. Real cohort data will replace these once sufficient user data is available.',
  });
}
