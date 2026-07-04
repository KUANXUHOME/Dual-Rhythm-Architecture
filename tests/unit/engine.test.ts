import { describe, it, expect } from 'vitest';
import {
  calculateTheOSSIndex,
  getRiskZone,
  getTrendAlert,
  answersToDimensions,
  RISK_ZONE_META,
} from '@/lib/theossindex-engine';

describe('calculateTheOSSIndex — formula correctness', () => {
  it('ER=PR=RI=100, A=0 → OSS=100', () => {
    expect(calculateTheOSSIndex({ er: 100, pr: 100, ri: 100, a: 0 }).oss).toBe(100);
  });

  it('any dimension=0 → OSS=0 (geometric mean property)', () => {
    expect(calculateTheOSSIndex({ er: 0, pr: 80, ri: 70, a: 10 }).oss).toBe(0);
    expect(calculateTheOSSIndex({ er: 80, pr: 0, ri: 70, a: 10 }).oss).toBe(0);
    expect(calculateTheOSSIndex({ er: 80, pr: 70, ri: 0, a: 10 }).oss).toBe(0);
  });

  it('ER=PR=RI=80, A=90 → OSS≈42.1', () => {
    const r = calculateTheOSSIndex({ er: 80, pr: 80, ri: 80, a: 90 });
    expect(r.oss).toBeCloseTo(42.1, 0);
  });

  it('ER=82,PR=74,RI=52,A=78 → HP/LR trap detected', () => {
    const r = calculateTheOSSIndex({ er: 82, pr: 74, ri: 52, a: 78 });
    expect(r.hpLrTrapDetected).toBe(true);
    expect(r.oss).toBeGreaterThan(0);
    expect(r.oss).toBeLessThan(50);
  });

  it('OSS is clamped to [0, 100]', () => {
    const high = calculateTheOSSIndex({ er: 100, pr: 100, ri: 100, a: 0 });
    expect(high.oss).toBeLessThanOrEqual(100);
    const low = calculateTheOSSIndex({ er: 0, pr: 0, ri: 0, a: 100 });
    expect(low.oss).toBeGreaterThanOrEqual(0);
  });
});

describe('HP/LR Trap detection', () => {
  it('detects trap when er>75 && pr>70 && ri<55 && a>70', () => {
    expect(calculateTheOSSIndex({ er: 80, pr: 75, ri: 50, a: 75 }).hpLrTrapDetected).toBe(true);
  });

  it('no trap when ri>=55 (boundary)', () => {
    expect(calculateTheOSSIndex({ er: 80, pr: 75, ri: 55, a: 75 }).hpLrTrapDetected).toBe(false);
  });

  it('no trap when er<=75 (boundary)', () => {
    expect(calculateTheOSSIndex({ er: 75, pr: 75, ri: 50, a: 75 }).hpLrTrapDetected).toBe(false);
  });

  it('no trap when pr<=70 (boundary)', () => {
    expect(calculateTheOSSIndex({ er: 80, pr: 70, ri: 50, a: 75 }).hpLrTrapDetected).toBe(false);
  });

  it('no trap when a<=70 (boundary)', () => {
    expect(calculateTheOSSIndex({ er: 80, pr: 75, ri: 50, a: 70 }).hpLrTrapDetected).toBe(false);
  });
});

describe('getRiskZone — zone boundaries', () => {
  it('score >=80 → structural_advantage', () => {
    expect(getRiskZone(80)).toBe('structural_advantage');
    expect(getRiskZone(100)).toBe('structural_advantage');
  });

  it('score >=65 → controlled_stability', () => {
    expect(getRiskZone(65)).toBe('controlled_stability');
    expect(getRiskZone(79)).toBe('controlled_stability');
  });

  it('score >=50 → fragile_balance', () => {
    expect(getRiskZone(50)).toBe('fragile_balance');
    expect(getRiskZone(64)).toBe('fragile_balance');
  });

  it('score >=35 → destabilization_risk', () => {
    expect(getRiskZone(35)).toBe('destabilization_risk');
    expect(getRiskZone(49)).toBe('destabilization_risk');
  });

  it('score <35 → structural_instability', () => {
    expect(getRiskZone(34)).toBe('structural_instability');
    expect(getRiskZone(0)).toBe('structural_instability');
  });

  it('RISK_ZONE_META has all 5 zones with required fields', () => {
    expect(Object.keys(RISK_ZONE_META)).toHaveLength(5);
    for (const key of Object.keys(RISK_ZONE_META)) {
      const meta = RISK_ZONE_META[key as keyof typeof RISK_ZONE_META];
      expect(meta).toHaveProperty('name');
      expect(meta).toHaveProperty('color');
      expect(meta).toHaveProperty('range');
      expect(meta).toHaveProperty('bg');
      expect(meta).toHaveProperty('border');
    }
  });
});

describe('maxReachableOSS — acceleration ceiling', () => {
  it('A=0 → max 100', () => {
    expect(calculateTheOSSIndex({ er: 100, pr: 100, ri: 100, a: 0 }).maxReachableOSS).toBe(100);
  });

  it('A=100 → max 50', () => {
    expect(calculateTheOSSIndex({ er: 100, pr: 100, ri: 100, a: 100 }).maxReachableOSS).toBe(50);
  });

  it('A=70 → max ≈58.8', () => {
    const r = calculateTheOSSIndex({ er: 100, pr: 100, ri: 100, a: 70 });
    expect(r.maxReachableOSS).toBeCloseTo(58.8, 0);
  });
});

describe('getTrendAlert — trend change detection', () => {
  it('fewer than 2 data points → none', () => {
    expect(getTrendAlert([{ oss: 50, date: '2025-01-01' }])).toBe('none');
    expect(getTrendAlert([])).toBe('none');
  });

  it('>15% change → red alert', () => {
    expect(getTrendAlert([{ oss: 100, date: 'x' }, { oss: 80, date: 'y' }])).toBe('red');
  });

  it('>8% change → yellow alert', () => {
    expect(getTrendAlert([{ oss: 100, date: 'x' }, { oss: 90, date: 'y' }])).toBe('yellow');
  });

  it('<8% change → none', () => {
    expect(getTrendAlert([{ oss: 100, date: 'x' }, { oss: 95, date: 'y' }])).toBe('none');
  });

  it('prev=0 → none (avoids division by zero)', () => {
    expect(getTrendAlert([{ oss: 0, date: 'x' }, { oss: 50, date: 'y' }])).toBe('none');
  });
});

describe('answersToDimensions — questionnaire mapping', () => {
  it('all 5s → 100 per dimension', () => {
    const dims = answersToDimensions([[5,5,5,5,5],[5,5,5,5,5],[5,5,5,5,5],[5,5,5,5,5]]);
    expect(dims.er).toBe(100);
    expect(dims.pr).toBe(100);
    expect(dims.ri).toBe(100);
    expect(dims.a).toBe(100);
  });

  it('all 1s → 0 per dimension', () => {
    const dims = answersToDimensions([[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]]);
    expect(dims.er).toBe(0);
    expect(dims.pr).toBe(0);
    expect(dims.ri).toBe(0);
    expect(dims.a).toBe(0);
  });

  it('all 3s → 50 per dimension (midpoint)', () => {
    const dims = answersToDimensions([[3,3,3,3,3],[3,3,3,3,3],[3,3,3,3,3],[3,3,3,3,3]]);
    expect(dims.er).toBe(50);
    expect(dims.pr).toBe(50);
    expect(dims.ri).toBe(50);
    expect(dims.a).toBe(50);
  });
});

describe('backward-compat aliases', () => {
  it('calculateOSS alias produces same result as calculateTheOSSIndex', async () => {
    const { calculateOSS } = await import('@/lib/theossindex-engine');
    const viaAlias = calculateOSS({ er: 80, pr: 80, ri: 80, a: 90 });
    const viaCanonical = calculateTheOSSIndex({ er: 80, pr: 80, ri: 80, a: 90 });
    expect(viaAlias.oss).toBe(viaCanonical.oss);
    expect(viaAlias.hpLrTrapDetected).toBe(viaCanonical.hpLrTrapDetected);
  });
});
