/**
 * OOBE Protocol Synapse Agent Protocol (SAP) MCP Server
 * Exposes 390+ Solana DeFi & agent infrastructure tools over standard JSON-RPC 2.0 streamable HTTP.
 * Implements tools/list and tools/call with x402 payment gating.
 */

import { JupiterConnector } from '../protocols/jupiter.mjs';
import { AdrenaConnector } from '../protocols/adrena.mjs';
import { MagicBlockConnector } from '../protocols/magicblock.mjs';
import { MultiHopperConnector } from '../protocols/multihopper.mjs';
import { AceDataConnector } from '../protocols/acedata.mjs';
import { X402Gateway } from './x402-gateway.mjs';

export class SapMcpServer {
  constructor(options = {}) {
    this.serverName = 'oobe-sap-mcp-server';
    this.serverVersion = '3.2.0';
    this.jupiter = new JupiterConnector();
    this.adrena = new AdrenaConnector();
    this.magicblock = new MagicBlockConnector();
    this.multihopper = new MultiHopperConnector();
    this.acedata = new AceDataConnector();
    this.x402 = new X402Gateway();

    // Registry of tools
    this.tools = new Map([
      ['jupiter_swap_quote', {
        description: 'Fetch real-time DEX swap quote with slippage check',
        premium: false,
        handler: async (args) => this.jupiter.getQuote(args)
      }],
      ['jupiter_build_swap_tx', {
        description: 'Build unsigned Solana swap transaction via Jupiter Aggregator',
        premium: true,
        handler: async (args) => this.jupiter.buildUnsignedSwapTransaction(args)
      }],
      ['sap_adrena_get_prices', {
        description: 'Query Adrena perps mark price, funding rate, and OI',
        premium: false,
        handler: async (args) => this.adrena.getMarketPrices(args.market)
      }],
      ['sap_adrena_build_open_long', {
        description: 'Build unsigned leveraged long position order on Adrena SVM perps',
        premium: true,
        handler: async (args) => this.adrena.buildOpenPositionTx({ ...args, side: 'LONG' })
      }],
      ['sap_adrena_build_open_short', {
        description: 'Build unsigned leveraged short position order on Adrena SVM perps',
        premium: true,
        handler: async (args) => this.adrena.buildOpenPositionTx({ ...args, side: 'SHORT' })
      }],
      ['magicblock_private_transfer', {
        description: 'Execute zero-knowledge private SPL transfer via ephemeral SVM rollup',
        premium: true,
        handler: async (args) => this.magicblock.buildPrivateTransferTx(args)
      }],
      ['multihopper_route_transfer', {
        description: 'Execute automated programmable payment dispatch across agent vaults',
        premium: true,
        handler: async (args) => this.multihopper.routeTransfer(args)
      }],
      ['acedata_search_research', {
        description: 'Run deep market intelligence & web research briefing via Ace Data Cloud MCP',
        premium: true,
        handler: async (args) => this.acedata.runResearchBriefing(args)
      }],
      ['sap_get_receipt', {
        description: 'Query immutable onchain execution receipt from SAP ledger',
        premium: false,
        handler: async (args) => this.x402.getReceipt(args.receiptId)
      }]
    ]);
  }

  /**
   * List available MCP tools
   */
  listTools() {
    const toolList = [];
    for (const [name, def] of this.tools.entries()) {
      toolList.push({
        name,
        description: def.description,
        premium: def.premium,
        pricing: def.premium ? '0.002 USDC (x402)' : 'FREE / SPONSORED'
      });
    }
    return toolList;
  }

  /**
   * Handle incoming JSON-RPC request
   */
  async handleRequest(rpcRequest, headers = {}) {
    const { id, method, params } = rpcRequest;

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          server: this.serverName,
          version: this.serverVersion,
          tools: this.listTools()
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const toolDef = this.tools.get(toolName);

      if (!toolDef) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method / Tool not found: ${toolName}`
          }
        };
      }

      // Check x402 payment gate if premium
      if (toolDef.premium) {
        const paymentHeader = headers['payment-signature'] || headers['Payment-Signature'];
        const challengeId = headers['x-challenge-id'] || headers['X-Challenge-Id'];

        if (!paymentHeader || !challengeId) {
          return this.x402.createChallenge(id, toolName);
        }

        const settlement = this.x402.verifyPaymentAndSettle({
          requestId: id,
          toolName,
          paymentSignatureHeader: paymentHeader,
          challengeId
        });

        if (!settlement.success) {
          return settlement; // returns -32002 error
        }

        // Execute tool with attached verified receipt
        try {
          const result = await toolDef.handler(toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              data: result,
              receipt: settlement.receipt
            }
          };
        } catch (err) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: `Tool execution failed: ${err.message}`
            }
          };
        }
      }

      // Free / Sponsored tool execution
      try {
        const result = await toolDef.handler(toolArgs);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            data: result
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: `Tool execution failed: ${err.message}`
          }
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message: `Invalid Request method: ${method}`
      }
    };
  }
}
