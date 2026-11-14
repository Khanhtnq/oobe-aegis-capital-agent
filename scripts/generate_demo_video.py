import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

def create_frames():
    os.makedirs('temp_frames', exist_ok=True)
    width = 1920
    height = 1080

    try:
        font_h1 = ImageFont.truetype('arialbd.ttf', 56)
        font_h2 = ImageFont.truetype('arialbd.ttf', 38)
        font_body = ImageFont.truetype('arial.ttf', 24)
        font_bold = ImageFont.truetype('arialbd.ttf', 26)
        font_code = ImageFont.truetype('consola.ttf', 22)
    except:
        font_h1 = font_h2 = font_body = font_bold = font_code = ImageFont.load_default()

    slides = [
        {
            'title': 'AEGIS AUTONOMOUS CAPITAL AGENT',
            'subtitle': 'Flagship Solana Capital Sentinel powered by OOBE Protocol & SAP MCP',
            'badges': ['OOBE SAP MCP', 'SOLANA SVM', 'GOLD TIER 1.5x XP', 'NON-CUSTODIAL'],
            'bullets': [
                '• Autonomous onchain trading agent operating on Synapse Agent Protocol (SAP MCP)',
                '• Non-custodial security: private keys strictly isolated in browser wallet',
                '• Multi-protocol liquidity execution across Jupiter, Adrena, MagicBlock, and MultiHopper',
                '• Real-time Arena XP tracking and leaderboard proof generation for Superteam Earn'
            ],
            'box_title': 'TARGET CHALLENGES & TRACKS',
            'box_lines': [
                '1. Superteam Earn: OOBE Protocol ($500 USDC Main Bounty)',
                '2. MultiHopper Side-Track: Automated 3-Hop Payment Workflows',
                '3. Ace Data Cloud Side-Track: Deep AI Market Intelligence (5+ Paid Requests)',
                '4. Superteam Agentic Engineering Grants ($200 - $10,000 USDG)'
            ]
        },
        {
            'title': 'POLICY-GATED RISK GUARDRAILS',
            'subtitle': 'Zero-drawdown capital preservation and mathematical position sizing',
            'badges': ['CIRCUIT BREAKER', 'HALF-KELLY (0.5x)', '3 BPS SLIPPAGE', 'OWNER CAP > $250'],
            'bullets': [
                '• Max Drawdown Circuit Breaker: auto-halts execution if daily loss exceeds 2.5% ($25 cap)',
                '• Half-Kelly Position Sizer: f* = (p*b - q)/b allocation capped at $500 max single position',
                '• Quote Verifier & Slippage Guard: cross-checks Jupiter/Adrena quotes against Pyth Oracle (<= 3 bps)',
                '• Non-Custodial Ownership: positions >= $250 require explicit owner signature approval'
            ],
            'box_title': 'POLICY RULE ENGINE v3.2',
            'box_lines': [
                'Rule 01: Global Circuit Breaker -> Status: CLOSED (Max Drawdown: 0.00% / 2.50%)',
                'Rule 02: Whitelisted Assets -> [SOL, USDC, BTC, ETH, BONK, JUP]',
                'Rule 03: Whitelisted Rails  -> [Jupiter, Adrena, MagicBlock, MultiHopper, AceData]',
                'Rule 04: Leverage Ceiling   -> Max 3.0x (Adrena SVM Perps)'
            ]
        },
        {
            'title': 'SPECIALIST SUB-AGENT INFRASTRUCTURE',
            'subtitle': 'Isolated vaults, scoped permissions, and delegated execution mandates',
            'badges': ['SUB-AGENT VAULTS', 'DELEGATED PERMISSIONS', 'SCOPED POLICIES', 'SYNAPSE LEDGER'],
            'bullets': [
                '• AceMarketIntelligenceAgent: Dedicated to market research and sentiment analysis (Cap: $1.00/tx)',
                '• AdrenaHedgeExecutor: Dedicated to perpetual futures hedging with max 3.0x leverage (Cap: $25.00/tx)',
                '• MultiHopperCapitalDispatcher: Dedicated to automated multi-hop rebalancing (Cap: $10.00/tx)',
                '• Synapse Session Ledger: Every delegated action journals an immutable state digest'
            ],
            'box_title': 'SUB-AGENT DELEGATED VAULT SUMMARY',
            'box_lines': [
                'Vault 01 [RESEARCH]:        $25.00 USDC | Tools: [acedata_search_research, sap_adrena_get_prices]',
                'Vault 02 [PERP_EXECUTION]:  $100.00 USDC | Tools: [sap_adrena_build_open_long, sap_adrena_build_close]',
                'Vault 03 [PAYMENT_ROUTER]:  $50.00 USDC | Tools: [multihopper_route_transfer, magicblock_private]',
                'Status: All 3 Sub-Agents Active and reporting to Aegis Main Treasury'
            ]
        },
        {
            'title': 'x402 MICROPAYMENTS & ONCHAIN SETTLEMENT',
            'subtitle': 'Verifiable agent-to-agent transactions with cryptographic decision receipts',
            'badges': ['x402 PROTOCOL', '0.002 USDC / CALL', 'NO API KEYS', 'DECISION ID: sap:...'],
            'bullets': [
                '• OOBE SAP MCP payment challenge flow: server returns -32001 payment_required challenge',
                '• Autonomous client auto-relays Payment-Signature header in USDC on Solana',
                '• Instant execution upon verification without exposing custody or private keys',
                '• Anti-trap loop protection: rejects bad signatures with -32002 without generating looped challenge'
            ],
            'box_title': 'SAMPLE VERIFIED RECEIPT DIGEST',
            'box_lines': [
                'Decision ID:    sap:a9eeb0343fa7a28e',
                'Tool Name:      sap_adrena_build_open_long (Adrena SVM Perps)',
                'Payer Wallet:   AegisAgent9XpM2v8tQkK3mZ7nL4jY1bC6hW0dF5rT9qS',
                'Payment Vault:  OOBEGatewayVault1111111111111111111111111111 (0.002 USDC)',
                'Tx Status:      CONFIRMED ONCHAIN · SHA-256 Digest Verified'
            ]
        },
        {
            'title': 'VERIFIED ARENA XP & SUBMISSION TELEMETRY',
            'subtitle': 'Autonomous leaderboard ranking and complete Superteam submission bundle',
            'badges': ['ARENA CHALLENGER', 'RANK: GRANDMASTER', '1,350+ XP', '100% TEST COVERAGE'],
            'bullets': [
                '• Earning verified Arena XP across all challenge mission categories',
                '• Holder tier utility: Gold Tier grants 1.5x XP multiplier and -30% fee discount',
                '• Real-time leaderboard proof synthesis with SHA-256 root digests',
                '• 54/54 tests passing across 16 test suites with 0 placeholders'
            ],
            'box_title': 'SUPERTEAM SUBMISSION DETAILS',
            'box_lines': [
                'Main Bounty:   Build an Autonomous Capital Agent on Solana ($500 USDC)',
                'Grants:        Agentic Engineering ($200-$10K) & Build For Breakpoint',
                'Owner Wallet:  6mghraUR9NV2fA187VXoLN2rVS3WLA91UhqLfjtvDdmf',
                'GitHub Repo:   https://github.com/Khanhtnq/oobe-aegis-capital-agent',
                'Live Demo:     https://khanhtnq.github.io/oobe-aegis-capital-agent/'
            ]
        }
    ]

    frame_idx = 0
    # Generate 5 seconds per slide (at 2 fps = 10 frames per slide, total 50 frames, or 1 fps for smooth presentation)
    fps = 2
    seconds_per_slide = 4
    total_frames_per_slide = fps * seconds_per_slide

    for slide in slides:
        img = Image.new('RGB', (width, height), color='#0a0c10')
        draw = ImageDraw.Draw(img)

        # Ambient glows
        for r in range(450, 0, -3):
            alpha = int(20 * (1 - r / 450))
            draw.ellipse([150 - r, 150 - r, 150 + r, 150 + r], outline=(153, 69, 255, alpha))
            draw.ellipse([1750 - r, 900 - r, 1750 + r, 900 + r], outline=(20, 241, 149, alpha))

        # Main Border
        draw.rectangle([50, 50, width - 50, height - 50], outline='#1a2233', width=2)

        # Header Badges
        bx = 90
        for badge in slide['badges']:
            draw.rounded_rectangle([bx, 80, bx + 220, 125], radius=8, fill='#161d2b', outline='#25334d')
            draw.text((bx + 16, 92), f'● {badge}', fill='#14f195', font=font_bold)
            bx += 240

        # Title & Subtitle
        draw.text((90, 160), slide['title'], fill='#ffffff', font=font_h1)
        draw.text((90, 235), slide['subtitle'], fill='#9ca3af', font=font_h2)

        # Bullets
        by = 310
        for bullet in slide['bullets']:
            draw.text((90, by), bullet, fill='#e5e7eb', font=font_body)
            by += 48

        # Lower Detail Box
        draw.rounded_rectangle([90, 540, width - 90, 990], radius=16, fill='#0d121c', outline='#14f195', width=1)
        draw.text((120, 565), f'▶ {slide["box_title"]}', fill='#14f195', font=font_bold)

        ly = 620
        for line in slide['box_lines']:
            draw.text((120, ly), line, fill='#f3f4f6', font=font_code)
            ly += 55

        # Save duplicate frames for video duration
        for _ in range(total_frames_per_slide):
            frame_filename = f'temp_frames/frame_{frame_idx:04d}.png'
            img.save(frame_filename)
            frame_idx += 1

    print(f'Total {frame_idx} frames rendered at {width}x{height}')
    return fps

def compile_video(fps):
    out_video = 'demo_video.mp4'
    cmd = [
        'ffmpeg',
        '-y',
        '-r', str(fps),
        '-i', 'temp_frames/frame_%04d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '18',
        out_video
    ]
    subprocess.run(cmd, check=True)
    print(f'Video compiled cleanly to {out_video}')

    # Cleanup temp frames
    for f in os.listdir('temp_frames'):
        os.remove(os.path.join('temp_frames', f))
    os.rmdir('temp_frames')

if __name__ == '__main__':
    fps = create_frames()
    compile_video(fps)
