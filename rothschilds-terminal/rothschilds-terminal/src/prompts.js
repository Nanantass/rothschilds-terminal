/**
 * Agent Prompt Builders
 *
 * Each function returns a tailored prompt for its agent role.
 * All agents extract asset name, timeframe, and price directly
 * from the pasted market context — no manual input required.
 *
 * Pipeline order: scanner → regime → smartmoney → risk → execution
 */

export const P = {
  scanner: (ctx) =>
    `You are the Scanner Agent in a Bybit perpetual futures scalping system.
Extract the asset name, timeframe, and current price from the market data below.
Market Data:\n${ctx}

STRICT FILTERS: Reject if — low liquidity, weak OI confirmation, no derivatives signal, RR < 1:2, manipulated candles.

Return ONLY valid JSON, no markdown, no preamble:
{"verdict":"CANDIDATE|WEAK|REJECT","setup_type":"TREND_CONTINUATION|LIQUIDITY_SWEEP|BREAKOUT|MEAN_REVERSION|NONE","liquidity_score":0-100,"momentum_score":0-100,"derivatives_score":0-100,"rr_estimate":"1:X","filter_passed":true,"key_signals":["signal1","signal2","signal3"],"rejection_reason":null,"summary":"2-sentence verdict"}`,

  regime: (ctx, prev) =>
    `You are the Market Regime Agent in a Bybit perpetual futures scalping system.
Scanner result: ${JSON.stringify(prev.scanner || {})}
Market Data:\n${ctx}

Return ONLY valid JSON:
{"regime":"BULLISH_TREND|BEARISH_TREND|RANGING|VOLATILITY_EXPANSION|MEAN_REVERSION","directional_bias":"LONG|SHORT|NEUTRAL","bias_strength":0-100,"mtf_alignment":{"m5":"BULL|BEAR|NEUTRAL","m15":"BULL|BEAR|NEUTRAL","h1":"BULL|BEAR|NEUTRAL","h4":"BULL|BEAR|NEUTRAL"},"continuation_probability":0-100,"key_support":"price","key_resistance":"price","summary":"2-sentence regime analysis"}`,

  smartmoney: (ctx, prev) =>
    `You are the Smart Money Agent in a Bybit perpetual futures scalping system.
Pipeline so far: ${JSON.stringify({ scanner: prev.scanner, regime: prev.regime })}
Market Data:\n${ctx}

Return ONLY valid JSON:
{"sm_bias":"ACCUMULATING|DISTRIBUTING|NEUTRAL|MANIPULATING","whale_activity":"HIGH|MODERATE|LOW","exchange_flow":"STRONG_OUTFLOW|OUTFLOW|NEUTRAL|INFLOW|STRONG_INFLOW","top_trader_lean":"HEAVILY_LONG|MOSTLY_LONG|BALANCED|MOSTLY_SHORT|HEAVILY_SHORT","crowded_trade_risk":0-100,"manipulation_probability":0-100,"liquidation_hunt_risk":"HIGH|MODERATE|LOW","sm_aligned_with_bias":true,"sm_score":0-100,"flags":[],"summary":"2-sentence smart money read"}`,

  risk: (ctx, prev) =>
    `You are the Risk Agent in a Bybit perpetual futures scalping system.
Your job is to CHALLENGE this setup with maximum scrutiny. Capital preservation is priority #1.
Full pipeline: ${JSON.stringify(prev)}
Market Data:\n${ctx}

Be the devil's advocate. Find every reason to reject. Return ONLY valid JSON:
{"risk_verdict":"APPROVED|CAUTION|REJECTED","fake_breakout_prob":0-100,"liquidity_trap_prob":0-100,"overextension_risk":0-100,"funding_risk":0-100,"crowding_risk":0-100,"overall_risk":0-100,"risk_flags":["flag1"],"adjusted_confidence":0-100,"trade_quality_scores":{"trend_strength":0-25,"open_interest":0-20,"liquidity":0-15,"funding":0-10,"smart_money":0-15,"technical_structure":0-15},"risk_report":"3-4 sentence risk verdict"}`,

  execution: (ctx, prev) =>
    `You are the Execution Agent in a Bybit perpetual futures scalping system.
Extract the asset name and current price from the market data below.
Full pipeline: ${JSON.stringify(prev)}
Market Data:\n${ctx}

CONSTRAINTS: SL <= 2% spot move, leverage >= 10x, margin >= $10, RR >= 1:2.
In telegram_signal.coin use the correct ticker extracted from market data (format: XYZUSDT).
Return ONLY valid JSON:
{"direction":"LONG|SHORT","entry_type":"MARKET|LIMIT","entry":"price","sl":"price","tp1":"price","tp2":"price or null","tp3":"price or null","leverage":10,"margin":10,"sl_pct":1.5,"rr":"1:2","invalidation":"one sentence","notes":"2-3 execution tips","telegram_signal":{"coin":"XYZUSDT","bias":"LONG|SHORT","entry":"price","sl":"price","tp1":"price","tp2":"price or null","confidence":75,"risk_warning":"one key risk"}}`,
};
