/**
 * Kelly Criterion Position Sizer
 * Calculates mathematically optimal allocation based on win probability, payoff ratio,
 * and fractional damping (half-Kelly) with hard policy caps.
 * Formula: f* = (p * b - q) / b
 * where p = win probability, q = (1 - p), b = net odds (reward / risk)
 */

export class KellySizer {
  constructor(options = {}) {
    this.fractionalDamping = options.fractionalDamping ?? 0.5; // Half-Kelly default for safety
    this.maxPositionUsd = options.maxPositionUsd ?? 500.0;
    this.minPositionUsd = options.minPositionUsd ?? 10.0;
    this.maxPortfolioRiskFraction = options.maxPortfolioRiskFraction ?? 0.25; // Never risk > 25% portfolio
  }

  /**
   * Calculate position size
   * @param {Object} params
   * @param {number} params.bankrollUsd - Total available capital
   * @param {number} params.winProbability - Expected win rate (0.0 to 1.0)
   * @param {number} params.expectedGainPct - Expected profit on win (e.g. 0.08 for 8%)
   * @param {number} params.expectedLossPct - Expected stop loss on lose (e.g. 0.04 for 4%)
   * @param {number} [params.confidence] - Strategy confidence factor (0.0 to 1.0)
   */
  calculateSize({
    bankrollUsd,
    winProbability,
    expectedGainPct,
    expectedLossPct,
    confidence = 1.0
  }) {
    if (bankrollUsd <= 0) {
      return {
        allocatedUsd: 0,
        fraction: 0,
        reason: 'Bankroll is zero or negative.'
      };
    }

    if (winProbability <= 0 || winProbability >= 1) {
      return {
        allocatedUsd: 0,
        fraction: 0,
        reason: 'Win probability must be strictly between 0 and 1.'
      };
    }

    if (expectedGainPct <= 0 || expectedLossPct <= 0) {
      return {
        allocatedUsd: 0,
        fraction: 0,
        reason: 'Gain and loss percentages must be strictly positive.'
      };
    }

    // Payoff ratio b = gain% / loss%
    const b = expectedGainPct / expectedLossPct;
    const p = winProbability;
    const q = 1 - p;

    // Full Kelly: f* = (p * b - q) / b
    const fullKellyFraction = (p * b - q) / b;

    if (fullKellyFraction <= 0) {
      return {
        allocatedUsd: 0,
        fraction: 0,
        edge: Number((p * b - q).toFixed(4)),
        reason: 'Negative statistical edge. Kelly suggests 0 allocation.'
      };
    }

    // Apply fractional damping (Half-Kelly) + confidence weighting
    let dampedFraction = fullKellyFraction * this.fractionalDamping * Math.min(1.0, Math.max(0.1, confidence));

    // Cap at max portfolio risk fraction
    dampedFraction = Math.min(dampedFraction, this.maxPortfolioRiskFraction);

    // Compute raw dollar size
    let targetSizeUsd = bankrollUsd * dampedFraction;

    // Apply hard boundaries
    if (targetSizeUsd > this.maxPositionUsd) {
      targetSizeUsd = this.maxPositionUsd;
    }

    if (targetSizeUsd < this.minPositionUsd) {
      return {
        allocatedUsd: 0,
        fraction: 0,
        reason: `Calculated size $${targetSizeUsd.toFixed(2)} is below minimum threshold $${this.minPositionUsd}.`
      };
    }

    return {
      allocatedUsd: Number(targetSizeUsd.toFixed(2)),
      fraction: Number(dampedFraction.toFixed(4)),
      fullKellyFraction: Number(fullKellyFraction.toFixed(4)),
      payoffRatio: Number(b.toFixed(2)),
      edge: Number((p * b - q).toFixed(4)),
      capped: targetSizeUsd >= this.maxPositionUsd,
      reason: 'Kelly optimal allocation approved within safety boundaries.'
    };
  }
}
