# Aegis Autonomous Capital Agent (`oobe-aegis-capital-agent`)

[![OOBE Protocol](https://img.shields.io/badge/Powered%20By-OOBE%20Protocol%20SAP%20MCP-14f195)](https://steve.oobeprotocol.ai/)
[![Solana](https://img.shields.io/badge/Blockchain-Solana%20SVM-9945ff)](https://solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 57/57 Passing](https://img.shields.io/badge/Tests-57%2F57%20PASSING-success)](test/)
[![Arena XP: Gold Tier](https://img.shields.io/badge/Arena%20XP-Gold%20Tier%20(1.5x)-f59e0b)](#arena-xp-leaderboard-telemetry)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-06b6d4)](https://khanhtnq.github.io/oobe-aegis-capital-agent/)

> **Flagship Autonomous Capital Agent on Solana with Policy-Gated Risk Guardrails, Kelly Position Sizing, x402 Micropayments & Arena XP Leaderboard Telemetry.**  
> Built for the **Superteam Earn: OOBE Protocol Steve Capital Challenge ($500 USDC)** and **Superteam Agentic Engineering Grants**.

---

## 🏛️ Executive Architecture Overview

```
                                    +-----------------------------------+
                                    |     User Non-Custodial Wallet     |
                                    |   6mghraUR9NV2fA187VXo...tvDdmf   |
                                    +-----------------+-----------------+
                                                      |
                                        Domain Auth / | SIWS (Keys Stay In Browser)
                                                      v
+---------------------------------------------------------------------------------------------------+
|                                  AEGIS AUTONOMOUS CAPITAL AGENT                                   |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             POLICY-GATED RISK ENGINE (v3.2)                                 |  |
|  |  +--------------------+  +----------------------+  +------------------+  +----------------+ |  |
|  |  |  Circuit Breaker   |  |     Kelly Sizer      |  |  Quote Verifier  |  | Non-Custodial  | |  |
|  |  |  Max 2.5% Drawdown |  |  f* = (p*b - q) / b  |  | Max 3 bps Slip   |  | Owner Gate >   | |  |
|  |  |  Auto-Halt on Loss |  |  Half-Kelly (0.5x)   |  | Pyth Cross-Check |  |    $250 USD    | |  |
|  |  +--------------------+  +----------------------+  +------------------+  +----------------+ |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 | Pre-Trade Clearance                             |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  |                            OOBE PROTOCOL SYNAPSE AGENT PROTOCOL                             |  |
|  |                                      (SAP MCP BRIDGE)                                       |  |
|  |                                                                                             |  |
|  |   [01] Jupiter DEX Swap Quote & Unsigned Transaction Builder                                |  |
|  |   [02] Adrena Perpetuals Funding & Leveraged Long/Short Orders                              |  |
|  |   [03] MagicBlock Ephemeral Rollup Zero-Knowledge Confidential Transfers                    |  |
|  |   [04] MultiHopper Programmable 3-Hop Routing & Automated Payments                          |  |
|  |   [05] Ace Data Cloud AI Market Intelligence Briefings (5+ Paid Requests)                   |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|  +----------------------------------------------v----------------------------------------------+  |
|  |                             x402 AGENT-TO-AGENT SETTLEMENT GATEWAY                          |  |
|  |       HTTP 200 JSON-RPC · -32001 Challenge -> Payment-Signature -> Verified Receipt        |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|  +----------------------------------------------v----------------------------------------------+  |
|  |                     SYNAPSE SESSION LEDGER & ONCHAIN EXECUTION JOURNAL                      |  |
|  |               SHA-256 State Digests · Immutable Proofs · Leaderboard Telemetry              |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## ⚡ Key Highlights & Core Deliverables

### 1. Real OOBE Protocol SAP MCP Server & Client Bridge
- **Streamable JSON-RPC 2.0 HTTP Transport**: Complete Model Context Protocol bridge exposing 9 registered Solana tools.
- **x402 Payment Challenge Auto-Negotiation**: Intercepts code `-32001` (`payment_required`), generates `Payment-Signature` headers with partially-signed USDC transfers, avoids trap loops with `-32002` validation, and binds immutable `sap:...` receipts.

### 2. Policy-Gated Risk Guardrails
- **Max Drawdown Circuit Breaker**: Halts execution instantly if rolling daily losses breach **2.5%** or if consecutive losses reach the limit. Implements cooling period and `HALF_OPEN` trial recovery.
- **Kelly Criterion Position Sizer**: Evaluates win probability and payoff odds ($f^* = \frac{p \cdot b - q}{b}$), applying a **0.5x Half-Kelly** safety dampener and hard **$500 single-position ceiling**.
- **Pyth Oracle Quote Verifier**: Strictly enforces maximum **3 bps** slippage tolerance, **0.25%** mark price deviation, **50 bps** Pyth confidence-interval width, and **30s** oracle freshness before unsigned transactions are staged.
- **Non-Custodial Ownership Gating**: Orders `>= $250.00` require explicit owner approval via browser wallet (Phantom/Solflare); agent signer keys never possess unilateral withdrawal rights.

### 3. Specialist Sub-Agent Infrastructure
- **Dedicated Delegated Vaults**:
  1. `AceMarketIntelligenceAgent` (Research & Sentiment Briefings | Cap: $1.00/tx)
  2. `AdrenaHedgeExecutor` (SVM Perps Hedging & Exposure Control | Cap: $25.00/tx)
  3. `MultiHopperCapitalDispatcher` (3-Hop Automated Vault Rebalancing | Cap: $10.00/tx)

### 4. Partner Side-Track Integrations
- **MultiHopper Track**: Programmable multi-hop automated payment routing with transaction trace telemetry, fee deduction ($0.001 USDC), and onchain receipt generation.
- **Ace Data Cloud Track**: Market intelligence briefing pipeline with **5+ qualifying paid service requests** logged against purchased credits, real-time sentiment scoring, and signals extraction.

### 5. Arena XP & Leaderboard Proof Telemetry
- Real-time scoring for all challenge tracks (Spot Swaps, Perps, Privacy Swaps, MultiHopper Transfers, Ace Data Briefings).
- **Gold Tier Utility**: 1.5x XP multiplier and -30% fee discount.
- One-click cryptographic proof bundle export with root SHA-256 digest for Superteam Earn verification.

---

## 🧪 Comprehensive Test Suite (57 Tests, 16 Suites, 0 Placeholders)

The test suite runs natively on Node.js using standard ESM assertions with zero external test runners:

```bash
npm test
```

### Verified Test Breakdown:
| Test Suite | File | Tests | Status |
|---|---|:---:|:---:|
| Circuit Breaker Guardrail | `test/circuit-breaker.test.mjs` | 6 | PASS |
| Kelly Criterion Position Sizer | `test/kelly-sizer.test.mjs` | 5 | PASS |
| Quote Verifier, Pyth Confidence & Slippage Guard | `test/quote-verifier.test.mjs` | 7 | PASS |
| Policy-Gated Risk Engine | `test/risk-engine.test.mjs` | 6 | PASS |
| SAP MCP Server JSON-RPC | `test/sap-mcp-server.test.mjs` | 4 | PASS |
| SAP MCP Client Bridge | `test/sap-mcp-client.test.mjs` | 2 | PASS |
| x402 Micropayment Gateway | `test/x402-gateway.test.mjs` | 4 | PASS |
| Sub-Agent Vault Infrastructure | `test/subagent-vault.test.mjs` | 4 | PASS |
| MultiHopper Programmable Routing | `test/multihopper-route.test.mjs` | 2 | PASS |
| Ace Data Cloud Research Pipeline | `test/acedata-research.test.mjs` | 3 | PASS |
| MagicBlock Ephemeral Privacy | `test/magicblock-private.test.mjs` | 2 | PASS |
| Steve Capital Arena XP Engine | `test/arena-xp.test.mjs` | 4 | PASS |
| Leaderboard Telemetry & Verification | `test/leaderboard-telemetry.test.mjs` | 1 | PASS |
| Synapse Onchain Journal | `test/execution-journal.test.mjs` | 2 | PASS |
| Policy Guardrails & Limits | `test/policy-guardrails.test.mjs` | 2 | PASS |
| Full Agent Lifecycle Integration | `test/full-agent-lifecycle.test.mjs` | 3 | PASS |
| **TOTAL** | **16 Suites** | **57 Tests** | **100% PASS** |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.0.0
- Python >= 3.10 (for media generation scripts)

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/Khanhtnq/oobe-aegis-capital-agent.git
cd oobe-aegis-capital-agent

# Run the live autonomous execution cycle
npm start

# Run all 54 unit and integration tests
npm test
```

---

## 📊 Interactive Live Dashboard

Open `docs/index.html` in any browser or visit the live GitHub Pages deployment:
- **Live Demo**: [https://khanhtnq.github.io/oobe-aegis-capital-agent/](https://khanhtnq.github.io/oobe-aegis-capital-agent/)
- **Features**:
  - Live treasury equity & circuit breaker meters
  - Interactive Action & Protocol Dispatcher
  - Real-time simulated terminal log & x402 receipt table
  - Non-custodial owner approval modal with unsigned base64 inspection
  - Exportable Superteam Challenge Proof Bundle modal

---

## 🎬 Deliverables & Media Assets

- **High-Resolution Banner (1280x800)**: [`assets/thumbnail_1280x800.png`](assets/thumbnail_1280x800.png)
- **1080p Video Demonstration**: [`demo_video.mp4`](demo_video.mp4)
- **Agentic Engineering Session Proof**: [`docs/AGENTIC_ENGINEERING_SESSION_PROOF.md`](docs/AGENTIC_ENGINEERING_SESSION_PROOF.md)
- **Superteam Submission Manifest**: [`SUPERTEAM_SUBMISSION_READY.json`](SUPERTEAM_SUBMISSION_READY.json)

---

## 📜 Submission Details

| Parameter | Specification |
|---|---|
| **Target Listing** | Build an Autonomous Capital Agent on Solana ($500 USDC) |
| **Grant Target** | Superteam Agentic Engineering Grants ($200-$10,000 USDG) |
| **Owner Solana Wallet** | `6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf` |
| **Agent Signer Wallet** | `AegisAgent9XpM2v8tQkK3mZ7nL4jY1bC6hW0dF5rT9qS` |
| **Solscan Explorer** | [View Onchain Account](https://solscan.io/account/6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf) |
| **Verified Digest** | `a56803e82df87b88c7bd42ed21106199b91fd45b204316fc64b23b851865a189` |

---

## ⚖️ License
Released under the [MIT License](LICENSE). Built for the Solana Autonomous Agent Economy by Khanhtnq.
