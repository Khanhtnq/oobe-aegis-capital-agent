/**
 * Quote Verifier & Slippage Guardrail
 * Cross-references execution quotes (Jupiter / Raydium / Orca) with Pyth Oracle mark prices.
 * Strictly enforces maximum 3 bps slippage and rejects anomalous routing.
 */

export class QuoteVerifier {
  constructor(options = {}) {
    this.maxSlippageBps = options.maxSlippageBps ?? 3; // 3 bps = 0.03%
    this.maxPriceDeviationPct = options.maxPriceDeviationPct ?? 0.25; // 0.25%
  }

  /**
   * Verify an execution quote against reference oracle
   * @param {Object} params
   * @param {string} params.inputMint
   * @param {string} params.outputMint
   * @param {number} params.inAmount
   * @param {number} params.outAmount
   * @param {number} params.oracleMarkPrice - Pyth / reference oracle price (out / in)
   * @param {number} [params.estimatedSlippageBps] - Quoted slippage from DEX aggregator
   */
  verifyQuote({
    inputMint,
    outputMint,
    inAmount,
    outAmount,
    oracleMarkPrice,
    estimatedSlippageBps = 0
  }) {
    if (inAmount <= 0 || outAmount <= 0) {
      return {
        valid: false,
        reason: 'Amounts must be strictly positive.'
      };
    }

    if (oracleMarkPrice <= 0) {
      return {
        valid: false,
        reason: 'Oracle mark price unavailable or invalid.'
      };
    }

    // Execution price (outAmount / inAmount)
    const executionPrice = outAmount / inAmount;

    // Price deviation from oracle
    const priceDeviationPct = Math.abs((executionPrice - oracleMarkPrice) / oracleMarkPrice) * 100;

    // Computed slippage bps vs oracle
    const impliedSlippageBps = Math.max(
      0,
      ((oracleMarkPrice - executionPrice) / oracleMarkPrice) * 10000
    );

    // Enforce max slippage rule
    const effectiveSlippageBps = Math.max(estimatedSlippageBps, impliedSlippageBps);

    if (effectiveSlippageBps > this.maxSlippageBps) {
      return {
        valid: false,
        executionPrice: Number(executionPrice.toFixed(6)),
        oracleMarkPrice: Number(oracleMarkPrice.toFixed(6)),
        effectiveSlippageBps: Number(effectiveSlippageBps.toFixed(2)),
        maxAllowedBps: this.maxSlippageBps,
        reason: `Slippage breach: ${effectiveSlippageBps.toFixed(2)} bps exceeds policy limit ${this.maxSlippageBps} bps.`
      };
    }

    // Enforce max price deviation
    if (priceDeviationPct > this.maxPriceDeviationPct) {
      return {
        valid: false,
        executionPrice: Number(executionPrice.toFixed(6)),
        oracleMarkPrice: Number(oracleMarkPrice.toFixed(6)),
        priceDeviationPct: Number(priceDeviationPct.toFixed(3)),
        maxAllowedDeviationPct: this.maxPriceDeviationPct,
        reason: `Price deviation breach: ${priceDeviationPct.toFixed(3)}% exceeds allowed threshold ${this.maxPriceDeviationPct}%.`
      };
    }

    return {
      valid: true,
      executionPrice: Number(executionPrice.toFixed(6)),
      oracleMarkPrice: Number(oracleMarkPrice.toFixed(6)),
      effectiveSlippageBps: Number(effectiveSlippageBps.toFixed(2)),
      priceDeviationPct: Number(priceDeviationPct.toFixed(3)),
      reason: 'Quote validated against Pyth Oracle. Slippage & deviation within tight limits.'
    };
  }
}
