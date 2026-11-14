import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RiskEngine } from '../src/core/risk-engine.mjs';

describe('Policy Guardrails & Non-Custodial Boundaries Tests', () => {
  it('marks actions above $250 as requiring explicit non-custodial owner signature', () => {
    const engine = new RiskEngine();

    const lowTrade = engine.assessProposal({
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 150.0 // < $250
    });
    assert.strictEqual(lowTrade.requiresOwnerSignature, false);

    const highTrade = engine.assessProposal({
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 350.0 // >= $250
    });
    assert.strictEqual(highTrade.requiresOwnerSignature, true);
  });

  it('honors custom policy overrides in constructor', () => {
    const conservativeEngine = new RiskEngine({
      capitalLimits: {
        maxSinglePositionUsd: 100.0, // Tighter cap
        minPositionUsd: 10.0,
        maxDailyLossUsd: 10.0,
        maxDrawdownPct: 1.0,
        coolingPeriodMinutes: 30
      },
      leverageLimits: {
        maxLeverage: 1.5 // Max 1.5x
      }
    });

    const res = conservativeEngine.assessProposal({
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 150.0 // Exceeds 100 cap
    });
    assert.strictEqual(res.approved, false);
    assert.strictEqual(res.layer, 'SIZE_LIMIT');

    const perpRes = conservativeEngine.assessProposal({
      asset: 'SOL',
      protocol: 'adrena',
      sizeUsd: 50.0,
      leverage: 2.0 // Exceeds 1.5x cap
    });
    assert.strictEqual(perpRes.approved, false);
    assert.strictEqual(perpRes.layer, 'LEVERAGE_LIMIT');
  });
});
