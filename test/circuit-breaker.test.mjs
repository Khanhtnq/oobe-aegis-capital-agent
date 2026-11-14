import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CircuitBreaker } from '../src/core/circuit-breaker.mjs';
import { CircuitBreakerState } from '../src/core/types.mjs';

describe('Circuit Breaker Guardrail Tests', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      maxDrawdownPct: 2.5,
      maxDailyLossUsd: 25.0,
      maxConsecutiveLosses: 3,
      coolingPeriodMinutes: 60,
      initialEquityUsd: 1000.0
    });
  });

  it('starts in CLOSED state with optimal health', () => {
    const status = breaker.getStatus();
    assert.strictEqual(status.state, CircuitBreakerState.CLOSED);
    assert.strictEqual(status.dailyPnlUsd, 0.0);
    const check = breaker.canExecute();
    assert.strictEqual(check.allowed, true);
  });

  it('permits profitable trades and updates peak equity', () => {
    breaker.recordTrade(15.0);
    const status = breaker.getStatus();
    assert.strictEqual(status.currentEquityUsd, 1015.0);
    assert.strictEqual(status.peakEquityUsd, 1015.0);
    assert.strictEqual(status.dailyPnlUsd, 15.0);
    assert.strictEqual(breaker.canExecute().allowed, true);
  });

  it('trips immediately when daily loss limit ($25) is breached', () => {
    breaker.recordTrade(-26.0);
    const status = breaker.getStatus();
    assert.strictEqual(status.state, CircuitBreakerState.OPEN);
    assert.match(status.tripReason, /Daily loss limit reached/);
    const check = breaker.canExecute();
    assert.strictEqual(check.allowed, false);
    assert.match(check.reason, /CIRCUIT OPEN/);
  });

  it('trips when daily drawdown percentage reaches or exceeds 2.5%', () => {
    breaker.recordTrade(-25.5);
    const status = breaker.getStatus();
    assert.strictEqual(status.state, CircuitBreakerState.OPEN);
    assert.strictEqual(breaker.canExecute().allowed, false);
  });

  it('trips on max consecutive losses threshold', () => {
    breaker.recordTrade(-2.0);
    breaker.recordTrade(-3.0);
    assert.strictEqual(breaker.canExecute().allowed, true);
    breaker.recordTrade(-1.0); // 3rd consecutive loss
    assert.strictEqual(breaker.getStatus().state, CircuitBreakerState.OPEN);
    assert.match(breaker.getStatus().tripReason, /Consecutive losses breached/);
  });

  it('transitions to HALF_OPEN after cooling period elapses', () => {
    breaker.recordTrade(-30.0);
    assert.strictEqual(breaker.getStatus().state, CircuitBreakerState.OPEN);

    // Simulate elapsed cooling period
    breaker.lastTrippedTimestamp = Date.now() - (61 * 60 * 1000);
    const check = breaker.canExecute();
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.halfOpen, true);
    assert.strictEqual(breaker.state, CircuitBreakerState.HALF_OPEN);
  });
});
