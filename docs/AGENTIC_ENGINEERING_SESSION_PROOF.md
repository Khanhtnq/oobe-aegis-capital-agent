# Agentic Engineering Session & Architecture Proof — Aegis Autonomous Capital Agent

- **Repository:** https://github.com/Khanhtnq/oobe-aegis-capital-agent
- **Live Interactive Dashboard:** https://khanhtnq.github.io/oobe-aegis-capital-agent/
- **Owner Non-Custodial Wallet:** `6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf`
- **Test Verification:** `57 / 57` passing across `16` ESM test suites (`node --test test/*.test.mjs`)

---

## 1. Engineering Objective & Problem Solved

Autonomous AI agents interacting with Solana DeFi protocols fail in production when unconstrained LLM tool calls can breach slippage tolerances, act on stale or wide-confidence oracle prints, over-allocate during negative expectancy regimes, or hold unilateral withdrawal authority over treasury capital.

**Aegis Autonomous Capital Agent** solves this via a deterministic, zero-dependency Node.js ESM execution runtime implementing:

1. **5-Layer Policy-Gated Risk Engine (`src/core/risk-engine.mjs`)**
   - **Daily Drawdown Circuit Breaker (`src/core/circuit-breaker.mjs`):** Tracks peak equity and daily PnL, trips automatically at `2.5%` drawdown or `$25.00` daily loss (or consecutive loss limit), enforces a `60`-minute cooling period, and recovers via `HALF_OPEN` trial gating.
   - **Half-Kelly Position Sizer (`src/core/kelly-sizer.mjs`):** Evaluates $f^* = \frac{p \cdot b - q}{b}$ with a `0.5x` Half-Kelly dampener, rejects negative edge (`allocatedUsd = 0`), and enforces hard `[$10, $500]` position bounds.
   - **Pyth Oracle & Slippage Guardrail (`src/core/quote-verifier.mjs`):** Cross-references Jupiter/DEX execution quotes against Pyth reference mark prices, rejecting quotes that exceed `3 bps` slippage, `0.25%` mark price deviation, `50 bps` Pyth confidence-interval width, or `30s` oracle staleness.
   - **Non-Custodial Approval Threshold:** Transactions `>= $250.00` halt prior to signing and surface an unsigned base64 payload requiring explicit browser-wallet signature (`Phantom` / `Solflare`).
   - **Asset & Protocol Whitelists (`src/config/policy.config.mjs`):** Restricts execution to approved tokens (`SOL`, `USDC`, `BTC`, `ETH`, `BONK`, `JUP`) and protocols (`jupiter`, `adrena`, `raydium`, `orca`, `meteora`, `kamino`, `magicblock`, `multihopper`, `acedata`).

2. **OOBE Synapse Agent Protocol (SAP) MCP Server & x402 Gateway (`src/mcp/`)**
   - **`SapMcpServer` (`src/mcp/sap-mcp-server.mjs`):** Streamable JSON-RPC 2.0 MCP tool router exposing `9` Solana DeFi & intelligence tools (`jupiter_swap_quote`, `jupiter_build_swap_tx`, `sap_adrena_get_prices`, `sap_adrena_build_open_long`, `sap_adrena_build_open_short`, `magicblock_private_transfer`, `multihopper_route_transfer`, `acedata_search_research`, `sap_get_receipt`).
   - **`X402Gateway` (`src/mcp/x402-gateway.mjs`) & `SapMcpClient` (`src/mcp/sap-mcp-client.mjs`):** Implements `-32001` (`payment_required`) challenge issuance, automatic `Payment-Signature` header negotiation, `-32002` malformed/underfunded rejection without infinite retry loops, and immutable `sap:...` settlement receipts.

3. **Specialist Sub-Agent Vaults & Audit Journal (`src/agent/`)**
   - **`SubAgentVaultManager` (`src/agent/subagent-vault.mjs`):** Scoped per-role budgets and tool whitelists for `AceMarketIntelligenceAgent` (`$1/tx`), `AdrenaHedgeExecutor` (`$25/tx`), and `MultiHopperCapitalDispatcher` (`$10/tx`).
   - **`ExecutionJournal` (`src/agent/execution-journal.mjs`):** Records every risk decision, simulation outcome, and receipt with deterministic SHA-256 digests.

---

## 2. Deterministic Verification Evidence

Running `node --test test/*.test.mjs` verifies all `16` suites (`57` tests, `0` failures, `0` skipped):

| Suite | File | Cases | Verified Scope |
|---|---|---:|---|
| Circuit Breaker | `test/circuit-breaker.test.mjs` | 6 | Peak equity, 2.5% drawdown trip, $25 loss trip, consecutive losses, `HALF_OPEN` recovery |
| Kelly Sizer | `test/kelly-sizer.test.mjs` | 5 | Positive edge allocation, negative edge rejection, $500 max cap, $10 min floor, input bounds |
| Quote Verifier | `test/quote-verifier.test.mjs` | 7 | <= 3 bps slippage, > 3 bps rejection, > 0.25% deviation rejection, Pyth confidence <= 50 bps, wide confidence rejection, > 30s staleness rejection, positive amount guard |
| Risk Engine | `test/risk-engine.test.mjs` | 6 | Policy approval, asset/protocol whitelists, 3.0x leverage cap, $500 size cap, circuit breaker halt |
| SAP MCP Server | `test/sap-mcp-server.test.mjs` | 4 | 9-tool discovery (`tools/list`), free tool execution, `-32001` challenge, `-32601` unknown tool |
| SAP MCP Client | `test/sap-mcp-client.test.mjs` | 2 | Seamless discovery & automatic `-32001` x402 payment negotiation |
| x402 Gateway | `test/x402-gateway.test.mjs` | 4 | `-32001` challenge generation, valid header receipt, `-32002` malformed & underfunded rejection |
| Sub-Agent Vaults | `test/subagent-vault.test.mjs` | 4 | Scoped vault deployment, authorized execution, unauthorized tool block, per-tx cap |
| MultiHopper | `test/multihopper-route.test.mjs` | 2 | 3-hop programmable vault routing & amount validation |
| Ace Data Cloud | `test/acedata-research.test.mjs` | 3 | Paid briefings, 5+ qualifying requests, credit exhaustion guard |
| MagicBlock | `test/magicblock-private.test.mjs` | 2 | Ephemeral rollup private SPL transfer & >$100 owner approval flag |
| Arena XP & Telemetry | `test/arena-xp.test.mjs`, `test/leaderboard-telemetry.test.mjs` | 5 | Gold 1.5x XP multiplier, rank progression, SHA-256 proof bundle |
| Journal & Lifecycle | `test/execution-journal.test.mjs`, `test/policy-guardrails.test.mjs`, `test/full-agent-lifecycle.test.mjs` | 7 | SHA-256 execution log, >$250 non-custodial halt, full multi-protocol lifecycle |

---

## 3. Live End-to-End Runtime Proof (`node src/index.mjs`)

1. Initializes `AegisCapitalAgent` with owner `6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf` and 3 specialist sub-agent vaults.
2. Executes an Ace Data Cloud market intelligence query (`+375` Arena XP).
3. Executes a Jupiter `50 USDC -> SOL` spot swap validated by `QuoteVerifier` against Pyth mark price (`<= 3 bps` slippage, `8 bps` confidence band, `2s` age) and settled via x402 (`0.002 USDC` receipt).
4. Stages an Adrena `2.0x` leveraged SOL perp long (`$150`, entry `$195.45`, liquidation `$112.38`).
5. Exports a SHA-256 `VERIFIED_LEADERBOARD_READY` telemetry bundle.
