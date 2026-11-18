/**
 * Neurodex Pro Sample Data Generator
 *
 * Generates realistic-looking market intelligence data
 * for testing the agent pipeline without a live Neurodex subscription.
 *
 * @param {string} coin  - e.g. "BTC", "ETH", "SOL"
 * @param {number|string} rawPrice - reference price
 * @returns {string} formatted market context block
 */
export const generateSample = (coin = "BTC", rawPrice = 67450) => {
  const p    = parseFloat(rawPrice) || 67450;
  const fmt  = (n) => Math.round(n).toLocaleString();

  return `${coin}/USDT PERPETUAL — BYBIT
Current Price: $${fmt(p)}
Analysis Timeframe: 15M

--- DERIVATIVES DATA ---
Open Interest: $12.8B (+1.9% in 1h, rising steadily with price)
OI Trend: Healthy expansion — longs building alongside spot inflow
Funding Rate: +0.009% (mild long skew, well below extreme threshold)
Long/Short Ratio: 1.21 (slight long dominance, not crowded)
Futures Volume 24h: $34.2B (12% above 30-day average)
Current Candle Volume: 2.3x average (momentum confirmed)

--- LIQUIDATIONS ---
Longs Liquidated (1h): $9.4M
Shorts Liquidated (1h): $2.3M
Liquidation Cluster Above: $${fmt(p * 1.018)}
Liquidation Cluster Below: $${fmt(p * 0.982)}
Cascade Risk: Low — clusters are spread out, no stacking

--- EXCHANGE FLOWS ---
Net Exchange Flow (4h): -2,140 ${coin} (outflow — bullish signal)
Whale Transactions >$500K (4h): 5 large buys, 1 large sell
Top Trader Long/Short: 58% long / 42% short
Stablecoin Flow: +$320M USDT into exchanges (buy pressure building)

--- TECHNICAL INDICATORS (15M) ---
RSI (14): 55 (neutral-bullish, room to run)
MACD: Bullish crossover confirmed, histogram expanding
Stochastic RSI: 63 (not overbought, mid-range)
EMA 20/50/200: All below current price (aligned bullish stack)
Volume Profile: POC at $${fmt(p * 0.997)}, value area trending higher
Bollinger Bands: Price near mid-upper range, not overextended

--- MARKET STRUCTURE ---
Trend (1H): Bullish — series of higher highs and higher lows
Recent Pattern: Bull flag consolidation (3h) approaching apex
Key Resistance: $${fmt(p * 1.013)} (liquidity pool above)
Key Support: $${fmt(p * 0.988)} (demand zone, tested and held twice)
Spread: 0.01% (tight — good liquidity)
Market Depth: Deep — top 15 assets by perpetual volume

--- SENTIMENT ---
Fear & Greed Index: 63 (Greed — not extreme)
Social Volume: Moderate — no euphoria detected
BTC Dominance: 53.2% (slightly declining — mild altcoin rotation)
Recent News: No major macro catalysts — organic price structure`;
};
