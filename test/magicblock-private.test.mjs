import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MagicBlockConnector } from '../src/protocols/magicblock.mjs';

describe('MagicBlock Ephemeral Rollup & Privacy Tests', () => {
  const mb = new MagicBlockConnector();

  it('builds zero-knowledge private SPL transfer transaction', async () => {
    const res = await mb.buildPrivateTransferTx({
      sender: 'AlicePubkey111',
      recipient: 'BobShielded222',
      amountUsdc: 50.0
    });

    assert.strictEqual(res.status, 'CONFIDENTIAL_READY');
    assert.ok(res.commitment);
    assert.ok(res.zkProof.startsWith('zk_snark_'));
    assert.strictEqual(res.simulation.privacyLevel, 'SHIELDED');
    assert.strictEqual(res.simulation.settlementRail, 'Ephemeral_Rollup_SVM');
    assert.strictEqual(res.requiresOwnerSignature, false); // <= $100
  });

  it('flags owner signature required for large confidential transfers (> $100)', async () => {
    const res = await mb.buildPrivateTransferTx({
      sender: 'AlicePubkey111',
      recipient: 'BobShielded222',
      amountUsdc: 250.0
    });

    assert.strictEqual(res.requiresOwnerSignature, true);
  });
});
