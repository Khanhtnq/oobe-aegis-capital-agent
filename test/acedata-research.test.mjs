import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AceDataConnector } from '../src/protocols/acedata.mjs';

describe('Ace Data Cloud Market Intelligence Tests', () => {
  const ace = new AceDataConnector({ initialCredits: 10.0 });

  it('executes paid research briefing and debits credits balance', async () => {
    const res = await ace.runResearchBriefing({
      query: 'Solana SVM perpetuals volume & liquidity depth'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.creditsDeducted, 0.50);
    assert.strictEqual(res.remainingCredits, 9.50);
    assert.ok(res.data.summary);
    assert.strictEqual(res.data.sentiment, 'BULLISH');
    assert.ok(res.data.signals.length >= 3);
  });

  it('records at least 5 qualifying paid requests to meet Superteam side-track requirements', async () => {
    // Already did 1, do 4 more
    for (let i = 0; i < 4; i++) {
      await ace.runResearchBriefing({ query: `Query iteration #${i + 2}` });
    }

    assert.ok(ace.getPaidRequestsCount() >= 5);
    const history = ace.getPaidRequests();
    assert.strictEqual(history.length, 5);
    for (const item of history) {
      assert.strictEqual(item.costCredits, 0.50);
      assert.ok(item.requestId.startsWith('ace_req_'));
    }
  });

  it('rejects research query when purchased credit balance is exhausted', async () => {
    const poorAce = new AceDataConnector({ initialCredits: 0.20 }); // < 0.50
    await assert.rejects(async () => {
      await poorAce.runResearchBriefing({ query: 'Deep analysis' });
    }, /Insufficient Ace credits/);
  });
});
