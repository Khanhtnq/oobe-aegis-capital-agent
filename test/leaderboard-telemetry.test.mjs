import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { ArenaXpEngine } from '../src/arena/xp-engine.mjs';
import { LeaderboardTelemetry } from '../src/arena/leaderboard-telemetry.mjs';

describe('Leaderboard Telemetry & Verification Proof Tests', () => {
  it('generates cryptographic proof bundle for challenge submission', () => {
    const xpEngine = new ArenaXpEngine({ agentHandle: 'aegis-test', holderTier: 'Gold' });
    xpEngine.recordAction('SPOT_SWAP');
    xpEngine.recordAction('MULTIHOPPER_ROUTING');

    const telemetry = new LeaderboardTelemetry(xpEngine, {
      agentWallet: 'AegisWallet111',
      ownerWallet: 'OwnerWallet222'
    });

    const proof = telemetry.generateProofBundle({ pnlUsd: 42.50 });

    assert.strictEqual(proof.status, 'VERIFIED_LEADERBOARD_READY');
    assert.strictEqual(proof.telemetry.protocol, 'OOBE_Synapse_Agent_Protocol');
    assert.strictEqual(proof.telemetry.agentHandle, 'aegis-test');
    assert.strictEqual(proof.telemetry.agentWallet, 'AegisWallet111');
    assert.strictEqual(proof.telemetry.ownerWallet, 'OwnerWallet222');
    assert.strictEqual(proof.telemetry.executionPnlUsd, 42.50);
    assert.ok(proof.telemetry.totalXp > 0);

    // Verify SHA-256 digest integrity
    const recomputedDigest = crypto.createHash('sha256').update(JSON.stringify(proof.telemetry)).digest('hex');
    assert.strictEqual(proof.digest, recomputedDigest);
  });
});
