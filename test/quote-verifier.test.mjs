import { describe, it } from 'node:test';
import assert from 'node:assert';
import { QuoteVerifier } from '../src/core/quote-verifier.mjs';

describe('Quote Verifier & Slippage Guardrail Tests', () => {
  const verifier = new QuoteVerifier({
    maxSlippageBps: 3, // 3 bps
    maxPriceDeviationPct: 0.25, // 0.25%
    maxOracleConfidenceBps: 50, // 50 bps
    maxOracleAgeSeconds: 30
  });

  it('validates quotes with tight slippage (<= 3 bps)', () => {
    // 100 USDC -> ~0.51164 SOL at rate 195.45.
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 100.0,
      outAmount: 100.0 / 195.45,
      oracleMarkPrice: 1 / 195.45,
      estimatedSlippageBps: 1.5
    });

    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.effectiveSlippageBps, 1.5);
    assert.match(res.reason, /validated against Pyth Oracle/);
  });

  it('rejects quotes exceeding maximum slippage (e.g. 5 bps > 3 bps)', () => {
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 100.0,
      outAmount: (100.0 / 195.45) * 0.999, // 10 bps slippage
      oracleMarkPrice: 1 / 195.45,
      estimatedSlippageBps: 5.0
    });

    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.effectiveSlippageBps, 10.0);
    assert.match(res.reason, /Slippage breach/);
  });

  it('rejects quotes with anomalous price deviation (> 0.25%)', () => {
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 100.0,
      outAmount: (100.0 / 195.45) * 1.01, // 1% away from oracle
      oracleMarkPrice: 1 / 195.45,
      estimatedSlippageBps: 1.0
    });

    assert.strictEqual(res.valid, false);
    assert.match(res.reason, /Price deviation breach/);
  });

  it('rejects zero or negative input amounts', () => {
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 0,
      outAmount: 10,
      oracleMarkPrice: 100
    });

    assert.strictEqual(res.valid, false);
    assert.match(res.reason, /Amounts must be strictly positive/);
  });

  it('validates quotes within Pyth confidence interval and freshness thresholds', () => {
    const oracleMarkPrice = 1 / 195.45;
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 100.0,
      outAmount: 100.0 / 195.45,
      oracleMarkPrice,
      estimatedSlippageBps: 1.5,
      oracleConfidence: oracleMarkPrice * 0.001, // 10 bps <= 50 bps
      oracleAgeSeconds: 4
    });

    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.oracleConfidenceBps, 10);
    assert.strictEqual(res.oracleAgeSeconds, 4);
  });

  it('rejects quotes when Pyth confidence interval is too wide (> 50 bps)', () => {
    const oracleMarkPrice = 1 / 195.45;
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 100.0,
      outAmount: 100.0 / 195.45,
      oracleMarkPrice,
      estimatedSlippageBps: 1.0,
      oracleConfidence: oracleMarkPrice * 0.008 // 80 bps > 50 bps
    });

    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.oracleConfidenceBps, 80);
    assert.match(res.reason, /Pyth confidence interval too wide/);
  });

  it('rejects quotes when Pyth oracle feed is stale (> 30s)', () => {
    const oracleMarkPrice = 1 / 195.45;
    const res = verifier.verifyQuote({
      inputMint: 'USDC',
      outputMint: 'SOL',
      inAmount: 100.0,
      outAmount: 100.0 / 195.45,
      oracleMarkPrice,
      estimatedSlippageBps: 1.0,
      oracleConfidence: oracleMarkPrice * 0.001,
      oracleAgeSeconds: 45
    });

    assert.strictEqual(res.valid, false);
    assert.match(res.reason, /Pyth oracle stale/);
  });
});
