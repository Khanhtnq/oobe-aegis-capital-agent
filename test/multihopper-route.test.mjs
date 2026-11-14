import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MultiHopperConnector } from '../src/protocols/multihopper.mjs';

describe('MultiHopper Programmable Routing Tests', () => {
  const router = new MultiHopperConnector();

  it('routes and settles programmable payment across agent vaults', async () => {
    const res = await router.routeTransfer({
      sourceVault: 'Vault_Treasury',
      destinationAgent: 'SubAgent_Research',
      amountUsdc: 25.0,
      memo: 'Funding research allocation'
    });

    assert.strictEqual(res.status, 'ROUTED_AND_SETTLED');
    assert.ok(res.routeId.startsWith('hop_'));
    assert.strictEqual(res.feeUsdc, 0.001);
    assert.strictEqual(res.netAmountUsdc, 24.999);
    assert.strictEqual(res.executionTrace.hops.length, 3);
    assert.ok(res.receiptHash);

    // Verify stored trace
    const trace = router.getRouteTrace(res.routeId);
    assert.strictEqual(trace.routeId, res.routeId);
    assert.strictEqual(trace.memo, 'Funding research allocation');
  });

  it('rejects invalid or non-positive transfer amounts', async () => {
    await assert.rejects(async () => {
      await router.routeTransfer({
        sourceVault: 'Vault_A',
        destinationAgent: 'Vault_B',
        amountUsdc: -10
      });
    }, /Transfer amount must be strictly positive/);
  });
});
