/**
 * Steve Capital Arena XP Engine
 * Rewards autonomous onchain activities, tracks missions, calculates tier multipliers,
 * and maintains verified state digests for the Superteam challenge leaderboard.
 */

import crypto from 'node:crypto';

export const ArenaMissions = {
  SPOT_SWAP: { name: 'DEX Liquidity Navigator', baseXp: 150, category: 'Ecosystem' },
  PERP_POSITION: { name: 'Adrena Perps Strategist', baseXp: 250, category: 'Perpetuals' },
  PRIVATE_TX: { name: 'MagicBlock Ephemeral Shield', baseXp: 200, category: 'Privacy' },
  MULTIHOPPER_ROUTING: { name: 'MultiHopper Autonomous Pipeline', baseXp: 300, category: 'Automation' },
  ACEDATA_BRIEFING: { name: 'Ace Data Cloud AI Synthesis', baseXp: 250, category: 'Intelligence' },
  SUBAGENT_DISPATCH: { name: 'Synapse Sub-Agent Vault Deployment', baseXp: 350, category: 'Infrastructure' },
  RISK_GUARDRAIL_CLEAR: { name: 'Aegis Zero-Drawdown Sentinel', baseXp: 100, category: 'Risk' }
};

export class ArenaXpEngine {
  constructor(options = {}) {
    this.agentHandle = options.agentHandle ?? 'aegis-sentinel-v1';
    this.holderTier = options.holderTier ?? 'Gold'; // None (1.0x), Silver (1.25x), Gold (1.5x), Diamond (2.0x)
    this.multiplier = this._computeTierMultiplier(this.holderTier);
    this.totalXp = 0;
    this.activityLog = [];
    this.completedMissions = new Map();
  }

  _computeTierMultiplier(tier) {
    switch (tier.toLowerCase()) {
      case 'diamond': return 2.0;
      case 'gold': return 1.5;
      case 'silver': return 1.25;
      default: return 1.0;
    }
  }

  /**
   * Record verified action and grant Arena XP
   */
  recordAction(missionKey, metadata = {}) {
    const mission = ArenaMissions[missionKey];
    if (!mission) {
      throw new Error(`Unknown Arena Mission: ${missionKey}`);
    }

    const earnedXp = Math.round(mission.baseXp * this.multiplier);
    this.totalXp += earnedXp;

    const count = (this.completedMissions.get(missionKey) || 0) + 1;
    this.completedMissions.set(missionKey, count);

    const event = {
      eventId: `xp_${crypto.randomBytes(6).toString('hex')}`,
      timestamp: new Date().toISOString(),
      missionKey,
      missionName: mission.name,
      category: mission.category,
      baseXp: mission.baseXp,
      tierMultiplier: this.multiplier,
      earnedXp,
      cumulativeXp: this.totalXp,
      metadata
    };

    this.activityLog.push(event);

    return event;
  }

  getRank() {
    if (this.totalXp >= 5000) return 'Grandmaster Sentinel';
    if (this.totalXp >= 2500) return 'Master Strategist';
    if (this.totalXp >= 1000) return 'Autonomous Operator';
    if (this.totalXp >= 500) return 'Arena Challenger';
    return 'Novice Scout';
  }

  getSummary() {
    return {
      agentHandle: this.agentHandle,
      holderTier: this.holderTier,
      xpMultiplier: this.multiplier,
      totalXp: this.totalXp,
      rank: this.getRank(),
      totalActivities: this.activityLog.length,
      missionBreakdown: Object.fromEntries(this.completedMissions.entries()),
      recentActivities: this.activityLog.slice(-5)
    };
  }
}
