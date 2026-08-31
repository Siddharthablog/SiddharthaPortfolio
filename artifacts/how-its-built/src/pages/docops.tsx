import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import "../index.css";
import ChatWidget from "../components/ChatWidget";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = "/api/docs-agent";

type AgentStatus = "idle" | "running" | "completed" | "done";
type ActiveAgent = "pipeline" | "mcp" | "normalize" | "glossary" | null;

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return isMobile;
}

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE STREAMING CLIENT
// ─────────────────────────────────────────────────────────────────────────────

interface StreamResult {
  full: string;
  latencyMs: number | null;
  tokens: number | null;
}

async function streamAgent(
  url: string,
  body: Record<string, unknown>,
  onChunk: (full: string) => void,
  signal?: AbortSignal
): Promise<StreamResult> {
  const clientStart = Date.now(); // client-side fallback timer
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";
  let serverLatencyMs: number | null = null;
  let tokens: number | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.done) {
          // prefer server-measured latency; fall back to client clock
          const latencyMs = evt.latencyMs ?? (Date.now() - clientStart);
          return { full, latencyMs, tokens: evt.tokens ?? null };
        }
        if (evt.error) throw new Error(evt.error);
        if (evt.content) {
          full += evt.content;
          onChunk(full);
        }
      } catch (e: any) {
        if (!(e instanceof SyntaxError)) throw e;
      }
    }
  }
  // Stream closed without a done event — use client clock
  return { full, latencyMs: Date.now() - clientStart, tokens };
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND PATH ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

function FullPagePathAnimation() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const h = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const { w, h } = size;
  const m = 18, r = 18;
  const x1 = m + r, x2 = w - m - r, y1 = m + r, y2 = h - m - r;
  const path = `M ${x1},${m} L ${x2},${m} Q ${w - m},${m} ${w - m},${y1} L ${w - m},${y2} Q ${w - m},${h - m} ${x2},${h - m} L ${x1},${h - m} Q ${m},${h - m} ${m},${y2} L ${m},${y1} Q ${m},${m} ${x1},${m} Z`;
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", overflow: "visible", zIndex: 9997 }} aria-hidden="true">
      <path fill="none" stroke="hsl(100,40%,38%)" strokeWidth="1.5" strokeDasharray="5 8" opacity="0.28" d={path} />
      <g opacity="0.8">
        <animateMotion dur="28s" repeatCount="indefinite" rotate="auto" path={path} />
        <text fontSize="15" textAnchor="middle" dominantBaseline="central" fill="hsl(100,40%,32%)">✦</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY NAV
// ─────────────────────────────────────────────────────────────────────────────

// Nav items map to agent IDs (null = overview)
const NAV_ITEMS: { label: string; agent: ActiveAgent }[] = [
  { label: "Overview", agent: null },
  { label: "Pipeline", agent: "pipeline" },
  { label: "MCP Agent", agent: "mcp" },
  { label: "Normalizer", agent: "normalize" },
  { label: "Glossary", agent: "glossary" },
];

function StickyNav({ activeAgent, onNavigate }: { activeAgent: ActiveAgent; onNavigate: (a: ActiveAgent) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = () => { setScrolled(window.scrollY > 40); if (window.scrollY > 40) setMenuOpen(false); };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);

  const handleNav = (agent: ActiveAgent) => {
    setMenuOpen(false);
    onNavigate(agent);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isActive = (agent: ActiveAgent) => activeAgent === agent;

  const navItemStyle = (agent: ActiveAgent): React.CSSProperties => ({
    borderRadius: 9999, padding: "5px 14px", fontSize: 12, fontWeight: 600,
    background: isActive(agent) ? "hsl(100,40%,38%)" : "white",
    border: isActive(agent) ? "1.5px solid hsl(100,40%,38%)" : "1.5px solid hsl(40,14%,76%)",
    color: isActive(agent) ? "white" : "var(--text)",
    boxShadow: isActive(agent) ? "0 2px 8px hsl(100,40%,44%,0.25)" : "0 1px 4px rgba(0,0,0,0.07)",
    transition: "all 0.2s ease", cursor: "pointer",
  });

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 54, zIndex: 10000,
        padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "hsla(45,22%,92%,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "background 0.35s ease, border-color 0.35s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/ai-projects">
            <a style={{
              background: "white", fontSize: 12, fontWeight: 700, padding: "5px 14px",
              cursor: "pointer", color: "var(--text)", textDecoration: "none",
              borderRadius: 9999, border: "1.5px solid hsl(40,14%,76%)",
              display: "inline-flex", alignItems: "center", gap: 5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "all 0.2s ease",
            }}>← AI Projects</a>
          </Link>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 9999,
            background: "hsl(100,40%,44%,0.12)", border: "1.5px solid hsl(100,40%,44%,0.28)",
            color: "hsl(100,40%,38%)", letterSpacing: "0.12em", textTransform: "uppercase",
          }}>API DocOps</span>
        </div>
        {isMobile ? (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: menuOpen ? "hsl(40,14%,88%)" : "white", border: "1.5px solid hsl(40,14%,76%)",
            color: "var(--text)", borderRadius: 9999, padding: "5px 16px", fontSize: 14, fontWeight: 800, cursor: "pointer",
          }}>{menuOpen ? "✕" : "☰"}</button>
        ) : (
          <div style={{ display: "flex", gap: 5 }}>
            {NAV_ITEMS.map(({ label, agent }) => (
              <button key={label} onClick={() => handleNav(agent)} style={navItemStyle(agent)}>{label}</button>
            ))}
          </div>
        )}
      </nav>
      {isMobile && (
        <div style={{
          position: "fixed", top: 54, left: 0, right: 0, zIndex: 9999,
          background: "hsla(45,22%,92%,0.97)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          padding: menuOpen ? "1rem 1.25rem 1.25rem" : "0 1.25rem",
          display: "flex", flexDirection: "column", gap: 8,
          maxHeight: menuOpen ? 400 : 0, overflow: "hidden",
          transition: "max-height 0.3s ease, padding 0.3s ease",
        }}>
          {NAV_ITEMS.map(({ label, agent }) => (
            <button key={label} onClick={() => handleNav(agent)} style={{
              background: isActive(agent) ? "hsl(100,40%,38%)" : "white",
              border: `1.5px solid ${isActive(agent) ? "hsl(100,40%,38%)" : "hsl(40,14%,76%)"}`,
              cursor: "pointer", padding: "10px 16px", borderRadius: 9999,
              fontSize: 13, fontWeight: 600, textAlign: "left",
              color: isActive(agent) ? "white" : "var(--text)",
            }}>{label}</button>
          ))}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function Markdown({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ fontSize: "0.82rem", lineHeight: 1.75, color: "var(--text)" }}>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0].trim();
          const code = (lang && !/\s/.test(lang) ? lines.slice(1) : lines).join("\n");
          return (
            <div key={i} style={{ margin: "0.75rem 0", borderRadius: 10, overflow: "hidden", border: "1px solid #2a2a2a" }}>
              {lang && !/\s/.test(lang) && (
                <div style={{ background: "#1a1a1d", padding: "4px 12px", fontSize: "0.7rem", color: "#888", fontFamily: "monospace", borderBottom: "1px solid #2a2a2a" }}>{lang}</div>
              )}
              <pre style={{ background: "#0d0d0f", padding: "0.75rem 1rem", overflowX: "auto", margin: 0 }}>
                <code style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.75rem", color: "#e8e8e8" }}>{code}</code>
              </pre>
            </div>
          );
        }

        return (
          <span key={i}>
            {part.split("\n").map((line, j) => {
              if (line.startsWith("### ")) return <h3 key={j} style={{ fontSize: "0.9rem", fontWeight: 700, marginTop: "1rem", marginBottom: "0.25rem", color: "var(--text)" }}>{renderInline(line.slice(4))}</h3>;
              if (line.startsWith("## ")) return <h2 key={j} style={{ fontSize: "1rem", fontWeight: 800, marginTop: "1.25rem", marginBottom: "0.3rem", color: "var(--text)" }}>{renderInline(line.slice(3))}</h2>;
              if (line.startsWith("# ")) return <h1 key={j} style={{ fontSize: "1.1rem", fontWeight: 900, marginTop: "1.5rem", marginBottom: "0.4rem", color: "var(--text)" }}>{renderInline(line.slice(2))}</h1>;
              if (line.startsWith("- ") || line.startsWith("* ")) return <div key={j} style={{ display: "flex", gap: 8, paddingLeft: 8 }}><span style={{ color: "hsl(100,40%,44%)", marginTop: 2 }}>•</span><span>{renderInline(line.slice(2))}</span></div>;
              if (/^\|(.+\|)+$/.test(line) && !/^[\s|:-]+$/.test(line)) {
                const cells = line.split("|").filter((_, ci) => ci > 0 && ci < line.split("|").length - 1);
                return (
                  <div key={j} style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                    {cells.map((cell, ci) => <div key={ci} style={{ flex: 1, padding: "5px 10px", fontSize: "0.78rem", borderRight: ci < cells.length - 1 ? "1px solid var(--border)" : "none", color: "var(--text)" }}>{renderInline(cell.trim())}</div>)}
                  </div>
                );
              }
              if (/^\s*\|[-:\s|]+\|\s*$/.test(line)) return null;
              if (!line.trim()) return <div key={j} style={{ height: "0.5rem" }} />;
              return <p key={j} style={{ margin: "0.15rem 0", color: "var(--muted)" }}>{renderInline(line)}</p>;
            })}
          </span>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ fontWeight: 700, color: "var(--text)" }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} style={{ fontFamily: "monospace", fontSize: "0.8em", background: "hsl(45,22%,88%)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: 4 }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEPPER BAR
// ─────────────────────────────────────────────────────────────────────────────

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 0 1rem", overflowX: "auto" }}>
      {steps.map((step, i) => {
        const num = i + 1;
        const isPast = num < current;
        const isActive = num === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
                background: isActive ? "hsl(100,40%,44%)" : isPast ? "hsl(100,40%,44%,0.2)" : "hsl(45,22%,86%)",
                color: isActive ? "white" : isPast ? "hsl(100,40%,38%)" : "hsl(40,8%,52%)",
                border: isActive ? "2px solid hsl(100,40%,44%)" : isPast ? "2px solid hsl(100,40%,44%,0.4)" : "2px solid hsl(40,14%,76%)",
                transition: "all 0.3s ease",
              }}>
                {isPast ? "✓" : num}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? "hsl(100,40%,38%)" : "hsl(40,8%,52%)", whiteSpace: "nowrap" }}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 28, height: 2, background: isPast ? "hsl(100,40%,44%,0.4)" : "hsl(40,14%,80%)", margin: "0 2px", marginBottom: 14, transition: "background 0.3s ease" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GATE OUTPUT CARD
// ─────────────────────────────────────────────────────────────────────────────

function GateCard({
  gateNum, gateLabel, status, stream, output, showFeedback, feedback,
  onFeedbackChange, onApprove, onRequestChanges, onCancelFeedback, onRerun,
  isLastGate, feedbackHint, isCurrentGate, metrics,
}: {
  gateNum: number; gateLabel: string; status: AgentStatus; stream: string; output: string;
  showFeedback: boolean; feedback: string;
  onFeedbackChange: (v: string) => void; onApprove: () => void;
  onRequestChanges: () => void; onCancelFeedback: () => void;
  onRerun: () => void; isLastGate: boolean; feedbackHint: string; isCurrentGate: boolean;
  metrics: { latencyMs: number | null; tokens: number | null } | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === "running" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream, status]);

  const content = status === "running" ? stream : output;

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginTop: "1rem" }}>
      {/* Gate header */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "hsl(45,22%,97%)" }}>
        {status === "running" ? (
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid hsl(100,40%,44%)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        ) : (
          <span style={{ color: "hsl(100,40%,44%)", fontSize: 14 }}>✓</span>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Gate {gateNum} — {gateLabel}</span>
        {status === "running" && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>Agent is processing…</span>}
        {status === "completed" && !metrics && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>Review output below, then approve or request changes.</span>}
        {status === "completed" && metrics && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "hsl(258,60%,96%)", border: "1px solid hsl(258,40%,82%)",
              borderRadius: 9999, padding: "2px 10px",
              fontSize: 11, fontWeight: 600, color: "hsl(258,50%,45%)",
            }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="4.5" cy="4.5" r="4" stroke="hsl(258,50%,55%)" strokeWidth="1.2" fill="hsl(258,60%,92%)" />
                <circle cx="4.5" cy="4.5" r="1.5" fill="hsl(258,50%,55%)" />
              </svg>
              Traced
            </span>
            {metrics.latencyMs != null && (
              <span style={{ fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                ⏱ {(metrics.latencyMs / 1000).toFixed(1)}s
              </span>
            )}
            {metrics.tokens != null && (
              <span style={{ fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                · {metrics.tokens.toLocaleString()} tokens
              </span>
            )}
          </div>
        )}
      </div>

      {/* Output */}
      <div ref={scrollRef} style={{ padding: "1.25rem", maxHeight: 420, overflowY: "auto" }}>
        {content
          ? <Markdown text={content} />
          : status === "completed"
            ? <div style={{ color: "hsl(0,60%,55%)", fontSize: "0.8rem", fontStyle: "italic" }}>No output received — the model returned an empty response. Try re-running this gate.</div>
            : <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic" }}>Waiting for output…</div>
        }
      </div>

      {/* Approval actions — only on the active gate */}
      {status === "completed" && isCurrentGate && !showFeedback && (
        <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onApprove} style={{
            padding: "8px 20px", borderRadius: 9999, border: "none", fontWeight: 700, fontSize: 12,
            background: "hsl(100,40%,44%)", color: "white", cursor: "pointer", transition: "opacity 0.2s",
          }}>✓ Approve — {isLastGate ? "Finish" : `Proceed to Gate ${gateNum + 1}`}</button>
          <button onClick={onRequestChanges} style={{
            padding: "8px 20px", borderRadius: 9999, border: "1.5px solid var(--border)", fontWeight: 600, fontSize: 12,
            background: "transparent", color: "var(--muted)", cursor: "pointer", transition: "all 0.2s",
          }}>↺ Request Changes</button>
        </div>
      )}

      {/* Feedback panel */}
      {showFeedback && (
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)", background: "hsl(100,40%,44%,0.04)" }}>
          <div style={{ borderLeft: "3px solid hsl(100,40%,44%)", paddingLeft: 10, marginBottom: 10, fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text)" }}>Correction hint:</strong> {feedbackHint}
          </div>
          <textarea
            value={feedback}
            onChange={e => onFeedbackChange(e.target.value)}
            placeholder="Describe the correction…"
            style={{
              width: "100%", minHeight: 90, padding: "0.6rem 0.75rem", border: "1.5px solid var(--border)",
              borderRadius: 8, fontSize: "0.8rem", fontFamily: "inherit", resize: "vertical",
              background: "white", color: "var(--text)", outline: "none", lineHeight: 1.6,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={onCancelFeedback} style={{
              padding: "7px 18px", borderRadius: 9999, border: "1.5px solid var(--border)", fontWeight: 600, fontSize: 12,
              background: "transparent", color: "var(--muted)", cursor: "pointer",
            }}>Cancel</button>
            <button onClick={onRerun} style={{
              padding: "7px 18px", borderRadius: 9999, border: "none", fontWeight: 700, fontSize: 12,
              background: "var(--text)", color: "var(--bg)", cursor: "pointer",
            }}>→ Re-run Gate {gateNum} with correction</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC AGENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface AgentConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  steps: string[];
  gateLabels: string[];
  placeholder: string;
  feedbackHints: string[];
  buildBody: (gate: number, input: string, outputs: Record<number, string>, feedback?: string) => Record<string, unknown>;
  endpoint: string;
  copyGate: number; // which gate's output to copy
  extraInfo?: React.ReactNode;
}

function AgentWorkflow({ cfg }: { cfg: AgentConfig }) {
  const isMobile = useIsMobile();
  const [gate, setGate] = useState(1);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [input, setInput] = useState("");
  const [outputs, setOutputs] = useState<Record<number, string>>({});
  const [metrics, setMetrics] = useState<Record<number, { latencyMs: number | null; tokens: number | null }>>({});
  const [stream, setStream] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Use a ref for outputs so runGate always reads the latest value
  // without needing outputs in its dependency array (avoids stale closure).
  const outputsRef = useRef(outputs);
  outputsRef.current = outputs;

  const runGate = useCallback(async (g: number, fb?: string) => {
    setStatus("running");
    setStream("");
    setShowFeedback(false);
    setFeedback("");
    abortRef.current = new AbortController();

    try {
      const body = cfg.buildBody(g, input, outputsRef.current, fb);
      const { full, latencyMs, tokens } = await streamAgent(
        `${API_BASE}/${cfg.endpoint}`,
        body,
        (chunk) => setStream(chunk),
        abortRef.current.signal,
      );
      setOutputs(prev => ({ ...prev, [g]: full }));
      setMetrics(prev => ({ ...prev, [g]: { latencyMs, tokens } }));
      setStatus("completed");
    } catch (e: any) {
      if (e.name === "AbortError") return;
      alert(`Error: ${e.message}`);
      setStatus("completed"); // stay on current gate — don't wipe the progress view
    }
  }, [cfg, input]);

  const handleApprove = useCallback(() => {
    if (gate >= cfg.steps.length) {
      setStatus("done");
    } else {
      const nextGate = gate + 1;
      setGate(nextGate);
      runGate(nextGate);
    }
  }, [gate, cfg.steps.length, runGate]);

  const handleReset = () => {
    abortRef.current?.abort();
    setGate(1); setStatus("idle"); setInput(""); setOutputs({}); setMetrics({});
    setStream(""); setShowFeedback(false); setFeedback("");
  };

  return (
    <div id={cfg.id} style={{ scrollMarginTop: 80, marginTop: "3rem" }}>
      {/* Agent header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.5rem" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: `${cfg.iconColor}18`, border: `1.5px solid ${cfg.iconColor}30` }}>{cfg.icon}</div>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>{cfg.title}</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>{cfg.subtitle}</p>
        </div>
        {status !== "idle" && (
          <button onClick={handleReset} style={{ marginLeft: "auto", padding: "5px 14px", borderRadius: 9999, border: "1.5px solid var(--border)", fontSize: 11, fontWeight: 600, background: "white", color: "var(--muted)", cursor: "pointer" }}>Reset</button>
        )}
      </div>

      {/* Stepper */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1rem 1.25rem 0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <Stepper steps={cfg.steps} current={gate} />
      </div>

      {/* Extra info box */}
      {cfg.extraInfo && status === "idle" && (
        <div style={{ marginTop: "1rem", background: "hsl(100,40%,44%,0.04)", borderRadius: "0 8px 8px 0", padding: "1rem", border: "1px solid hsl(100,40%,44%,0.2)", borderLeft: "3px solid hsl(100,40%,44%)" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.7 }}>{cfg.extraInfo}</div>
        </div>
      )}

      {/* Input area (gate 1 / idle) */}
      {status === "idle" && (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem", marginTop: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={cfg.placeholder}
            style={{
              width: "100%", minHeight: 220, padding: "0.75rem", border: "1.5px solid var(--border)",
              borderRadius: 8, fontSize: "0.78rem", fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              resize: "vertical", background: "hsl(45,22%,98%)", color: "var(--text)", outline: "none", lineHeight: 1.65,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => runGate(1)}
            disabled={!input.trim()}
            style={{
              marginTop: 12, width: "100%", padding: "10px 0", borderRadius: 9999, border: "none",
              fontWeight: 700, fontSize: 13, background: input.trim() ? "hsl(100,40%,44%)" : "hsl(45,22%,82%)",
              color: input.trim() ? "white" : "hsl(40,8%,60%)", cursor: input.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >Run {cfg.steps[0]} — Gate 1</button>
        </div>
      )}

      {/* Gate outputs */}
      {Array.from({ length: gate }, (_, i) => i + 1).map(g => {
        const isCurrentGate = g === gate;
        const gateStatus: AgentStatus = status === "done" ? "completed" : (isCurrentGate ? status : "completed");
        if (gateStatus === "idle" || (!(g in outputs) && gateStatus !== "running" && !isCurrentGate)) return null;
        return (
          <GateCard
            key={g}
            gateNum={g}
            gateLabel={cfg.gateLabels[g - 1]}
            status={isCurrentGate ? status : "completed"}
            stream={stream}
            output={outputs[g] || ""}
            showFeedback={isCurrentGate && showFeedback && status === "completed"}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onApprove={handleApprove}
            onRequestChanges={() => setShowFeedback(true)}
            onCancelFeedback={() => setShowFeedback(false)}
            onRerun={() => runGate(g, feedback)}
            isLastGate={g === cfg.steps.length}
            feedbackHint={cfg.feedbackHints[g - 1] || ""}
            isCurrentGate={isCurrentGate}
            metrics={metrics[g] ?? null}
          />
        );
      })}

      {/* Done card */}
      {status === "done" && (
        <div style={{
          marginTop: "1rem", background: "hsl(100,40%,44%,0.06)", border: "1.5px solid hsl(100,40%,60%,0.4)",
          borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text)" }}>{cfg.title} Complete</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(100,40%,38%)" }}>All gates approved</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigator.clipboard.writeText(outputs[cfg.copyGate] || "")}
                style={{ padding: "7px 18px", borderRadius: 9999, border: "none", fontWeight: 700, fontSize: 12, background: "hsl(100,40%,44%)", color: "white", cursor: "pointer" }}
              >Copy Full Docs</button>
              <button onClick={handleReset} style={{ padding: "7px 18px", borderRadius: 9999, border: "1.5px solid var(--border)", fontWeight: 600, fontSize: 12, background: "white", color: "var(--muted)", cursor: "pointer" }}>Start Over</button>
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--border)", padding: "1rem", maxHeight: 360, overflowY: "auto" }}>
            <Markdown text={outputs[cfg.copyGate] || ""} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT CONFIGS
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE_CFG: AgentConfig = {
  id: "pipeline-agent",
  title: "Documentation Pipeline",
  subtitle: "5-gate sequential workflow: Validate → Structure → Generate → Review → Score",
  icon: "⚙️",
  iconColor: "hsl(100,40%,44%)",
  steps: ["Validate", "Structure Plan", "Generate", "Review Summary", "Quality Score"],
  gateLabels: ["Validation Report", "Page Structure Plan", "Generated Documentation", "Generation Summary", "Quality Scorecard"],
  placeholder: "Paste your OpenAPI spec, Confluence export, PDF text, or any raw API documentation material here…",
  feedbackHints: [
    "Tell the AI what it got wrong in the validation — e.g. a component it marked Missing that is actually present, or a verdict you disagree with.",
    "Tell the AI how to change the page structure plan — add, remove, or rename pages, or change which page type a section belongs to.",
    "Tell the AI what to rewrite — wrong content, missing detail, tone, or formatting.",
    "Add a note for the AI to factor into its summary — e.g. a gap you already know the answer to.",
    "Tell the AI to adjust scoring — e.g. if it penalised something correct in your style guide.",
  ],
  buildBody: (gate, input, outputs, feedback) => {
    const f = feedback?.trim();
    switch (gate) {
      case 1: return { gate: 1, input, ...(f ? { feedback: f } : {}) };
      case 2: return { gate: 2, input, gate1Output: outputs[1], ...(f ? { feedback: f } : {}) };
      case 3: return { gate: 3, input, gate2Output: outputs[2], ...(f ? { feedback: f } : {}) };
      case 4: return { gate: 4, gate3Output: outputs[3], ...(f ? { feedback: f } : {}) };
      case 5: return { gate: 5, gate3Output: outputs[3], ...(f ? { feedback: f } : {}) };
      default: return { gate, input };
    }
  },
  endpoint: "pipeline",
  copyGate: 3,
};

const MCP_CFG: AgentConfig = {
  id: "mcp-agent",
  title: "MCP Documentation Agent",
  subtitle: "Transforms API spec into Model Context Protocol docs for AI clients like Claude",
  icon: "🤖",
  iconColor: "hsl(210,88%,52%)",
  steps: ["Audit & Map", "Schema Design", "Generate Docs", "AI Examples", "Scorecard"],
  gateLabels: ["Audit & Primitive Mapping", "MCP Tool Schema Design", "Generate MCP Documentation", "AI Prompt Examples", "Compatibility Scorecard"],
  placeholder: "Paste your API spec (OpenAPI JSON/YAML, Swagger, or plain-text endpoint descriptions)…",
  feedbackHints: [
    "Correct how endpoints are classified — e.g. an endpoint you want as a Resource instead of a Tool.",
    "Fix the JSON Schema design — rename conflicting parameters, change types, or mark a field required.",
    "Fix generated docs — wrong tool names, missing examples, incorrect Claude Desktop config.",
    "Adjust AI prompt examples — replace unrealistic user messages, fix arguments.",
    "Adjust a score if it penalised something correct in your MCP conventions.",
  ],
  buildBody: (gate, input, outputs, feedback) => {
    const f = feedback?.trim();
    switch (gate) {
      case 1: return { gate: 1, input, ...(f ? { feedback: f } : {}) };
      case 2: return { gate: 2, input, gate1Output: outputs[1], ...(f ? { feedback: f } : {}) };
      case 3: return { gate: 3, input, gate2Output: outputs[2], ...(f ? { feedback: f } : {}) };
      case 4: return { gate: 4, gate3Output: outputs[3], ...(f ? { feedback: f } : {}) };
      case 5: return { gate: 5, gate3Output: outputs[3], ...(f ? { feedback: f } : {}) };
      default: return { gate, input };
    }
  },
  endpoint: "mcp",
  copyGate: 3,
  extraInfo: (
    <>
      <strong style={{ color: "hsl(100,40%,38%)" }}>What this agent produces:</strong> MCP (Model Context Protocol) documentation tells AI clients like Claude exactly which tools your API offers, what parameters each tool accepts, and how to call them — so Claude can use your API without a human in the loop.
      <br /><strong style={{ color: "hsl(40,10%,18%)" }}>The 5 gates:</strong> Map endpoints → Design JSON schemas → Write docs → Validate with AI examples → Score compatibility
    </>
  ),
};

const NORMALIZE_CFG: AgentConfig = {
  id: "normalize-agent",
  title: "Normalizer Agent",
  subtitle: "Audits existing API reference content and produces a clean, normalised version",
  icon: "🔧",
  iconColor: "hsl(16,80%,52%)",
  steps: ["Audit Structure", "Fix & Normalize"],
  gateLabels: ["Structural Audit Report", "Normalized API Reference"],
  placeholder: "Paste your existing API reference documentation (HTML, Markdown, or plain text)…",
  feedbackHints: [
    "Tell the AI what you disagree with in the audit — e.g. a section it marked as missing that is actually present.",
    "Tell the AI what to fix differently in the normalization — e.g. change table format or section ordering.",
  ],
  buildBody: (gate, input, outputs, feedback) => {
    const f = feedback?.trim();
    if (gate === 1) return { mode: "audit", content: input, ...(f ? { feedback: f } : {}) };
    return { mode: "fix", content: input, auditReport: outputs[1], ...(f ? { feedback: f } : {}) };
  },
  endpoint: "normalize",
  copyGate: 2,
};

const GLOSSARY_CFG: AgentConfig = {
  id: "glossary-agent",
  title: "Glossary Builder",
  subtitle: "Scans docs for terms, flags inconsistencies, and proposes canonical definitions",
  icon: "📖",
  iconColor: "hsl(260,60%,55%)",
  steps: ["Extract Terms", "Define Terms"],
  gateLabels: ["Term Extraction Report", "Proposed Glossary"],
  placeholder: "Paste your API documentation, user guide, or any technical content to build a glossary from…",
  feedbackHints: [
    "Tell the AI to reclassify terms, add missing terms it skipped, or remove false positives.",
    "Tell the AI to revise specific definitions — e.g. if a definition uses the term itself or is inaccurate.",
  ],
  buildBody: (gate, input, outputs, feedback) => {
    const f = feedback?.trim();
    if (gate === 1) return { mode: "extract", content: input, ...(f ? { feedback: f } : {}) };
    return { mode: "define", content: input, extractReport: outputs[1], ...(f ? { feedback: f } : {}) };
  },
  endpoint: "glossary",
  copyGate: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME / OVERVIEW SECTION
// ─────────────────────────────────────────────────────────────────────────────

function Overview({ onLaunch }: { onLaunch: (id: ActiveAgent) => void }) {
  const { ref, visible } = useReveal(0.1);
  const isMobile = useIsMobile();

  const agents: { icon: string; color: string; title: string; desc: string; cta: string; id: ActiveAgent; primary: boolean }[] = [
    { icon: "⚙️", color: "hsl(100,40%,44%)", title: "Pipeline Agent", desc: "A 5-gate sequential workflow that validates, structures, and generates complete API documentation pages with rigorous quality scoring.", cta: "Launch Pipeline →", id: "pipeline", primary: true },
    { icon: "🤖", color: "hsl(210,88%,52%)", title: "MCP Documentation Agent", desc: "Transforms any API spec into Model Context Protocol documentation — so AI clients like Claude can call your API directly without a human in the loop.", cta: "Launch MCP Agent →", id: "mcp", primary: true },
    { icon: "🔧", color: "hsl(16,80%,52%)", title: "Normalizer Agent", desc: "Audits existing API reference content for structural issues and produces a clean, normalised version ready for your docs platform.", cta: "Launch Normalizer →", id: "normalize", primary: false },
    { icon: "📖", color: "hsl(260,60%,55%)", title: "Glossary Builder", desc: "Scans docs for terms, flags inconsistencies by support impact, and proposes canonical definitions for approval.", cta: "Launch Glossary →", id: "glossary", primary: false },
  ];

  return (
    <div id="overview" ref={ref} style={{ scrollMarginTop: 80 }}>
      {/* Badge + Hero */}
      <div style={{ textAlign: "center", padding: "5.5rem 1.5rem 2.5rem", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(18px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
        <div style={{ display: "inline-block", marginBottom: 18, background: "hsl(100,40%,44%,0.12)", border: "1.5px solid hsl(100,40%,44%,0.28)", borderRadius: 9999, padding: "4px 16px" }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(100,40%,38%)" }}>API DocOps</span>
        </div>
        <h1 style={{ fontSize: isMobile ? "1.8rem" : "clamp(2rem,4.5vw,2.8rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.15, marginBottom: 18 }}>
          Documentation, <span style={{ color: "hsl(100,40%,44%)", fontStyle: "italic" }}>perfected by AI.</span><br />Approved by you.
        </h1>
        <p style={{ maxWidth: 560, margin: "0 auto", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.8 }}>
          4 AI agents that convert raw API specifications into complete developer documentation. Each agent uses a multi-gate pipeline with a human approval step at each gate. Documentation is validated, structured, generated, and scored using NVIDIA Nemotron 3 via OpenRouter, with real-time output streamed over SSE.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {["OpenRouter", "SSE", "4 AI Agents", "Human Approval Gates"].map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 9999, background: "hsl(45,22%,86%)", border: "1px solid var(--border)", color: "var(--muted)" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Agent cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
        {agents.map((a, i) => (
          <div key={i} style={{ background: "white", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}16`, border: `1.5px solid ${a.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{a.icon}</div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{a.title}</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>{a.desc}</p>
            <button
              onClick={() => onLaunch(a.id)}
              style={{
                display: "inline-block", padding: "8px 20px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                cursor: "pointer",
                background: a.primary ? "hsl(100,40%,44%)" : "transparent",
                color: a.primary ? "white" : "hsl(40,8%,52%)",
                border: a.primary ? "none" : "1.5px solid var(--border)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >{a.cta}</button>
          </div>
        ))}
      </div>

      {/* API key notice */}
      <div style={{ marginTop: "1.5rem", background: "hsl(45,22%,96%)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
        <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--text)" }}>Powered by OpenRouter.</strong> This suite uses the <code style={{ fontFamily: "monospace", fontSize: "0.75em", background: "hsl(45,22%,88%)", padding: "1px 5px", borderRadius: 4 }}>nvidia/nemotron-3-ultra-550b-a55b:free</code> model via <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(100,40%,38%)" }}>OpenRouter</a> for all AI generation. Requires <code style={{ fontFamily: "monospace", fontSize: "0.75em", background: "hsl(45,22%,88%)", padding: "1px 5px", borderRadius: 4 }}>OPENROUTER_API_KEY</code> in your environment.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE AGENT VIEW (shown when a card CTA is clicked)
// ─────────────────────────────────────────────────────────────────────────────

const AGENT_CFG_MAP: Record<NonNullable<ActiveAgent>, AgentConfig> = {
  pipeline: PIPELINE_CFG,
  mcp: MCP_CFG,
  normalize: NORMALIZE_CFG,
  glossary: GLOSSARY_CFG,
};

const AGENT_LABELS: Record<NonNullable<ActiveAgent>, { icon: string; color: string }> = {
  pipeline: { icon: "⚙️", color: "hsl(100,40%,44%)" },
  mcp: { icon: "🤖", color: "hsl(210,88%,52%)" },
  normalize: { icon: "🔧", color: "hsl(16,80%,52%)" },
  glossary: { icon: "📖", color: "hsl(260,60%,55%)" },
};

function ActiveAgentView({ id, onBack }: { id: NonNullable<ActiveAgent>; onBack: () => void }) {
  const cfg = AGENT_CFG_MAP[id];
  const { icon, color } = AGENT_LABELS[id];

  return (
    <div style={{ paddingTop: "5.5rem" }}>
      {/* Back bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 9999, border: "1.5px solid var(--border)",
            background: "white", color: "var(--muted)", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "hsl(45,22%,92%)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
        >← All Agents</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1.5px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{cfg.title}</span>
        </div>
      </div>

      <AgentWorkflow cfg={cfg} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DocOpsPage() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>(null);

  const handleLaunch = (id: ActiveAgent) => {
    setActiveAgent(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setActiveAgent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <FullPagePathAnimation />
      <StickyNav activeAgent={activeAgent} onNavigate={setActiveAgent} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        {activeAgent === null ? (
          <Overview onLaunch={handleLaunch} />
        ) : (
          <ActiveAgentView id={activeAgent} onBack={handleBack} />
        )}
      </div>

      <div style={{ textAlign: "center", padding: "2rem 1.5rem", borderTop: "1px solid var(--border)", fontSize: "0.78rem", color: "var(--muted)" }}>
        API DocOps · Powered by OpenRouter · © 2026 Siddhartha Mani
      </div>

      <ChatWidget />
    </div>
  );
}
