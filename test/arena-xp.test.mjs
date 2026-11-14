import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ArenaXpEngine, ArenaMissions } from '../src/arena/xp-engine.mjs';

describe('Steve Capital Arena XP Engine Tests', () => {
  it('applies holder tier multiplier (Gold 1.5x) to mission rewards', () => {
    const engine = new ArenaXpEngine({ holderTier: 'Gold' });
    assert.strictEqual(engine.multiplier, 1.5);

    const event = engine.recordAction('SPOT_SWAP', { sizeUsd: 100 });
    // Base XP: 150 * 1.5 = 225
    assert.strictEqual(event.baseXp, 150);
    assert.strictEqual(event.earnedXp, 225);
    assert.strictEqual(event.cumulativeXp, 225);
    assert.strictEqual(engine.totalXp, 225);
  });

  it('tracks distinct mission categories and counts', () => {
    const engine = new ArenaXpEngine({ holderTier: 'Diamond' }); // 2.0x
    assert.strictEqual(engine.multiplier, 2.0);

    engine.recordAction('PERP_POSITION'); // 250 * 2 = 500
    engine.recordAction('PERP_POSITION'); // 250 * 2 = 500
    engine.recordAction('PRIVATE_TX');    // 200 * 2 = 400

    const summary = engine.getSummary();
    assert.strictEqual(summary.totalXp, 1400);
    assert.strictEqual(summary.missionBreakdown.PERP_POSITION, 2);
    assert.strictEqual(summary.missionBreakdown.PRIVATE_TX, 1);
    assert.strictEqual(summary.totalActivities, 3);
  });

  it('graduates rank according to XP thresholds', () => {
    const engine = new ArenaXpEngine({ holderTier: 'None' }); // 1.0x
    assert.strictEqual(engine.getRank(), 'Novice Scout');

    engine.totalXp = 600;
    assert.strictEqual(engine.getRank(), 'Arena Challenger');

    engine.totalXp = 1200;
    assert.strictEqual(engine.getRank(), 'Autonomous Operator');

    engine.totalXp = 2700;
    assert.strictEqual(engine.getRank(), 'Master Strategist');

    engine.totalXp = 5200;
    assert.strictEqual(engine.getRank(), 'Grandmaster Sentinel');
  });

  it('rejects unknown mission keys', () => {
    const engine = new ArenaXpEngine();
    assert.throws(() => {
      engine.recordAction('UNKNOWN_INVALID_MISSION');
    }, /Unknown Arena Mission/);
  });
});
