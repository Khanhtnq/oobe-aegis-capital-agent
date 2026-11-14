import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RiskEngine } from '../src/core/risk-engine.mjs';
import { DecisionOutcome } from '../src/core/types.mjs';

describe('Aegis Policy-Gated Risk Engine Tests', () => {
  let engine;

  beforeEach(() => {
    engine = new RiskEngine();
  });

  it('approves compliant proposal within policy caps', () => {
    const res = engine.assessProposal({
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 100.0,
      leverage: 1.0,
      bankrollUsd: 1000.0,
      winProbability: 0.65,
      expectedGainPct: 0.05,
      expectedLossPct: 0.025
    });

    assert.strictEqual(res.approved, true);
    assert.strictEqual(res.outcome, DecisionOutcome.PASS);
    assert.strictEqual(res.layer, 'ALL_PASSED');
    assert.ok(res.riskScore >= 0 && res.riskScore <= 100);
  });

  it('rejects asset not in token whitelist', () => {
    const res = engine.assessProposal({
      asset: 'SCAMCOIN',
      protocol: 'jupiter',
      sizeUsd: 50.0
    });

    assert.strictEqual(res.approved, false);
    assert.strictEqual(res.outcome, DecisionOutcome.REJECT);
    assert.strictEqual(res.layer, 'ASSET_WHITELIST');
    assert.match(res.reason, /not in the allowed token whitelist/);
  });

  it('rejects protocol not approved in OOBE SAP whitelist', () => {
    const res = engine.assessProposal({
      asset: 'SOL',
      protocol: 'unverified_dex',
      sizeUsd: 50.0
    });

    assert.strictEqual(res.approved, false);
    assert.strictEqual(res.layer, 'PROTOCOL_WHITELIST');
  });

  it('strictly rejects leverage above 3.0x max ceiling', () => {
    const res = engine.assessProposal({
      asset: 'SOL',
      protocol: 'adrena',
      sizeUsd: 100.0,
      leverage: 5.0
    });

    assert.strictEqual(res.approved, false);
    assert.strictEqual(res.layer, 'LEVERAGE_LIMIT');
    assert.match(res.reason, /exceeds maximum permissible cap/);
  });

  it('strictly rejects position size exceeding single position cap ($500)', () => {
    const res = engine.assessProposal({
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 650.0
    });

    assert.strictEqual(res.approved, false);
    assert.strictEqual(res.layer, 'SIZE_LIMIT');
    assert.match(res.reason, /exceeds maximum single position cap/);
  });

  it('halts execution when circuit breaker is tripped', () => {
    // Record $30 loss to trip circuit breaker ($25 cap)
    engine.recordSettlement(-30.0);

    const res = engine.assessProposal({
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 50.0
    });

    assert.strictEqual(res.approved, false);
    assert.strictEqual(res.outcome, DecisionOutcome.HALTED);
    assert.strictEqual(res.layer, 'CIRCUIT_BREAKER');
  });
});
