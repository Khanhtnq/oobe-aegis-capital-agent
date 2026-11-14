import { describe, it } from 'node:test';
import assert from 'node:assert';
import { X402Gateway } from '../src/mcp/x402-gateway.mjs';

describe('x402 Micropayment Gateway Tests', () => {
  const gateway = new X402Gateway({ feeUsdc: 0.002 });

  it('generates compliant -32001 challenge for unpaid tool invocation', () => {
    const res = gateway.createChallenge('call_001', 'sap_adrena_build_open_long');
    assert.strictEqual(res.jsonrpc, '2.0');
    assert.strictEqual(res.error.code, -32001);
    assert.strictEqual(res.error.message, 'payment_required');
    assert.strictEqual(res.error.data.x402Version, 1);
    assert.strictEqual(res.error.data.amountUsdc, 0.002);
    assert.ok(res.error.data.challengeId);
  });

  it('verifies valid Payment-Signature and generates onchain receipt', () => {
    const challengeRes = gateway.createChallenge('call_002', 'jupiter_build_swap_tx');
    const challengeId = challengeRes.error.data.challengeId;

    const paymentHeader = 'sig:5e91f1a0b3c...:0.002:PayerPubkey12345';
    const verifyRes = gateway.verifyPaymentAndSettle({
      requestId: 'call_002',
      toolName: 'jupiter_build_swap_tx',
      paymentSignatureHeader: paymentHeader,
      challengeId
    });

    assert.strictEqual(verifyRes.success, true);
    assert.ok(verifyRes.receipt);
    assert.match(verifyRes.receipt.receiptId, /^sap:/);
    assert.strictEqual(verifyRes.receipt.amountUsdc, 0.002);
    assert.strictEqual(verifyRes.receipt.onchainStatus, 'CONFIRMED');

    // Verify stored in registry
    const fetched = gateway.getReceipt(verifyRes.receipt.receiptId);
    assert.deepStrictEqual(fetched, verifyRes.receipt);
  });

  it('returns -32002 payment_verification_failed on malformed header without fresh challenge', () => {
    const challengeRes = gateway.createChallenge('call_003', 'jupiter_build_swap_tx');
    const challengeId = challengeRes.error.data.challengeId;

    const res = gateway.verifyPaymentAndSettle({
      requestId: 'call_003',
      toolName: 'jupiter_build_swap_tx',
      paymentSignatureHeader: 'invalid_malformed_header',
      challengeId
    });

    assert.strictEqual(res.error.code, -32002);
    assert.strictEqual(res.error.message, 'payment_verification_failed');
    assert.strictEqual(res.error.data.challengeId, undefined); // No fresh challenge returned
  });

  it('rejects underfunded payment with -32002', () => {
    const challengeRes = gateway.createChallenge('call_004', 'jupiter_build_swap_tx');
    const challengeId = challengeRes.error.data.challengeId;

    const res = gateway.verifyPaymentAndSettle({
      requestId: 'call_004',
      toolName: 'jupiter_build_swap_tx',
      paymentSignatureHeader: 'sig:goodsig:0.0005:PayerPubkey', // 0.0005 < 0.002
      challengeId
    });

    assert.strictEqual(res.error.code, -32002);
    assert.match(res.error.data.reason, /Underfunded payment/);
  });
});
