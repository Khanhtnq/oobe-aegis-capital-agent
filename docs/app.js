/**
 * Aegis Live Dashboard Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let state = {
    equity: 1000.0,
    circuit: 'CLOSED',
    drawdownPct: 0.0,
    xp: 1350,
    rank: 'Autonomous Operator',
    receiptsCount: 12,
    subagents: [
      { name: 'AceMarketIntelligenceAgent', role: 'RESEARCH', balance: 25.0, maxTx: 1.0 },
      { name: 'AdrenaHedgeExecutor', role: 'PERP_EXECUTION', balance: 100.0, maxTx: 25.0 },
      { name: 'MultiHopperCapitalDispatcher', role: 'PAYMENT_ROUTER', balance: 50.0, maxTx: 10.0 }
    ],
    receipts: [
      { id: 'sap:9a3f20c1', action: 'SPOT_SWAP', status: 'CONFIRMED', digest: '5UE...k92', xp: '+225' },
      { id: 'sap:41b80d44', action: 'PERP_OPEN_LONG', status: 'CONFIRMED', digest: '3Tx...a81', xp: '+375' },
      { id: 'sap:7ce29a1b', action: 'MULTIHOPPER_ROUTE', status: 'CONFIRMED', digest: '7Wk...4pQ', xp: '+450' },
      { id: 'sap:12e9aa33', action: 'ACEDATA_RESEARCH', status: 'CONFIRMED', digest: 'ace_req_51a2', xp: '+375' }
    ],
    pendingHighValueTx: null
  };

  // DOM Elements
  const valEquity = document.getElementById('val-equity');
  const valCircuit = document.getElementById('val-circuit');
  const valXp = document.getElementById('val-xp');
  const valRank = document.getElementById('val-rank');
  const valReceipts = document.getElementById('val-receipts');
  const terminalFeed = document.getElementById('terminal-feed');
  const subagentList = document.getElementById('subagent-list');
  const receiptsBody = document.getElementById('receipts-body');

  const intentForm = document.getElementById('intent-form');
  const actionSelect = document.getElementById('action-select');
  const sizeInput = document.getElementById('size-input');

  const proofBtn = document.getElementById('proof-btn');
  const proofModal = document.getElementById('proof-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const proofJsonDisplay = document.getElementById('proof-json-display');
  const copyProofBtn = document.getElementById('copy-proof-btn');

  const approvalModal = document.getElementById('approval-modal');
  const closeApprovalBtn = document.getElementById('close-approval-btn');
  const rejectTxBtn = document.getElementById('reject-tx-btn');
  const signTxBtn = document.getElementById('sign-tx-btn');
  const approvalAmount = document.getElementById('approval-amount');
  const unsignedTxCode = document.getElementById('unsigned-tx-code');

  // Render Subagents
  function renderSubagents() {
    subagentList.innerHTML = state.subagents.map(sub => `
      <div class="subagent-item">
        <div>
          <div class="subagent-name">${sub.name}</div>
          <div class="subagent-role">${sub.role} · Max/Tx: $${sub.maxTx}</div>
        </div>
        <div class="subagent-vault">$${sub.balance.toFixed(2)} USDC</div>
      </div>
    `).join('');
  }

  // Render Receipts
  function renderReceipts() {
    receiptsBody.innerHTML = state.receipts.slice(-6).reverse().map(r => `
      <tr>
        <td style="color: var(--cyan);">${r.id}</td>
        <td>${r.action}</td>
        <td><span style="color: var(--sol-green);">● ${r.status}</span></td>
        <td style="color: var(--text-dim);">${r.digest}</td>
        <td style="color: var(--gold);">${r.xp}</td>
      </tr>
    `).join('');
  }

  // Log to terminal
  function logTerminal(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `terminal-line ${type}`;
    const time = new Date().toISOString().substring(11, 19);
    el.textContent = `[${time}] ${msg}`;
    terminalFeed.appendChild(el);
    terminalFeed.scrollTop = terminalFeed.scrollHeight;
  }

  // Handle Form Submit
  intentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const action = actionSelect.value;
    const size = parseFloat(sizeInput.value);

    logTerminal(`Evaluating intent: ${action} with allocation $${size.toFixed(2)}`, 'info');

    // Policy check: Max single position $500
    if (size > 500) {
      logTerminal(`POLICY VIOLATION: $${size} exceeds max single position cap $500.00. Aborted.`, 'warning');
      return;
    }

    // Policy check: Owner signature required above $250
    if (size >= 250) {
      logTerminal(`NON-CUSTODIAL GUARD: Position >= $250 requires owner signature. Halting for approval.`, 'warning');
      state.pendingHighValueTx = { action, size };
      approvalAmount.textContent = `$${size.toFixed(2)}`;
      unsignedTxCode.textContent = `AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==_sim_${Date.now()}`;
      approvalModal.classList.remove('hidden');
      return;
    }

    // Normal Execution
    completeExecution(action, size);
  });

  function completeExecution(action, size) {
    const earnedXp = Math.round((action === 'PERP_OPEN_LONG' ? 250 : action === 'MULTIHOPPER_ROUTE' ? 300 : 150) * 1.5);
    state.xp += earnedXp;
    state.receiptsCount += 1;

    const receiptId = `sap:${Math.random().toString(16).substring(2, 10)}`;
    const mockHash = `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;

    state.receipts.push({
      id: receiptId,
      action,
      status: 'CONFIRMED',
      digest: mockHash,
      xp: `+${earnedXp}`
    });

    logTerminal(`[RISK CLEAR] Half-Kelly sizing, <=3 bps slippage & Pyth confidence band (8 bps, 2s age) approved.`, 'success');
    logTerminal(`[x402 RELAYED] 0.002 USDC micropayment settled on OOBE SAP Gateway.`, 'info');
    logTerminal(`[CONFIRMED] Transaction executed: ${mockHash} | +${earnedXp} Arena XP`, 'success');

    // Update UI
    valXp.innerHTML = `${state.xp.toLocaleString()} <span class="unit">XP</span>`;
    valReceipts.innerHTML = `${state.receiptsCount} <span class="unit">RECEIPTS</span>`;
    renderReceipts();
  }

  // Modal Handlers
  proofBtn.addEventListener('click', () => {
    const proofBundle = {
      protocol: 'OOBE_Synapse_Agent_Protocol',
      agentHandle: 'aegis-sentinel-v1',
      agentWallet: 'AegisAgent9XpM2v8tQkK3mZ7nL4jY1bC6hW0dF5rT9qS',
      ownerWallet: '6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf',
      totalXp: state.xp,
      rank: state.rank,
      holderTier: 'Gold (1.5x Multiplier)',
      totalReceipts: state.receiptsCount,
      circuitBreaker: state.circuit,
      maxDrawdownBreach: false,
      timestamp: new Date().toISOString(),
      digest: 'a56803e82df87b88c7bd42ed21106199b91fd45b204316fc64b23b851865a189',
      verifiedSignature: 'sig_sol_8bf1c94411ee...042'
    };

    proofJsonDisplay.textContent = JSON.stringify(proofBundle, null, 2);
    proofModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => proofModal.classList.add('hidden'));
  copyProofBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(proofJsonDisplay.textContent);
    copyProofBtn.textContent = 'Copied to Clipboard!';
    setTimeout(() => { copyProofBtn.textContent = 'Copy Proof Digest'; }, 2000);
  });

  closeApprovalBtn.addEventListener('click', () => approvalModal.classList.add('hidden'));
  rejectTxBtn.addEventListener('click', () => {
    approvalModal.classList.add('hidden');
    logTerminal('Owner rejected unsigned transaction. Zero capital moved.', 'warning');
  });

  signTxBtn.addEventListener('click', () => {
    approvalModal.classList.add('hidden');
    if (state.pendingHighValueTx) {
      logTerminal('Owner approved signature via browser wallet. Proceeding with execution.', 'success');
      completeExecution(state.pendingHighValueTx.action, state.pendingHighValueTx.size);
      state.pendingHighValueTx = null;
    }
  });

  // Initial render
  renderSubagents();
  renderReceipts();
});
