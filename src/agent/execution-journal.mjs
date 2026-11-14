/**
 * Synapse Onchain Execution Journal & Decision Trace
 * Immutable ledger of every agent proposed trade, risk gate evaluation, simulation outcome,
 * owner signature authorization, and onchain settlement receipt.
 */

import crypto from 'node:crypto';

export class ExecutionJournal {
  constructor() {
    this.entries = [];
  }

  /**
   * Log an execution cycle
   */
  logEntry({
    intent,
    riskOutcome,
    simulationOutcome,
    actionType,
    ownerApproved = false,
    txHash = null,
    receipt = null,
    pnlUsd = 0.0
  }) {
    const entryId = `sap_dec_${crypto.randomBytes(8).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const record = {
      decisionId: entryId,
      timestamp,
      intent,
      actionType,
      riskOutcome: {
        layer: riskOutcome.layer,
        approved: riskOutcome.approved,
        riskScore: riskOutcome.riskScore ?? 0,
        reason: riskOutcome.reason
      },
      simulation: {
        success: simulationOutcome?.success ?? false,
        details: simulationOutcome
      },
      authorization: {
        required: riskOutcome.requiresOwnerSignature ?? false,
        granted: ownerApproved
      },
      settlement: {
        txHash,
        receiptId: receipt?.receiptId ?? null,
        pnlUsd,
        onchainStatus: txHash ? 'CONFIRMED' : 'ABORTED'
      }
    };

    const digest = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
    record.journalDigest = digest;

    this.entries.push(record);
    return record;
  }

  getEntry(decisionId) {
    return this.entries.find(e => e.decisionId === decisionId) || null;
  }

  getRecentEntries(limit = 10) {
    return this.entries.slice(-limit);
  }

  getTotalEntries() {
    return this.entries.length;
  }
}
