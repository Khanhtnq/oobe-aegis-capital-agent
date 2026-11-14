import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ExecutionJournal } from '../src/agent/execution-journal.mjs';

describe('Synapse Onchain Execution Journal Tests', () => {
  const journal = new ExecutionJournal();

  it('logs complete execution cycle with cryptographic SHA-256 journal digest', () => {
    const entry = journal.logEntry({
      intent: 'Swap 50 USDC for SOL',
      actionType: 'SPOT_SWAP',
      riskOutcome: { layer: 'ALL_PASSED', approved: true, riskScore: 25, reason: 'Clean' },
      simulationOutcome: { success: true },
      ownerApproved: true,
      txHash: '5Kz...mockTxHash',
      receipt: { receiptId: 'sap:receipt123' },
      pnlUsd: 1.25
    });

    assert.ok(entry.decisionId.startsWith('sap_dec_'));
    assert.strictEqual(entry.intent, 'Swap 50 USDC for SOL');
    assert.strictEqual(entry.settlement.txHash, '5Kz...mockTxHash');
    assert.strictEqual(entry.settlement.onchainStatus, 'CONFIRMED');
    assert.ok(entry.journalDigest);

    // Retrieve by decisionId
    const found = journal.getEntry(entry.decisionId);
    assert.deepStrictEqual(found, entry);
  });

  it('retrieves recent journal entries up to limit', () => {
    for (let i = 0; i < 5; i++) {
      journal.logEntry({
        intent: `Trade #${i}`,
        riskOutcome: { layer: 'ALL_PASSED', approved: true },
        simulationOutcome: { success: true }
      });
    }

    const recent = journal.getRecentEntries(3);
    assert.strictEqual(recent.length, 3);
    assert.strictEqual(journal.getTotalEntries(), 6);
  });
});
