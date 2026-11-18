# Rothschild's Terminal

> AI-powered Bybit perpetual futures scalping system — multi-agent Claude pipeline for high-probability derivatives trading.

![System Status](https://img.shields.io/badge/status-active-00ff88?style=flat-square)
![Model](https://img.shields.io/badge/model-claude--sonnet--4-2299ff?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite-aa44ff?style=flat-square)
![Exchange](https://img.shields.io/badge/exchange-Bybit%20Perpetual-ff9900?style=flat-square)

---

## Overview

Rothschild's Terminal is a semi-automated trading intelligence system that runs five specialized AI agents sequentially to analyze a market setup, validate it, and produce a ready-to-execute signal.

The system is built on **Claude Sonnet 4.6** and is designed around one core philosophy:

> **Survival > Consistency > Profit**

It does not generate signals for the sake of frequency. It generates signals only when the setup genuinely clears all five layers of analysis.

---

## System Architecture

```
Market Intelligence (Neurodex Pro)
            │
            ▼
  ┌─────────────────┐
  │  Scanner Agent  │  ── Identifies high-probability candidate setups
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Regime Agent   │  ── Classifies market condition + directional bias
  └────────┬────────┘
           │
           ▼
  ┌─────────────────────┐
  │  Smart Money Agent  │  ── Tracks whale / institutional behavior
  └────────┬────────────┘
           │
           ▼
  ┌───────────────┐
  │   Risk Agent  │  ── Challenges every setup; capital preservation first
  └───────┬───────┘
          │
          ▼
  ┌──────────────────────┐
  │   Execution Agent    │  ── Optimizes entry, SL, TP, leverage, sizing
  └──────────────────────┘
          │
          ▼
  Telegram Signal Output
```

---

## Agent Roles

| Agent | Role | Key Output |
|---|---|---|
| **Scanner** | Filter candidate setups | CANDIDATE / WEAK / REJECT |
| **Regime** | Classify market condition | Regime type + directional bias |
| **Smart Money** | Track institutional flow | SM bias + manipulation risk |
| **Risk** | Challenge the setup | APPROVED / CAUTION / REJECTED |
| **Execution** | Optimize trade parameters | Entry, SL, TP1/2/3, leverage |

---

## Trade Quality Scoring System

The Risk Agent scores every setup across 6 dimensions. Total = 100 points.

| Dimension | Weight |
|---|---|
| Trend Strength | 25 pts |
| Open Interest | 20 pts |
| Liquidity | 15 pts |
| Smart Money | 15 pts |
| Technical Structure | 15 pts |
| Funding Rate | 10 pts |

**Execution rules:**

| Score | Decision |
|---|---|
| >= 80 | **EXECUTE** |
| 70 – 79 | **WATCHLIST** |
| < 70 | **IGNORE** |

---

## Execution Constraints

All trades must satisfy these hard rules — the Execution Agent enforces them:

- Stop Loss `<=` 2% spot price move
- Leverage `>=` 10x
- Minimum margin `$10 USDT`
- Risk-Reward `>=` 1:2

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 6 |
| AI Engine | Claude Sonnet 4.6 (`claude-sonnet-4-20250514`) |
| Styling | Inline styles + Google Fonts |
| Fonts | Orbitron, Rajdhani, Share Tech Mono |
| API Proxy | Vite dev proxy (API key never reaches browser) |

---

## Project Structure

```
rothschilds-terminal/
├── index.html              # Vite entry point
├── package.json
├── vite.config.js          # Dev server + Anthropic API proxy
├── .env.example            # Environment variable template
├── .gitignore
├── README.md
└── src/
    ├── main.jsx            # React root
    ├── index.css           # Global resets + animations + Google Fonts
    ├── NexusTrade.jsx      # Main application component
    ├── constants.js        # AGENTS, SCORE_BREAKDOWN, color palette
    ├── prompts.js          # All 5 agent prompt builders
    └── sampleData.js       # Neurodex Pro mock data generator
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rothschilds-terminal.git
cd rothschilds-terminal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## How It Works

### API Key Security

The Anthropic API key is **never sent to the browser**. The Vite dev server intercepts all requests to `/api/*` and proxies them server-side to `api.anthropic.com`, injecting the key from your `.env` file.

```
Browser → fetch("/api/v1/messages")
              ↓
          Vite Proxy (adds x-api-key header)
              ↓
       api.anthropic.com/v1/messages
```

### Using the Terminal

1. **Paste Neurodex Pro data** into the context field — the system reads coin, timeframe, and price automatically from your paste. No manual input fields needed.
2. Click **Run Full Agent Pipeline**.
3. Watch the 5 agents execute live in the **Pipeline** tab.
4. The **Signal** tab opens automatically with the final score, trade parameters, and a formatted Telegram-ready signal.

### Sample Data

If you don't have a Neurodex Pro subscription, click **Generate Sample** to run the pipeline on a realistic BTC/USDT mock dataset and see how the system works end to end.

---

## Production Deployment

The Vite proxy only works in dev mode (`npm run dev`). For production deployments, you need a backend proxy to keep the API key secure.

**Option A — Vercel (recommended)**

Deploy with a Vercel serverless function that proxies `/api/v1/messages` to Anthropic. Set `ANTHROPIC_API_KEY` in Vercel's environment variables dashboard.

**Option B — Simple Express proxy**

```bash
npm install express http-proxy-middleware dotenv
```

```js
// server.js
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import "dotenv/config";

const app = express();

app.use("/api", createProxyMiddleware({
  target: "https://api.anthropic.com",
  changeOrigin: true,
  pathRewrite: { "^/api": "" },
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader("x-api-key", process.env.ANTHROPIC_API_KEY);
      proxyReq.setHeader("anthropic-version", "2023-06-01");
    },
  },
}));

app.listen(3001);
```

---

## Risk Disclaimer

This tool is for personal research and educational use only. Cryptocurrency derivatives trading involves significant risk of loss. Nothing in this software constitutes financial advice. Always trade with capital you can afford to lose.

---

## License

MIT — free to use, modify, and distribute.
