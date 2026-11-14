/**
 * OOBE Protocol Synapse Agent Protocol (SAP) MCP Client Bridge
 * Bridges autonomous trading agents to SAP MCP Server.
 * Automatically intercepts -32001 payment_required challenges,
 * generates non-custodial Payment-Signature headers in USDC,
 * and completes execution.
 */

import crypto from 'node:crypto';

export class SapMcpClient {
  constructor(server, options = {}) {
    this.server = server;
    this.agentWallet = options.agentWallet ?? 'AegisAgent9XpM2v8tQkK3mZ7nL4jY1bC6hW0dF5rT9qS';
    this.autoPayX402 = options.autoPayX402 ?? true;
    this.usdcBalance = options.usdcBalance ?? 100.0;
  }

  /**
   * List available tools on server
   */
  async listTools() {
    const res = await this.server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });
    return res.result.tools;
  }

  /**
   * Call a tool on the MCP server with automatic x402 handling
   */
  async callTool(name, args = {}) {
    const requestId = `call_${Date.now()}`;
    const initialReq = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: { name, arguments: args }
    };

    // First attempt without payment header
    const firstResponse = await this.server.handleRequest(initialReq);

    // If success or normal error, return immediately
    if (!firstResponse.error || firstResponse.error.code !== -32001) {
      return firstResponse;
    }

    // Intercept -32001 payment_required
    if (!this.autoPayX402) {
      return firstResponse;
    }

    const challenge = firstResponse.error.data;
    const requiredAmount = challenge.amountUsdc;

    if (this.usdcBalance < requiredAmount) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32002,
          message: 'payment_verification_failed',
          data: { reason: 'Client agent wallet underfunded for x402 payment' }
        }
      };
    }

    // Sign micro-payment
    this.usdcBalance -= requiredAmount;
    const mockSignature = crypto.randomBytes(32).toString('hex');
    const paymentHeader = `sig:${mockSignature}:${requiredAmount}:${this.agentWallet}`;

    // Retry request with Payment-Signature and Challenge-Id
    const retryHeaders = {
      'Payment-Signature': paymentHeader,
      'X-Challenge-Id': challenge.challengeId
    };

    const secondResponse = await this.server.handleRequest(initialReq, retryHeaders);
    return secondResponse;
  }
}
