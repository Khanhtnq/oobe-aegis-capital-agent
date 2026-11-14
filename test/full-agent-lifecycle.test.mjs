import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AegisCapitalAgent } from '../src/agent/aegis-agent.mjs';
import { ActionType, ExecutionState } from '../src/core/types.mjs';

describe('Aegis Capital Agent - Full Lifecycle Integration Tests', () => {
  const agent = new AegisCapitalAgent();

  it('initializes agent with 3 specialist sub-agents, risk engine, and telemetry', () => {
    const status = agent.getStatus();
    assert.strictEqual(status.name, 'Aegis Capital Sentinel');
    assert.strictEqual(status.agentHandle, 'aegis-sentinel-v1');
    assert.strictEqual(status.subAgents.length, 3);
    assert.strictEqual(status.currentState, ExecutionState.IDLE);
    assert.strictEqual(status.arenaSummary.holderTier, 'Gold');
  });

  it('runs complete multi-step autonomous workflow across all protocols', async () => {
    // Step 1: Market Intelligence Briefing (Ace Data Cloud)
    const briefing = await agent.executeIntent({
      actionType: ActionType.ACEDATA_RESEARCH,
      asset: 'SOL',
      sizeUsd: 0.50,
      intentDescription: 'Synthesize SVM market dynamics'
    });
    assert.strictEqual(briefing.success, true);
    assert.ok(briefing.xpEvent.earnedXp > 0);

    // Step 2: Jupiter Spot Swap
    const swap = await agent.executeIntent({
      actionType: ActionType.SPOT_SWAP,
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 75.0,
      intentDescription: 'Swap 75 USDC for SOL with 3 bps slippage cap'
    });
    assert.strictEqual(swap.success, true);
    assert.ok(swap.receipt?.receiptId);
    assert.ok(swap.txHash);

    // Step 3: MultiHopper Routing to Sub-Agent Vault
    const routing = await agent.executeIntent({
      actionType: ActionType.MULTIHOPPER_ROUTE,
      asset: 'USDC',
      protocol: 'multihopper',
      sizeUsd: 25.0,
      intentDescription: 'Dispatch $25 USDC to hedge executor vault'
    });
    assert.strictEqual(routing.success, true);
    assert.ok(routing.data?.routeId);

    // Step 4: Adrena 2x Leveraged Long Perps Order
    const perp = await agent.executeIntent({
      actionType: ActionType.PERP_OPEN_LONG,
      asset: 'SOL',
      protocol: 'adrena',
      sizeUsd: 120.0,
      leverage: 2.0,
      intentDescription: 'Open SOL Perp Long 2.0x leverage capped at $120'
    });
    assert.strictEqual(perp.success, true);
    assert.strictEqual(perp.data?.leverage, 2.0);

    // Step 5: MagicBlock Private Transfer
    const priv = await agent.executeIntent({
      actionType: ActionType.MAGICBLOCK_PRIVATE_TRANSFER,
      asset: 'USDC',
      protocol: 'magicblock',
      sizeUsd: 50.0,
      intentDescription: 'Execute shielded private SPL transfer'
    });
    assert.strictEqual(priv.success, true);
    assert.strictEqual(priv.data?.status, 'CONFIDENTIAL_READY');

    // Step 6: Verify Final State and Journal
    const finalStatus = agent.getStatus();
    assert.strictEqual(finalStatus.currentState, ExecutionState.JOURNALED);
    assert.strictEqual(finalStatus.journalStats.totalEntries, 5);
    assert.ok(finalStatus.arenaSummary.totalXp >= 1000);

    // Step 7: Export Verified Proof Bundle
    const proof = agent.telemetry.generateProofBundle({ pnlUsd: 31.80 });
    assert.strictEqual(proof.status, 'VERIFIED_LEADERBOARD_READY');
    assert.ok(proof.digest.length === 64);
  });

  it('halts execution when trade requires owner signature and override is false', async () => {
    agent.bankrollUsd = 2000.0; // Expand bankroll so $280 is within Kelly limit but >= $250 owner approval threshold
    const res = await agent.executeIntent({
      actionType: ActionType.SPOT_SWAP,
      asset: 'SOL',
      protocol: 'jupiter',
      sizeUsd: 280.0, // > $250 threshold
      intentDescription: 'Large position requiring owner approval',
      ownerSignatureOverride: false
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.state, ExecutionState.WAITING_FOR_SIGNATURE);
    assert.strictEqual(res.requiresOwnerSignature, true);
    assert.match(res.message, /Awaiting non-custodial owner wallet signature/);
  });
});
