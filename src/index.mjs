/**
 * Aegis Capital Agent - Entry Point
 * Demonstrates live orchestration of OOBE Protocol SAP MCP,
 * policy evaluation, x402 settlement receipts, and Arena XP tracking.
 */

import { AegisCapitalAgent } from './agent/aegis-agent.mjs';
import { ActionType } from './core/types.mjs';

export async function main() {
  console.log('================================================================');
  console.log('  AEGIS AUTONOMOUS CAPITAL AGENT - POWERED BY OOBE PROTOCOL');
  console.log('================================================================');

  const agent = new AegisCapitalAgent();
  console.log('\n[1] Initializing Aegis Agent...');
  console.log(`    Agent Wallet: ${agent.agentWallet}`);
  console.log(`    Owner Wallet: ${agent.ownerWallet}`);
  console.log(`    Holder Tier:  ${agent.arenaXp.holderTier} (${agent.arenaXp.multiplier}x Arena XP Multiplier)`);

  console.log('\n[2] Deployed Specialist Sub-Agents:');
  for (const sub of agent.subAgentManager.listSubAgents()) {
    console.log(`    - ${sub.name} [${sub.role}]: Vault $${sub.currentBalanceUsdc} USDC | Max/Tx: $${sub.maxSpendPerTxUsdc}`);
  }

  console.log('\n[3] Executing Action: Ace Data Cloud Market Intelligence Briefing...');
  const resBriefing = await agent.executeIntent({
    actionType: ActionType.ACEDATA_RESEARCH,
    asset: 'SOL',
    sizeUsd: 0.50,
    intentDescription: 'Synthesize SVM market dynamics for SOL perps'
  });
  console.log(`    Briefing Status: ${resBriefing.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`    Summary: ${resBriefing.data?.data?.summary}`);
  console.log(`    Arena XP Earned: +${resBriefing.xpEvent?.earnedXp} XP (Total: ${resBriefing.xpEvent?.cumulativeXp} XP)`);

  console.log('\n[4] Executing Action: Jupiter Spot Swap with 3 bps Slippage Guardrail...');
  const resSwap = await agent.executeIntent({
    actionType: ActionType.SPOT_SWAP,
    asset: 'SOL',
    protocol: 'jupiter',
    sizeUsd: 50.0,
    intentDescription: 'Swap 50 USDC for SOL under 3 bps slippage'
  });
  console.log(`    Swap Status: ${resSwap.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`    Tx Hash: ${resSwap.txHash}`);
  console.log(`    x402 Settlement Receipt: ${resSwap.receipt?.receiptId} (${resSwap.receipt?.amountUsdc} USDC to ${resSwap.receipt?.payTo})`);
  console.log(`    Arena XP Earned: +${resSwap.xpEvent?.earnedXp} XP (Total: ${resSwap.xpEvent?.cumulativeXp} XP)`);

  console.log('\n[5] Executing Action: Adrena Leveraged Perps Long Order...');
  const resPerp = await agent.executeIntent({
    actionType: ActionType.PERP_OPEN_LONG,
    asset: 'SOL',
    protocol: 'adrena',
    sizeUsd: 150.0,
    leverage: 2.0,
    intentDescription: 'Open SOL Perp Long 2.0x leverage capped at $150'
  });
  console.log(`    Perp Status: ${resPerp.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`    Tx Hash: ${resPerp.txHash}`);
  console.log(`    Entry Price: $${resPerp.data?.entryPrice} | Est Liq: $${resPerp.data?.liquidationPrice}`);
  console.log(`    Arena XP Earned: +${resPerp.xpEvent?.earnedXp} XP (Total: ${resPerp.xpEvent?.cumulativeXp} XP)`);

  console.log('\n[6] Generating Leaderboard Telemetry Proof Bundle...');
  const proofBundle = agent.telemetry.generateProofBundle({ pnlUsd: 18.45 });
  console.log(`    Proof Status: ${proofBundle.status}`);
  console.log(`    Digest: ${proofBundle.digest}`);
  console.log(`    Rank: ${proofBundle.telemetry.rank} with ${proofBundle.telemetry.totalXp} XP`);

  console.log('\n================================================================');
  console.log('  AEGIS CAPITAL AGENT EXECUTION CYCLE COMPLETED CLEANLY');
  console.log('================================================================');
}

if (process.argv[1] && process.argv[1].endsWith('index.mjs')) {
  main().catch(console.error);
}

export { AegisCapitalAgent };
