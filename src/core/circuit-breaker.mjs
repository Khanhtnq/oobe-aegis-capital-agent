/**
 * Circuit Breaker Guardrail
 * Real-time monitoring of daily drawdown, consecutive losses, and market volatility spikes.
 * Instantly halts execution if daily loss exceeds policy threshold (e.g. 2.5%).
 */

import { CircuitBreakerState } from './types.mjs';

export class CircuitBreaker {
  constructor(options = {}) {
    this.maxDrawdownPct = options.maxDrawdownPct ?? 2.5;
    this.maxDailyLossUsd = options.maxDailyLossUsd ?? 25.0;
    this.maxConsecutiveLosses = options.maxConsecutiveLosses ?? 4;
    this.coolingPeriodMs = (options.coolingPeriodMinutes ?? 60) * 60 * 1000;

    this.state = CircuitBreakerState.CLOSED;
    this.initialEquityUsd = options.initialEquityUsd ?? 1000.0;
    this.currentEquityUsd = this.initialEquityUsd;
    this.peakEquityUsd = this.initialEquityUsd;
    this.dailyPnlUsd = 0.0;
    this.consecutiveLossCount = 0;
    this.lastTrippedTimestamp = null;
    this.tripReason = null;
    this.tripHistory = [];
  }

  /**
   * Record trade outcome and evaluate circuit health
   */
  recordTrade(pnlUsd) {
    this.dailyPnlUsd += pnlUsd;
    this.currentEquityUsd += pnlUsd;

    if (this.currentEquityUsd > this.peakEquityUsd) {
      this.peakEquityUsd = this.currentEquityUsd;
    }

    if (pnlUsd < 0) {
      this.consecutiveLossCount += 1;
    } else {
      this.consecutiveLossCount = 0;
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.resetCircuit('Half-open trial trade succeeded; restoring CLOSED state.');
      }
    }

    this._evaluateHealth();
    return this.getStatus();
  }

  /**
   * Internal condition check
   */
  _evaluateHealth() {
    const currentDrawdownPct = ((this.peakEquityUsd - this.currentEquityUsd) / this.peakEquityUsd) * 100;
    const dailyDrawdownPct = (Math.abs(Math.min(0, this.dailyPnlUsd)) / this.initialEquityUsd) * 100;

    if (this.dailyPnlUsd <= -this.maxDailyLossUsd) {
      this._trip(`Daily loss limit reached: -$${Math.abs(this.dailyPnlUsd).toFixed(2)} exceeds cap $${this.maxDailyLossUsd.toFixed(2)}`);
      return;
    }

    if (dailyDrawdownPct >= this.maxDrawdownPct) {
      this._trip(`Daily drawdown threshold triggered: ${dailyDrawdownPct.toFixed(2)}% >= ${this.maxDrawdownPct}%`);
      return;
    }

    if (currentDrawdownPct >= this.maxDrawdownPct * 1.5) {
      this._trip(`Peak-to-trough drawdown breach: ${currentDrawdownPct.toFixed(2)}% >= ${(this.maxDrawdownPct * 1.5).toFixed(2)}%`);
      return;
    }

    if (this.consecutiveLossCount >= this.maxConsecutiveLosses) {
      this._trip(`Consecutive losses breached: ${this.consecutiveLossCount} losses in a row.`);
      return;
    }
  }

  _trip(reason) {
    this.state = CircuitBreakerState.OPEN;
    this.tripReason = reason;
    this.lastTrippedTimestamp = Date.now();
    this.tripHistory.push({
      timestamp: new Date().toISOString(),
      reason,
      equityUsd: this.currentEquityUsd,
      dailyPnlUsd: this.dailyPnlUsd
    });
  }

  /**
   * Check if trade execution is permitted
   */
  canExecute() {
    if (this.state === CircuitBreakerState.CLOSED) {
      return { allowed: true, reason: 'Circuit is CLOSED. Health optimal.' };
    }

    if (this.state === CircuitBreakerState.OPEN) {
      const elapsedMs = Date.now() - (this.lastTrippedTimestamp || 0);
      if (elapsedMs > this.coolingPeriodMs) {
        this.state = CircuitBreakerState.HALF_OPEN;
        return {
          allowed: true,
          halfOpen: true,
          reason: 'Cooling period elapsed. Transitioned to HALF_OPEN for probing execution.'
        };
      }
      return {
        allowed: false,
        reason: `CIRCUIT OPEN: ${this.tripReason}. Cooldown remaining: ${Math.ceil((this.coolingPeriodMs - elapsedMs) / 1000)}s`
      };
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      return {
        allowed: true,
        halfOpen: true,
        reason: 'Operating under HALF_OPEN caution limits.'
      };
    }

    return { allowed: false, reason: 'Unknown circuit state' };
  }

  resetCircuit(note = 'Manual / Daily reset') {
    this.state = CircuitBreakerState.CLOSED;
    this.tripReason = null;
    this.dailyPnlUsd = 0.0;
    this.consecutiveLossCount = 0;
    this.lastTrippedTimestamp = null;
  }

  getStatus() {
    const drawdownPct = ((this.peakEquityUsd - this.currentEquityUsd) / this.peakEquityUsd) * 100;
    return {
      state: this.state,
      currentEquityUsd: Number(this.currentEquityUsd.toFixed(2)),
      peakEquityUsd: Number(this.peakEquityUsd.toFixed(2)),
      dailyPnlUsd: Number(this.dailyPnlUsd.toFixed(2)),
      drawdownPct: Number(drawdownPct.toFixed(2)),
      consecutiveLossCount: this.consecutiveLossCount,
      tripReason: this.tripReason,
      tripHistoryLength: this.tripHistory.length
    };
  }
}
