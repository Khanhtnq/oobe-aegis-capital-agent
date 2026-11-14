/**
 * Specialist Sub-Agent Infrastructure & Delegated Vaults
 * Manages isolated vaults with dedicated spending limits, delegated roles,
 * and scoped permissions under parent Aegis governance.
 */

import crypto from 'node:crypto';

export class SubAgentVaultManager {
  constructor(parentAgentWallet) {
    this.parentAgentWallet = parentAgentWallet;
    this.subAgents = new Map();
  }

  /**
   * Deploy specialist sub-agent with dedicated vault and scoped policy
   */
  deploySubAgent({ role, name, initialBudgetUsdc, maxSpendPerTxUsdc, allowedTools }) {
    const subAgentId = `sub_${role.toLowerCase()}_${crypto.randomBytes(4).toString('hex')}`;
    const vaultAddress = `Vault${crypto.randomBytes(16).toString('hex')}`;

    const subAgentRecord = {
      subAgentId,
      name,
      role, // 'RESEARCH', 'PERP_EXECUTION', 'ARBITRAGE', 'PAYMENT_ROUTER'
      vaultAddress,
      allocatedBudgetUsdc: initialBudgetUsdc,
      currentBalanceUsdc: initialBudgetUsdc,
      spentUsdc: 0.0,
      maxSpendPerTxUsdc,
      allowedTools: new Set(allowedTools),
      status: 'ACTIVE',
      deployedAt: new Date().toISOString(),
      executionHistory: []
    };

    this.subAgents.set(subAgentId, subAgentRecord);
    return subAgentRecord;
  }

  /**
   * Execute delegated action within sub-agent spending policy
   */
  executeDelegatedAction(subAgentId, toolName, costUsdc, actionData = {}) {
    const agent = this.subAgents.get(subAgentId);
    if (!agent) {
      throw new Error(`Sub-agent ${subAgentId} not found`);
    }

    if (agent.status !== 'ACTIVE') {
      throw new Error(`Sub-agent ${subAgentId} is inactive`);
    }

    if (!agent.allowedTools.has(toolName)) {
      throw new Error(`Permission denied: Tool ${toolName} not authorized for sub-agent ${agent.name}`);
    }

    if (costUsdc > agent.maxSpendPerTxUsdc) {
      throw new Error(`Spend cap exceeded: $${costUsdc} > max allowed per tx $${agent.maxSpendPerTxUsdc}`);
    }

    if (costUsdc > agent.currentBalanceUsdc) {
      throw new Error(`Insufficient vault funds: $${agent.currentBalanceUsdc} < required $${costUsdc}`);
    }

    agent.currentBalanceUsdc -= costUsdc;
    agent.spentUsdc += costUsdc;

    const actionRecord = {
      actionId: `act_${crypto.randomBytes(6).toString('hex')}`,
      toolName,
      costUsdc,
      timestamp: new Date().toISOString(),
      actionData
    };

    agent.executionHistory.push(actionRecord);

    return {
      success: true,
      subAgentId,
      remainingBalanceUsdc: Number(agent.currentBalanceUsdc.toFixed(4)),
      totalSpentUsdc: Number(agent.spentUsdc.toFixed(4)),
      actionRecord
    };
  }

  getSubAgent(subAgentId) {
    const agent = this.subAgents.get(subAgentId);
    if (!agent) return null;
    return {
      ...agent,
      allowedTools: Array.from(agent.allowedTools)
    };
  }

  listSubAgents() {
    return Array.from(this.subAgents.values()).map(a => ({
      ...a,
      allowedTools: Array.from(a.allowedTools)
    }));
  }
}
