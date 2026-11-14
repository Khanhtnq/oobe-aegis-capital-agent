import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SubAgentVaultManager } from '../src/agent/subagent-vault.mjs';

describe('Specialist Sub-Agent Vault Infrastructure Tests', () => {
  const manager = new SubAgentVaultManager('ParentAegisAgentWallet123');

  it('deploys specialist sub-agent with dedicated vault and scoped policy', () => {
    const sub = manager.deploySubAgent({
      role: 'RESEARCH',
      name: 'AlphaScout',
      initialBudgetUsdc: 20.0,
      maxSpendPerTxUsdc: 1.0,
      allowedTools: ['acedata_search_research']
    });

    assert.ok(sub.subAgentId.startsWith('sub_research_'));
    assert.strictEqual(sub.allocatedBudgetUsdc, 20.0);
    assert.strictEqual(sub.currentBalanceUsdc, 20.0);
    assert.strictEqual(sub.status, 'ACTIVE');

    const retrieved = manager.getSubAgent(sub.subAgentId);
    assert.strictEqual(retrieved.name, 'AlphaScout');
    assert.deepStrictEqual(retrieved.allowedTools, ['acedata_search_research']);
  });

  it('permits authorized tool execution within spending limits', () => {
    const sub = manager.deploySubAgent({
      role: 'PERP_EXECUTION',
      name: 'HedgeBot',
      initialBudgetUsdc: 50.0,
      maxSpendPerTxUsdc: 5.0,
      allowedTools: ['sap_adrena_build_open_long']
    });

    const res = manager.executeDelegatedAction(sub.subAgentId, 'sap_adrena_build_open_long', 2.5, { market: 'SOL' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.remainingBalanceUsdc, 47.5);
    assert.strictEqual(res.totalSpentUsdc, 2.5);
  });

  it('strictly blocks unauthorized tool invocations', () => {
    const sub = manager.deploySubAgent({
      role: 'PAYMENT_ROUTER',
      name: 'MicroRouter',
      initialBudgetUsdc: 30.0,
      maxSpendPerTxUsdc: 5.0,
      allowedTools: ['multihopper_route_transfer']
    });

    assert.throws(() => {
      manager.executeDelegatedAction(sub.subAgentId, 'unauthorized_dangerous_tool', 1.0);
    }, /Permission denied: Tool unauthorized_dangerous_tool not authorized/);
  });

  it('enforces per-transaction spending limit cap', () => {
    const sub = manager.deploySubAgent({
      role: 'RESEARCH',
      name: 'BudgetScout',
      initialBudgetUsdc: 100.0,
      maxSpendPerTxUsdc: 2.0,
      allowedTools: ['acedata_search_research']
    });

    assert.throws(() => {
      manager.executeDelegatedAction(sub.subAgentId, 'acedata_search_research', 5.0); // 5.0 > 2.0
    }, /Spend cap exceeded/);
  });
});
