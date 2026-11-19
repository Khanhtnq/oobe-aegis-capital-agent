/**
 * Aegis Master Policy-Gated Risk Engine
 * Integrates Circuit Breaker, Kelly Sizer, and Quote Verifier.
 * Orchestrates multi-layer pre-trade validation:
 * Layer 1: Global circuit breaker state check
 * Layer 2: Asset & protocol whitelist check
 * Layer 3: Position size and leverage limits check
 * Layer 4: Kelly allocation sanity check
 * Layer 5: Non-custodial signature requirement check
 */

import { DecisionOutcome } from './types.mjs';
import { CircuitBreaker } from './circuit-breaker.mjs';
import { KellySizer } from './kelly-sizer.mjs';
import { QuoteVerifier } from './quote-verifier.mjs';
import { DEFAULT_RISK_POLICY } from '../config/policy.config.mjs';

export class RiskEngine {
  constructor(customPolicy = {}) {
    this.policy = { ...DEFAULT_RISK_POLICY, ...customPolicy };
    this.circuitBreaker = new CircuitBreaker({
      maxDrawdownPct: this.policy.capitalLimits.maxDrawdownPct,
      maxDailyLossUsd: this.policy.capitalLimits.maxDailyLossUsd,
      coolingPeriodMinutes: this.policy.capitalLimits.coolingPeriodMinutes
    });
    this.kellySizer = new KellySizer({
      maxPositionUsd: this.policy.capitalLimits.maxSinglePositionUsd,
      minPositionUsd: this.policy.capitalLimits.minPositionUsd
    });
    this.quoteVerifier = new QuoteVerifier({
      maxSlippageBps: this.policy.executionRules.maxSlippageBps,
      maxPriceDeviationPct: this.policy.executionRules.maxPriceDeviationPct,
      maxOracleConfidenceBps: this.policy.executionRules.maxOracleConfidenceBps,
      maxOracleAgeSeconds: this.policy.executionRules.maxOracleAgeSeconds
    });
  }

  /**
   * Pre-execution risk assessment
   * @param {Object} proposal
   */
  assessProposal(proposal) {
    const {
      asset,
      protocol,
      sizeUsd,
      leverage = 1.0,
      bankrollUsd = 1000.0,
      winProbability,
      expectedGainPct,
      expectedLossPct,
      confidence = 1.0
    } = proposal;

    // 1. Circuit Breaker Check
    const cbCheck = this.circuitBreaker.canExecute();
    if (!cbCheck.allowed) {
      return {
        outcome: DecisionOutcome.HALTED,
        approved: false,
        layer: 'CIRCUIT_BREAKER',
        reason: cbCheck.reason,
        metrics: this.circuitBreaker.getStatus()
      };
    }

    // 2. Whitelist Checks
    if (!this.policy.whitelists.allowedTokens.includes(asset.toUpperCase())) {
      return {
        outcome: DecisionOutcome.REJECT,
        approved: false,
        layer: 'ASSET_WHITELIST',
        reason: `Asset ${asset} is not in the allowed token whitelist.`
      };
    }

    if (!this.policy.whitelists.allowedProtocols.includes(protocol.toLowerCase())) {
      return {
        outcome: DecisionOutcome.REJECT,
        approved: false,
        layer: 'PROTOCOL_WHITELIST',
        reason: `Protocol ${protocol} is not approved in OOBE SAP policy.`
      };
    }

    // 3. Leverage Limit Check
    if (leverage > this.policy.leverageLimits.maxLeverage) {
      return {
        outcome: DecisionOutcome.REJECT,
        approved: false,
        layer: 'LEVERAGE_LIMIT',
        reason: `Leverage ${leverage}x exceeds maximum permissible cap ${this.policy.leverageLimits.maxLeverage}x.`
      };
    }

    // 4. Position Size Limit Check (Skipped for intelligence / service queries)
    const isServiceQuery = protocol.toLowerCase() === 'acedata' || proposal.isServiceQuery;
    if (!isServiceQuery) {
      if (sizeUsd > this.policy.capitalLimits.maxSinglePositionUsd) {
        return {
          outcome: DecisionOutcome.REJECT,
          approved: false,
          layer: 'SIZE_LIMIT',
          reason: `Position size $${sizeUsd} exceeds maximum single position cap $${this.policy.capitalLimits.maxSinglePositionUsd}.`
        };
      }

      if (sizeUsd < this.policy.capitalLimits.minPositionUsd) {
        return {
          outcome: DecisionOutcome.REJECT,
          approved: false,
          layer: 'SIZE_LIMIT',
          reason: `Position size $${sizeUsd} is below minimum economic threshold $${this.policy.capitalLimits.minPositionUsd}.`
        };
      }
    }

    // 5. Kelly Sizing Sanity (if statistical parameters provided)
    let kellyReport = null;
    if (winProbability && expectedGainPct && expectedLossPct) {
      kellyReport = this.kellySizer.calculateSize({
        bankrollUsd,
        winProbability,
        expectedGainPct,
        expectedLossPct,
        confidence
      });

      if (kellyReport.allocatedUsd > 0 && sizeUsd > kellyReport.allocatedUsd * 1.25) {
        return {
          outcome: DecisionOutcome.REJECT,
          approved: false,
          layer: 'KELLY_SANITY',
          reason: `Proposed size $${sizeUsd} exceeds Kelly-optimal allocation $${kellyReport.allocatedUsd} by >25%.`,
          kelly: kellyReport
        };
      }
    }

    // 6. Non-custodial owner signature requirement
    const requiresOwnerSignature = sizeUsd >= this.policy.executionRules.requireOwnerSignatureAboveUsd;

    return {
      outcome: DecisionOutcome.PASS,
      approved: true,
      layer: 'ALL_PASSED',
      reason: 'All risk guardrails passed cleanly.',
      riskScore: Math.min(100, Math.round((sizeUsd / this.policy.capitalLimits.maxSinglePositionUsd) * 30 + (leverage / this.policy.leverageLimits.maxLeverage) * 40)),
      requiresOwnerSignature,
      kelly: kellyReport,
      policyVersion: this.policy.policyVersion
    };
  }

  /**
   * Post-trade settlement update
   */
  recordSettlement(pnlUsd) {
    return this.circuitBreaker.recordTrade(pnlUsd);
  }

  getStatus() {
    return {
      policyVersion: this.policy.policyVersion,
      circuitBreaker: this.circuitBreaker.getStatus(),
      policy: this.policy
    };
  }
}
