/**
 * Aegis Capital Agent - Master Policy & Guardrail Configuration
 * Defines strict non-custodial boundaries, limits, and parameters.
 */

export const DEFAULT_RISK_POLICY = {
  policyVersion: 'risk-v3.2',
  ownerWallet: '6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf',
  agentWallet: 'AegisAgent9XpM2v8tQkK3mZ7nL4jY1bC6hW0dF5rT9qS',
  
  // Hard capital allocation limits
  capitalLimits: {
    maxTotalAllocationUsd: 1000.0,
    maxSinglePositionUsd: 500.0,
    minPositionUsd: 10.0,
    maxDailyLossUsd: 25.0, // 2.5% max daily drawdown
    maxDrawdownPct: 2.5,   // Circuit breaker triggers at 2.5%
    coolingPeriodMinutes: 60,
  },

  // Leverage & Margin policies
  leverageLimits: {
    maxLeverage: 3.0,
    defaultLeverage: 1.5,
    liquidationBufferPct: 15.0, // Minimum 15% distance to liquidation
  },

  // Execution verification & slippage
  executionRules: {
    maxSlippageBps: 3,         // Max 3 basis points (0.03%) slippage allowed
    maxPriceDeviationPct: 0.25,// Max 0.25% deviation from Pyth oracle mark
    simulateBeforeExecute: true,
    requireOwnerSignatureAboveUsd: 250.0,
  },

  // Allowed tokens and protocol integrations
  whitelists: {
    allowedTokens: ['SOL', 'USDC', 'BTC', 'ETH', 'BONK', 'JUP'],
    allowedProtocols: [
      'jupiter',
      'adrena',
      'raydium',
      'orca',
      'meteora',
      'kamino',
      'magicblock',
      'multihopper',
      'acedata'
    ],
    allowedOrderTypes: ['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT']
  },

  // x402 Micropayment configuration
  x402Config: {
    enabled: true,
    maxFeePerCallUsdc: 0.005,
    defaultPayTo: 'OOBEGatewayVault1111111111111111111111111111',
    challengeCodePaymentRequired: -32001,
    challengeCodeVerificationFailed: -32002,
    challengeVersion: 1
  },

  // Arena XP telemetry
  arenaConfig: {
    trackedSeason: 'Season 2 - Capital Crucible',
    holderTier: 'Gold',
    feeDiscountPct: 30,
    xpMultiplier: 1.5,
    minActionIntervalMs: 500
  }
};
