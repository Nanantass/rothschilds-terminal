// ─── Agent Definitions ────────────────────────────────────────────
export const AGENTS = [
  { id: "scanner",    label: "SCANNER",     icon: "⬡", accent: "#00ff88", desc: "Setup identification"   },
  { id: "regime",     label: "REGIME",      icon: "◎", accent: "#2299ff", desc: "Market classification"  },
  { id: "smartmoney", label: "SMART MONEY", icon: "◆", accent: "#aa44ff", desc: "Institutional tracking" },
  { id: "risk",       label: "RISK",        icon: "▲", accent: "#ff9900", desc: "Trade challenge"        },
  { id: "execution",  label: "EXECUTION",   icon: "◈", accent: "#00ffcc", desc: "Execution optimization" },
];

// ─── Trade Quality Score Breakdown ───────────────────────────────
// Total = 100 pts  |  >=80 Execute  |  70-79 Watchlist  |  <70 Ignore
export const SCORE_BREAKDOWN = [
  { key: "trend_strength",      label: "Trend Strength", max: 25, color: "#00ff88" },
  { key: "open_interest",       label: "Open Interest",  max: 20, color: "#2299ff" },
  { key: "liquidity",           label: "Liquidity",      max: 15, color: "#aa44ff" },
  { key: "funding",             label: "Funding Rate",   max: 10, color: "#ff9900" },
  { key: "smart_money",         label: "Smart Money",    max: 15, color: "#ffcc00" },
  { key: "technical_structure", label: "Technical",      max: 15, color: "#00ffcc" },
];

// ─── Color Palette ────────────────────────────────────────────────
export const C = {
  bg:          "#07070f",
  surface:     "#0c0c1a",
  card:        "#0f0f22",
  border:      "#1a1a30",
  borderBright:"#262644",
  text:        "#dde0f0",
  muted:       "#474768",
  dimmed:      "#272745",
  green:       "#00ff88",
  red:         "#ff2255",
  yellow:      "#ffcc00",
  blue:        "#2299ff",
  purple:      "#aa44ff",
  cyan:        "#00ffcc",
  orange:      "#ff9900",
};
