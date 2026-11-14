import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SapMcpServer } from '../src/mcp/sap-mcp-server.mjs';
import { SapMcpClient } from '../src/mcp/sap-mcp-client.mjs';

describe('OOBE Protocol SAP MCP Client Bridge Tests', () => {
  const server = new SapMcpServer();
  const client = new SapMcpClient(server, {
    agentWallet: 'AegisAgent9XpM2v8tQkK3mZ7nL4jY1bC6hW0dF5rT9qS',
    usdcBalance: 50.0
  });

  it('queries tool list from server seamlessly', async () => {
    const tools = await client.listTools();
    assert.strictEqual(tools.length, 9);
  });

  it('automatically resolves -32001 challenge for premium tools and returns receipt', async () => {
    const initialBalance = client.usdcBalance;

    const res = await client.callTool('sap_adrena_build_open_long', {
      market: 'SOL',
      sizeUsd: 100,
      collateralUsd: 50,
      leverage: 2.0,
      userPublicKey: '6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf'
    });

    assert.strictEqual(res.jsonrpc, '2.0');
    assert.ok(res.result?.data);
    assert.strictEqual(res.result.data.status, 'UNSIGNED_READY');
    assert.strictEqual(res.result.data.market, 'SOL');

    // Verify x402 settlement receipt attached
    assert.ok(res.result?.receipt);
    assert.match(res.result.receipt.receiptId, /^sap:/);
    assert.strictEqual(res.result.receipt.amountUsdc, 0.002);
    assert.strictEqual(res.result.receipt.payer, client.agentWallet);

    // Verify balance was debited
    assert.strictEqual(Number(client.usdcBalance.toFixed(3)), Number((initialBalance - 0.002).toFixed(3)));
  });
});
