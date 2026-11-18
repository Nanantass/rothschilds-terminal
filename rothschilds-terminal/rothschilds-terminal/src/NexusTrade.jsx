import { useState, useRef } from "react";
import { AGENTS, SCORE_BREAKDOWN, C } from "./constants";
import { P } from "./prompts";
import { generateSample } from "./sampleData";

// ─── Main Component ───────────────────────────────────────────────
export default function NexusTrade() {
  const [ctx, setCtx]         = useState("");
  const [statuses, setStatus] = useState({});
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [tab, setTab]         = useState("setup");
  const [error, setError]     = useState(null);
  const [score, setScore]     = useState(null);
  const [activeId, setActive] = useState(null);
  const abortRef              = useRef(false);

  // ── Claude API call via Vite proxy (/api → api.anthropic.com) ──
  const callClaude = async (prompt) => {
    const res = await fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system:
          "You are a specialized trading AI agent. Respond ONLY with a valid JSON object. No markdown fences, no preamble. Raw JSON only.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data.content
      .map((b) => b.text || "")
      .join("")
      .replace(/```json\n?|```/g, "")
      .trim();
    return JSON.parse(raw);
  };

  // ── Pipeline runner ─────────────────────────────────────────────
  const runPipeline = async () => {
    if (!ctx.trim()) {
      setError("Paste market context or click Generate Sample.");
      return;
    }
    setRunning(true);
    setError(null);
    setResults({});
    setStatus({});
    setScore(null);
    setTab("pipeline");
    abortRef.current = false;

    const res = {};
    try {
      for (const agent of AGENTS) {
        if (abortRef.current) break;
        setStatus((p) => ({ ...p, [agent.id]: "running" }));
        setActive(agent.id);

        const prompts = {
          scanner:    () => P.scanner(ctx),
          regime:     () => P.regime(ctx, res),
          smartmoney: () => P.smartmoney(ctx, res),
          risk:       () => P.risk(ctx, res),
          execution:  () => P.execution(ctx, res),
        };

        try {
          const result = await callClaude(prompts[agent.id]());
          res[agent.id] = result;
          setResults((p) => ({ ...p, [agent.id]: result }));
          setStatus((p) => ({ ...p, [agent.id]: "done" }));
        } catch (e) {
          setStatus((p) => ({ ...p, [agent.id]: "error" }));
          throw new Error(`${agent.label} agent failed: ${e.message}`);
        }
      }

      if (res.risk?.trade_quality_scores) {
        const s = res.risk.trade_quality_scores;
        setScore(
          Math.min(
            100,
            Math.round(Object.values(s).reduce((a, v) => a + (Number(v) || 0), 0))
          )
        );
      }

      setActive(null);
      setTab("signal");
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const sColor = (id) => {
    const s = statuses[id];
    return s === "done"    ? C.green
         : s === "running" ? C.yellow
         : s === "error"   ? C.red
         : C.muted;
  };

  const scoreInfo =
    score == null        ? null
    : score >= 80        ? { label: "EXECUTE",   color: C.green  }
    : score >= 70        ? { label: "WATCHLIST", color: C.yellow }
    :                      { label: "IGNORE",    color: C.red    };

  const LS = {
    fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
    color: "#8888b8", fontWeight: 700, fontFamily: "'Rajdhani', sans-serif",
  };
  const MN = { fontFamily: "'Share Tech Mono', monospace" };

  const agentChip = (id, r) => {
    if (!r) return null;
    const map = {
      scanner:    { v: r.verdict,      c: r.verdict === "CANDIDATE" ? C.green : r.verdict === "WEAK" ? C.yellow : C.red },
      regime:     { v: r.regime?.replace(/_/g, " "), c: C.blue },
      smartmoney: { v: r.sm_bias,      c: C.purple },
      risk:       { v: r.risk_verdict, c: r.risk_verdict === "APPROVED" ? C.green : r.risk_verdict === "CAUTION" ? C.yellow : C.red },
      execution:  { v: r.direction ? `${r.direction}  ${r.rr}` : null, c: r.direction === "LONG" ? C.green : C.red },
    };
    return map[id];
  };

  // ── SETUP TAB ───────────────────────────────────────────────────
  const renderSetup = () => (
    <div style={{ maxWidth: 680, animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <div style={LS}>Market Intelligence Context</div>
          <button
            onClick={() => setCtx(generateSample("BTC", "67450"))}
            style={{
              background: "none", border: `1px solid ${C.border}`, color: "#7070a0",
              padding: "3px 10px", fontSize: 10.5, letterSpacing: 1, cursor: "pointer",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase",
            }}
          >
            Generate Sample
          </button>
        </div>
        <textarea
          value={ctx}
          onChange={(e) => setCtx(e.target.value)}
          rows={20}
          placeholder={
            "Paste Neurodex Pro output here...\n\n" +
            "Sistem akan otomatis membaca: coin, timeframe, harga,\n" +
            "OI, Funding Rate, Long/Short Ratio, Liquidations,\n" +
            "Exchange Flows, Whale Activity, Indikator Teknikal,\n" +
            "Market Structure, dan Sentiment.\n\n" +
            "Atau klik 'Generate Sample' untuk tes dengan data BTC."
          }
          style={{
            width: "100%", padding: 12,
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.text, ...MN, fontSize: 11.5, lineHeight: 1.7,
            outline: "none", borderRadius: 2, resize: "none",
          }}
        />
      </div>

      {error && (
        <div style={{
          ...MN, fontSize: 11, padding: "9px 14px", marginBottom: 12,
          border: `1px solid ${C.red}44`, background: `${C.red}0e`, color: C.red,
        }}>
          ERROR  {error}
        </div>
      )}

      <button
        onClick={runPipeline}
        disabled={running}
        style={{
          width: "100%", padding: "13px 0",
          background: running ? "transparent" : `${C.green}12`,
          border: `1px solid ${running ? C.dimmed : C.green}`,
          color: running ? C.muted : C.green,
          fontSize: 11.5, letterSpacing: 3, fontWeight: 700,
          cursor: running ? "not-allowed" : "pointer",
          fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase",
          transition: "all 0.2s",
        }}
      >
        {running
          ? `EXECUTING  ${AGENTS.find((a) => a.id === activeId)?.label || ""}...`
          : "RUN FULL AGENT PIPELINE"}
      </button>

      <div style={{ ...LS, textAlign: "center", marginTop: 10, color: C.dimmed, letterSpacing: 1 }}>
        Scanner  →  Regime  →  Smart Money  →  Risk  →  Execution
      </div>
    </div>
  );

  // ── PIPELINE TAB ────────────────────────────────────────────────
  const renderPipeline = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animation: "fadeIn 0.3s ease" }}>
      {AGENTS.map((agent) => {
        const r    = results[agent.id];
        const st   = statuses[agent.id] || "idle";
        const chip = agentChip(agent.id, r);
        return (
          <div
            key={agent.id}
            style={{
              background: C.card,
              border: `1px solid ${st === "done" ? agent.accent + "44" : C.border}`,
              borderRadius: 2, padding: 14,
              gridColumn: agent.id === "execution" ? "span 2" : undefined,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 18,
                  color: st === "done" ? agent.accent : st === "running" ? C.yellow : C.muted,
                  animation: st === "running" ? "pulse 0.9s infinite" : "none",
                }}>
                  {agent.icon}
                </span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: st === "done" ? agent.accent : C.text }}>
                    {agent.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#7070a0", marginTop: 2 }}>{agent.desc}</div>
                </div>
              </div>
              <div style={{
                ...MN, fontSize: 10, padding: "2px 8px",
                background: `${sColor(agent.id)}14`,
                border: `1px solid ${sColor(agent.id)}33`,
                color: sColor(agent.id), letterSpacing: 1,
              }}>
                {st.toUpperCase()}
              </div>
            </div>

            {chip?.v && (
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  ...MN, fontSize: 10, padding: "2px 9px",
                  background: `${chip.c}12`, border: `1px solid ${chip.c}44`, color: chip.c,
                }}>
                  {chip.v}
                </span>
              </div>
            )}

            {r ? (
              <pre style={{
                ...MN, fontSize: 10.5, color: C.text,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                maxHeight: 220, overflow: "auto", lineHeight: 1.55, margin: 0,
              }}>
                {JSON.stringify(r, null, 2)}
              </pre>
            ) : (
              <div style={{ ...MN, fontSize: 11, color: C.dimmed, textAlign: "center", padding: "20px 0" }}>
                {st === "running" ? "Processing..." : "Awaiting execution"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── SIGNAL TAB ──────────────────────────────────────────────────
  const renderSignal = () => {
    const exec    = results.execution;
    const riskRes = results.risk;
    if (!exec) return (
      <div style={{ color: C.muted, ...MN, textAlign: "center", paddingTop: 60 }}>
        Signal not yet generated.
      </div>
    );

    const sig  = exec.telegram_signal || {};
    const dir  = (sig.bias || exec.direction) === "LONG" ? C.green : C.red;
    const conf = Number(sig.confidence || 0);

    return (
      <div style={{ maxWidth: 560, animation: "fadeIn 0.3s ease" }}>

        {/* Score card */}
        {scoreInfo && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px",
            background: `${scoreInfo.color}0c`, border: `1px solid ${scoreInfo.color}33`,
            marginBottom: 12,
          }}>
            <div>
              <div style={{ ...LS, color: scoreInfo.color, marginBottom: 4 }}>System Score</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 44, fontWeight: 900, color: scoreInfo.color, lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ ...MN, fontSize: 9, color: C.muted, marginTop: 3 }}>/ 100 POINTS</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 900, color: scoreInfo.color, letterSpacing: 4 }}>
                {scoreInfo.label}
              </div>
              <div style={{ ...LS, marginTop: 6 }}>Execution Decision</div>
              <div style={{ ...MN, fontSize: 9.5, color: C.muted, marginTop: 5 }}>
                {score >= 80
                  ? "All criteria met — execute with discipline"
                  : score >= 70
                  ? "Monitor — conditions borderline"
                  : "Stand down — criteria not met"}
              </div>
            </div>
          </div>
        )}

        {/* Score breakdown bars */}
        {riskRes?.trade_quality_scores && (
          <div style={{ padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ ...LS, marginBottom: 10 }}>Score Breakdown</div>
            {SCORE_BREAKDOWN.map(({ key, label, max, color }) => {
              const val = riskRes.trade_quality_scores[key] || 0;
              return (
                <div key={key} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, color: "#7070a0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {label}
                    </span>
                    <span style={{ ...MN, fontSize: 11, color }}>{val}/{max}</span>
                  </div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${(val / max) * 100}%`, background: color, borderRadius: 2, transition: "width 0.7s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Telegram signal card */}
        <div style={{ background: C.card, border: `1px solid ${C.borderBright}`, marginBottom: 12 }}>
          <div style={{
            padding: "9px 16px", borderBottom: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#0a0a18",
          }}>
            <div style={LS}>Signal Output — Telegram Format</div>
            <span style={{ ...MN, fontSize: 10.5, color: "#7070a0" }}>BYBIT PERP  SCALP</span>
          </div>

          <div style={{ padding: "14px 18px", ...MN, fontSize: 12.5, lineHeight: 2.4 }}>
            {[
              ["COIN",  `${sig.coin || "—"}`,          C.text,  true ],
              ["BIAS",  sig.bias || exec.direction,     dir,     true ],
              ["ENTRY", sig.entry || exec.entry,        C.text,  false],
              ["SL",    sig.sl    || exec.sl,           C.red,   false],
              ["TP1",   sig.tp1   || exec.tp1,          C.green, false],
              ...((sig.tp2 || exec.tp2) ? [["TP2", sig.tp2 || exec.tp2, C.green, false]] : []),
              ...((sig.tp3 || exec.tp3) ? [["TP3", sig.tp3 || exec.tp3, C.green, false]] : []),
            ].map(([k, v, c, bold]) => (
              <div key={k} style={{ display: "flex" }}>
                <span style={{ color: "#6868a0", minWidth: 90 }}>{k}</span>
                <span style={{ color: c, fontWeight: bold ? 700 : 400 }}>{v}</span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0 0" }} />

            {[
              ["LEVERAGE", `${exec.leverage}x`,    C.yellow],
              ["MARGIN",   `$${exec.margin} USDT`, C.text  ],
              ["R:R",      exec.rr,                C.cyan  ],
              ["CONF",     `${conf}%`,             conf >= 70 ? C.green : conf >= 50 ? C.yellow : C.red],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex" }}>
                <span style={{ color: "#6868a0", minWidth: 90 }}>{k}</span>
                <span style={{ color: c }}>{v}</span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0 0" }} />
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ color: "#6868a0", minWidth: 90, flexShrink: 0 }}>RISK</span>
              <span style={{ color: C.orange, fontSize: 11.5, lineHeight: 1.5 }}>{sig.risk_warning}</span>
            </div>
            {exec.invalidation && (
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ color: "#6868a0", minWidth: 90, flexShrink: 0 }}>VOID IF</span>
                <span style={{ color: "#7070a0", fontSize: 11.5, lineHeight: 1.5 }}>{exec.invalidation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Execution notes */}
        {exec.notes && (
          <div style={{ padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ ...LS, marginBottom: 8 }}>Execution Notes</div>
            <div style={{ ...MN, fontSize: 11.5, color: C.text, lineHeight: 1.85 }}>{exec.notes}</div>
          </div>
        )}

        {/* Risk report */}
        {riskRes?.risk_report && (
          <div style={{ padding: "12px 16px", background: `${C.orange}0a`, border: `1px solid ${C.orange}33`, marginBottom: 12 }}>
            <div style={{ ...LS, color: C.orange, marginBottom: 8 }}>Risk Assessment</div>
            <div style={{ ...MN, fontSize: 11.5, color: C.text, lineHeight: 1.85 }}>{riskRes.risk_report}</div>
            {riskRes.risk_flags?.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {riskRes.risk_flags.map((f, i) => (
                  <span key={i} style={{
                    ...MN, fontSize: 10.5, padding: "2px 8px",
                    background: `${C.orange}12`, border: `1px solid ${C.orange}33`, color: C.orange,
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setTab("setup")}
          style={{
            width: "100%", padding: "11px 0", background: "none",
            border: `1px solid ${C.border}`, color: "#7070a0",
            fontSize: 11, letterSpacing: 2, cursor: "pointer",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: "uppercase",
          }}
        >
          NEW ANALYSIS
        </button>
      </div>
    );
  };

  // ── MAIN RENDER ─────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Rajdhani', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`, padding: "11px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0a0a18", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 900, letterSpacing: 3, color: C.green }}>
            Rothschild's Terminal
          </div>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#8888b8", fontWeight: 600, fontFamily: "'Rajdhani', sans-serif" }}>
            AI Derivatives System · Bybit Perp
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {AGENTS.map((a) => (
              <div key={a.id} title={a.label} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: sColor(a.id),
                boxShadow: statuses[a.id] === "done" ? `0 0 6px ${C.green}88` : "none",
                animation: statuses[a.id] === "running" ? "pulse 0.9s infinite" : "none",
                transition: "background 0.3s",
              }} />
            ))}
          </div>

          {scoreInfo && (
            <div style={{
              ...MN, fontSize: 11.5, color: scoreInfo.color,
              border: `1px solid ${scoreInfo.color}33`,
              padding: "2px 10px", letterSpacing: 1,
            }}>
              {score}/100 · {scoreInfo.label}
            </div>
          )}

          <div style={{
            fontSize: 11, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase",
            fontFamily: "'Rajdhani', sans-serif",
            color: running ? C.yellow : results.execution ? C.green : "#5a5a80",
          }}>
            {running ? "● PROCESSING" : results.execution ? "● SIGNAL READY" : "● STANDBY"}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", height: "calc(100vh - 50px)" }}>

        {/* Left: Agent pipeline sidebar */}
        <div style={{
          width: 206, flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          padding: "16px 12px", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 3,
        }}>
          <div style={{
            fontSize: 11, letterSpacing: 2, color: "#8888b8",
            fontWeight: 700, textTransform: "uppercase",
            fontFamily: "'Rajdhani', sans-serif", marginBottom: 10, paddingLeft: 4,
          }}>
            Pipeline
          </div>

          {AGENTS.map((agent, i) => {
            const done  = statuses[agent.id] === "done";
            const actv  = statuses[agent.id] === "running";
            const chip  = agentChip(agent.id, results[agent.id]);
            return (
              <div key={agent.id}>
                <div
                  onClick={() => results[agent.id] && setActive(agent.id)}
                  style={{
                    padding: "9px 10px",
                    background: activeId === agent.id ? `${agent.accent}0e` : "transparent",
                    border: `1px solid ${(activeId === agent.id || done) ? agent.accent + "44" : C.border}`,
                    borderRadius: 2, cursor: results[agent.id] ? "pointer" : "default",
                    opacity: !running && !results[agent.id] && i > 0 && Object.keys(results).length === 0 ? 0.35 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{
                      fontSize: 15, minWidth: 18,
                      color: done ? agent.accent : actv ? C.yellow : C.muted,
                      animation: actv ? "pulse 0.9s infinite" : "none",
                    }}>
                      {agent.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: done ? agent.accent : actv ? C.yellow : C.text }}>
                        {agent.label}
                      </div>
                      <div style={{ fontSize: 10, color: "#7070a0", marginTop: 2 }}>{agent.desc}</div>
                    </div>
                  </div>
                  {chip?.v && (
                    <div style={{ marginTop: 5, paddingLeft: 25 }}>
                      <span style={{ ...MN, fontSize: 10.5, color: chip.c }}>{chip.v}</span>
                    </div>
                  )}
                </div>

                {i < AGENTS.length - 1 && (
                  <div style={{
                    width: 1, height: 10, marginLeft: 18,
                    background: done ? agent.accent + "55" : C.border,
                    transition: "background 0.5s",
                  }} />
                )}
              </div>
            );
          })}

          {/* Score bars */}
          {results.risk?.trade_quality_scores && (
            <div style={{ marginTop: 18 }}>
              <div style={{
                fontSize: 11, letterSpacing: 2, color: "#8888b8",
                fontWeight: 700, textTransform: "uppercase",
                fontFamily: "'Rajdhani', sans-serif", marginBottom: 8, paddingLeft: 2,
              }}>
                Score
              </div>
              {SCORE_BREAKDOWN.map(({ key, label, max, color }) => {
                const val = results.risk.trade_quality_scores[key] || 0;
                return (
                  <div key={key} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, fontWeight: 600, color: "#6868a0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {label}
                      </span>
                      <span style={{ ...MN, fontSize: 10, color }}>{val}/{max}</span>
                    </div>
                    <div style={{ height: 2, background: C.border, borderRadius: 1 }}>
                      <div style={{ height: "100%", width: `${(val / max) * 100}%`, background: color, borderRadius: 1, transition: "width 0.7s ease" }} />
                    </div>
                  </div>
                );
              })}
              {scoreInfo && (
                <div style={{ marginTop: 9, padding: "5px 8px", border: `1px solid ${scoreInfo.color}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...MN, fontSize: 12, color: scoreInfo.color }}>{score}/100</span>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: scoreInfo.color }}>
                    {scoreInfo.label}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Tab content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", background: "#0a0a18" }}>
            {[
              { id: "setup",    label: "Setup"    },
              { id: "pipeline", label: "Pipeline", off: !running && Object.keys(results).length === 0 },
              { id: "signal",   label: "Signal",   off: !results.execution },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => !t.off && setTab(t.id)}
                style={{
                  background: "none", border: "none",
                  borderBottom: `2px solid ${tab === t.id ? C.green : "transparent"}`,
                  padding: "11px 18px", marginBottom: -1,
                  color: tab === t.id ? C.green : t.off ? "#303050" : "#7070a0",
                  fontSize: 11, letterSpacing: 2, fontWeight: 700,
                  cursor: t.off ? "default" : "pointer",
                  fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", transition: "color 0.2s",
                }}
              >
                {t.id === "signal" && results.execution && (
                  <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: scoreInfo?.color || C.green, marginRight: 7, verticalAlign: "middle" }} />
                )}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 22px" }}>
            {tab === "setup"    && renderSetup()}
            {tab === "pipeline" && renderPipeline()}
            {tab === "signal"   && renderSignal()}
          </div>
        </div>
      </div>
    </div>
  );
}
