import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KellySizer } from '../src/core/kelly-sizer.mjs';

describe('Kelly Criterion Position Sizer Tests', () => {
  const sizer = new KellySizer({
    fractionalDamping: 0.5, // Half-Kelly
    maxPositionUsd: 500.0,
    minPositionUsd: 10.0,
    maxPortfolioRiskFraction: 0.25
  });

  it('calculates mathematically sound position size for positive statistical edge', () => {
    // 60% win rate, 2:1 payoff (gain 6%, loss 3%)
    const res = sizer.calculateSize({
      bankrollUsd: 1000.0,
      winProbability: 0.60,
      expectedGainPct: 0.06,
      expectedLossPct: 0.03,
      confidence: 1.0
    });

    assert.ok(res.allocatedUsd > 0);
    assert.strictEqual(res.payoffRatio, 2.0);
    // b = 2, p = 0.6, q = 0.4. Full Kelly = (0.6*2 - 0.4) / 2 = 0.8 / 2 = 0.4 (40%)
    // Half-Kelly = 20% capped at maxPortfolioRiskFraction 25% => 20% of 1000 = $200
    assert.strictEqual(res.fullKellyFraction, 0.4);
    assert.strictEqual(res.fraction, 0.2);
    assert.strictEqual(res.allocatedUsd, 200.0);
    assert.strictEqual(res.capped, false);
  });

  it('strictly rejects negative statistical edge with zero allocation', () => {
    // 30% win rate, 1:1 payoff -> negative expectancy
    const res = sizer.calculateSize({
      bankrollUsd: 1000.0,
      winProbability: 0.30,
      expectedGainPct: 0.04,
      expectedLossPct: 0.04
    });

    assert.strictEqual(res.allocatedUsd, 0);
    assert.strictEqual(res.fraction, 0);
    assert.match(res.reason, /Negative statistical edge/);
  });

  it('enforces hard maximum position cap ($500)', () => {
    // Huge bankroll with high edge
    const res = sizer.calculateSize({
      bankrollUsd: 10000.0,
      winProbability: 0.80,
      expectedGainPct: 0.10,
      expectedLossPct: 0.02
    });

    assert.strictEqual(res.allocatedUsd, 500.0);
    assert.strictEqual(res.capped, true);
  });

  it('rejects allocations below minimum dollar threshold ($10)', () => {
    const res = sizer.calculateSize({
      bankrollUsd: 50.0, // small bankroll
      winProbability: 0.55,
      expectedGainPct: 0.03,
      expectedLossPct: 0.03
    });

    assert.strictEqual(res.allocatedUsd, 0);
    assert.match(res.reason, /below minimum threshold/);
  });

  it('rejects invalid or non-positive input boundaries', () => {
    const zeroBankroll = sizer.calculateSize({ bankrollUsd: 0, winProbability: 0.6, expectedGainPct: 0.05, expectedLossPct: 0.02 });
    assert.strictEqual(zeroBankroll.allocatedUsd, 0);

    const badWinProb = sizer.calculateSize({ bankrollUsd: 1000, winProbability: 1.5, expectedGainPct: 0.05, expectedLossPct: 0.02 });
    assert.strictEqual(badWinProb.allocatedUsd, 0);
  });
});
