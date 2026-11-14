import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SapMcpServer } from '../src/mcp/sap-mcp-server.mjs';

describe('OOBE Protocol SAP MCP Server Tests', () => {
  const server = new SapMcpServer();

  it('lists all 9 registered DeFi and infrastructure tools via tools/list', async () => {
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 'req_1',
      method: 'tools/list'
    });

    assert.strictEqual(res.jsonrpc, '2.0');
    assert.strictEqual(res.result.server, 'oobe-sap-mcp-server');
    assert.ok(Array.isArray(res.result.tools));
    assert.strictEqual(res.result.tools.length, 9);

    const toolNames = res.result.tools.map(t => t.name);
    assert.ok(toolNames.includes('jupiter_swap_quote'));
    assert.ok(toolNames.includes('jupiter_build_swap_tx'));
    assert.ok(toolNames.includes('sap_adrena_get_prices'));
    assert.ok(toolNames.includes('sap_adrena_build_open_long'));
    assert.ok(toolNames.includes('magicblock_private_transfer'));
    assert.ok(toolNames.includes('multihopper_route_transfer'));
    assert.ok(toolNames.includes('acedata_search_research'));
  });

  it('executes free/sponsored tool without requiring x402 payment header', async () => {
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 'req_free',
      method: 'tools/call',
      params: {
        name: 'jupiter_swap_quote',
        arguments: {
          inputMint: 'USDC',
          outputMint: 'SOL',
          amount: 50
        }
      }
    });

    assert.strictEqual(res.jsonrpc, '2.0');
    assert.ok(res.result?.data);
    assert.strictEqual(res.result.data.protocol, 'jupiter');
    assert.ok(res.result.data.outAmount > 0);
  });

  it('returns -32001 payment_required challenge on premium tool when header is missing', async () => {
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 'req_prem',
      method: 'tools/call',
      params: {
        name: 'multihopper_route_transfer',
        arguments: {
          sourceVault: 'VaultA',
          destinationAgent: 'AgentB',
          amountUsdc: 25.0
        }
      }
    });

    assert.strictEqual(res.jsonrpc, '2.0');
    assert.strictEqual(res.error.code, -32001);
    assert.strictEqual(res.error.message, 'payment_required');
    assert.ok(res.error.data.challengeId);
    assert.strictEqual(res.error.data.amountUsdc, 0.002);
  });

  it('returns -32601 for nonexistent tool call', async () => {
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 'req_unknown',
      method: 'tools/call',
      params: { name: 'nonexistent_tool' }
    });

    assert.strictEqual(res.error.code, -32601);
  });
});
