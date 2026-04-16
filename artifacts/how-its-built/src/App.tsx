import { useEffect, useRef, useState, useCallback } from "react";
import "./index.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.22) {
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

/** Loops a step counter 0 → max, pauses at end, resets, repeats */
function useLoop(max: number, stepMs: number, pauseMs: number, active: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    let cancelled = false;
    function run() {
      setStep(0);
      let s = 0;
      const iv = setInterval(() => {
        s++;
        if (!cancelled) setStep(s);
        if (s >= max) {
          clearInterval(iv);
          setTimeout(() => { if (!cancelled) run(); }, pauseMs);
        }
      }, stepMs);
    }
    const init = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(init); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return step;
}

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="card" style={{ padding: "1.5rem", width: "100%", fontFamily: mono ? "monospace" : undefined }}>
      {children}
    </div>
  );
}

function MacBar({ filename }: { filename: string }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
      {["#ef4444","#f59e0b","#22c55e"].map(c => (
        <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
      ))}
      <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{filename}</span>
    </div>
  );
}

// ── Viz 1: AI Documentation ───────────────────────────────────────────────────
const DOC_LINES = [
  { w: 88, accent: true },
  { w: 62, accent: false },
  { w: 76, accent: false },
  { w: 91, accent: true },
  { w: 54, accent: false },
  { w: 83, accent: false },
  { w: 70, accent: true },
];

function AiDocViz({ active }: { active: boolean }) {
  const step = useLoop(DOC_LINES.length + 1, 160, 1200, active);
  return (
    <Card>
      <MacBar filename="api-reference.md" />
      {DOC_LINES.map((l, i) => (
        <div key={i} style={{
          height: i === 0 ? 9 : 6,
          background: l.accent
            ? "linear-gradient(90deg,hsl(210,88%,52%),hsl(100,40%,44%))"
            : "hsl(40,8%,82%)",
          borderRadius: 4, marginBottom: 9,
          width: step > i ? `${l.w}%` : "0%",
          opacity: step > i ? 1 : 0,
          transition: "width 0.4s ease, opacity 0.35s ease",
        }} />
      ))}
      <div style={{
        fontSize: 11, fontFamily: "monospace", color: "hsl(100,40%,36%)", fontWeight: 600, marginTop: 8,
        opacity: step > DOC_LINES.length ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}>
        ✦ LLM-optimised structure applied
      </div>
    </Card>
  );
}

// ── Viz 2: Docs Automation ────────────────────────────────────────────────────
const AUTO_STEPS = [
  { icon: "🔍", label: "Scan docs repo",       sub: "1,240 topics found",     color: "hsl(210,88%,52%)" },
  { icon: "✦",  label: "LLM validation",        sub: "Local model review",      color: "hsl(100,40%,44%)" },
  { icon: "✂",  label: "Remove stale content",  sub: "312 topics flagged",      color: "hsl(40,90%,54%)"  },
  { icon: "🚀", label: "Jenkins publish",        sub: "Live in 4 hr",           color: "hsl(100,40%,44%)" },
];

function AutomationViz({ active }: { active: boolean }) {
  const step = useLoop(AUTO_STEPS.length + 1, 500, 1000, active);
  return (
    <Card>
      <MacBar filename="automation.py — running…" />
      {AUTO_STEPS.map((s, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(22px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: s.color + "1a", border: `1.5px solid ${s.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{s.label}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{s.sub}</span>
            </div>
            <div style={{ height: 5, background: "hsl(40,14%,88%)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: s.color, borderRadius: 3,
                width: step > i ? "100%" : "0%",
                transition: "width 0.55s ease 0.1s",
              }} />
            </div>
          </div>
        </div>
      ))}
      <div style={{
        fontSize: 11, fontWeight: 700, color: "hsl(100,40%,36%)", fontFamily: "monospace",
        opacity: step > AUTO_STEPS.length ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        ✓ 3-day manual process → 4 hours
      </div>
    </Card>
  );
}

// ── Viz 3: DITA / Structured Content ─────────────────────────────────────────
const DITA_LINES = [
  { text: '<?xml version="1.0"?>',           color: "hsl(40,8%,60%)", indent: 0 },
  { text: '<concept id="power-server">',      color: "hsl(210,88%,52%)", indent: 0 },
  { text: "<title>",                          color: "hsl(100,40%,44%)", indent: 1 },
  { text: "  IBM Power10 Server Guide",       color: "hsl(40,10%,30%)", indent: 2 },
  { text: "</title>",                         color: "hsl(100,40%,44%)", indent: 1 },
  { text: "<conbody>",                        color: "hsl(210,88%,52%)", indent: 1 },
  { text: '  <p audience="admin">…</p>',     color: "hsl(40,10%,30%)", indent: 2 },
  { text: '  <p audience="dev">…</p>',       color: "hsl(40,10%,30%)", indent: 2 },
  { text: "</conbody>",                       color: "hsl(210,88%,52%)", indent: 1 },
  { text: "</concept>",                       color: "hsl(210,88%,52%)", indent: 0 },
];

function DitaViz({ active }: { active: boolean }) {
  const step = useLoop(DITA_LINES.length + 1, 140, 1400, active);
  return (
    <Card mono>
      <MacBar filename="power-server.dita — DITAVAL active" />
      <div style={{ fontSize: 11, lineHeight: 1.9 }}>
        {DITA_LINES.map((t, i) => (
          <div key={i} style={{
            paddingLeft: t.indent * 14, color: t.color,
            opacity: step > i ? 1 : 0,
            transform: step > i ? "translateX(0)" : "translateX(-12px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}>
            {t.text}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, fontSize: 10, fontWeight: 600,
        color: "hsl(210,88%,44%)", fontFamily: "monospace",
        opacity: step > DITA_LINES.length ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        ✓ 6 Power Server models · single source
      </div>
    </Card>
  );
}

// ── Viz 4: Open Source & Hackathons ──────────────────────────────────────────
const OS_PROJECTS = [
  { name: "FletX",        color: "hsl(210,88%,52%)" },
  { name: "Requestly",    color: "hsl(100,40%,44%)" },
  { name: "Ansible AMQ",  color: "hsl(40,90%,52%)"  },
  { name: "Terraform",    color: "hsl(260,60%,58%)"  },
  { name: "WatsonX AI",   color: "hsl(100,40%,44%)" },
  { name: "Link Checker", color: "hsl(210,88%,52%)" },
];

function OpenSourceViz({ active }: { active: boolean }) {
  const step = useLoop(OS_PROJECTS.length + 2, 320, 1200, active);
  return (
    <Card>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>Contributions &amp; Hackathons</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {OS_PROJECTS.map((p, i) => (
          <span key={p.name} style={{
            background: p.color + "18", border: `1.5px solid ${p.color}44`,
            color: p.color, fontSize: 12, fontWeight: 600,
            padding: "5px 14px", borderRadius: 9999,
            opacity: step > i ? 1 : 0,
            transform: step > i ? "scale(1)" : "scale(0.6)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}>
            {p.name}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { icon: "🏆", text: "Hacktoberfest contributor" },
          { icon: "⚡", text: "IBM WatsonX Agentic AI Hackathon" },
        ].map((item, i) => (
          <div key={item.text} style={{
            display: "flex", gap: 8, alignItems: "center",
            opacity: step > OS_PROJECTS.length + i ? 1 : 0,
            transform: step > OS_PROJECTS.length + i ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Viz 5: IBM Experience ─────────────────────────────────────────────────────
const IBM_BULLETS = [
  "API, CLI & developer guides for IBM Cloud",
  "Content structured for LLM consumption",
  "Python + local LLM → 3 days reduced to 4 hrs",
  "DITAVAL profiling across 6 Power Server models",
  "Mentored junior writers · IBM Style Guide",
  "WatsonX Hackathon · Hacktoberfest",
];

function IbmViz({ active }: { active: boolean }) {
  const step = useLoop(IBM_BULLETS.length, 500, 1200, active);
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "hsl(210,88%,52%)", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 900, fontSize: 13,
        }}>IBM</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Information Developer</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Sep 2022 — Present · Hybrid Cloud &amp; AI</div>
        </div>
      </div>
      {IBM_BULLETS.map((b, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start",
          marginBottom: 9,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(18px)",
          transition: "opacity 0.38s ease, transform 0.38s ease",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
            background: "hsl(100,40%,44%)",
            boxShadow: step === i + 1 ? "0 0 0 3px hsl(100,40%,44%,0.25)" : "none",
            transition: "box-shadow 0.3s ease",
          }} />
          <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{b}</span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        {["DITA","XML","Jenkins","Python","Acrolinx"].map(t => (
          <span key={t} style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
            background: "hsl(210,88%,52%,0.1)", border: "1px solid hsl(210,88%,52%,0.28)",
            color: "hsl(210,88%,44%)",
          }}>{t}</span>
        ))}
      </div>
    </Card>
  );
}

// ── Viz 6: Xylem Experience ───────────────────────────────────────────────────
const XYLEM_ENDPOINTS = [
  { method: "GET",  path: "/v1/iot/devices",         status: "200" },
  { method: "POST", path: "/v1/iot/events",           status: "201" },
  { method: "GET",  path: "/v1/visenti/sensors",      status: "200" },
  { method: "PUT",  path: "/v1/cloud/config",         status: "204" },
];
const METHOD_COLOR: Record<string, string> = {
  GET: "hsl(100,40%,44%)", POST: "hsl(210,88%,52%)", PUT: "hsl(40,90%,54%)",
};

function XylemViz({ active }: { active: boolean }) {
  const step = useLoop(XYLEM_ENDPOINTS.length + 1, 480, 1200, active);
  return (
    <Card mono>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "hsl(200,80%,44%)", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 900, fontSize: 11,
        }}>XYL</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "sans-serif" }}>Technical Documentation</div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "sans-serif" }}>2020 — 2022 · IoT Cloud</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10, fontFamily: "sans-serif" }}>
        Swagger / OpenAPI — endpoints documented:
      </div>
      {XYLEM_ENDPOINTS.map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(16px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
            background: METHOD_COLOR[e.method] + "1a",
            border: `1px solid ${METHOD_COLOR[e.method]}44`,
            color: METHOD_COLOR[e.method], minWidth: 38, textAlign: "center",
          }}>{e.method}</span>
          <span style={{ flex: 1, fontSize: 11, color: "hsl(40,10%,35%)" }}>{e.path}</span>
          <span style={{
            fontSize: 10, padding: "1px 6px", borderRadius: 4,
            background: "hsl(100,40%,44%,0.12)", color: "hsl(100,40%,36%)", fontWeight: 600,
          }}>{e.status}</span>
        </div>
      ))}
      <div style={{
        marginTop: 10, fontSize: 10, color: "hsl(100,40%,36%)", fontWeight: 600, fontFamily: "sans-serif",
        opacity: step > XYLEM_ENDPOINTS.length ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        ✓ SDK, UAT guide, release notes delivered
      </div>
    </Card>
  );
}

// ── Viz 7: Unisys Experience ──────────────────────────────────────────────────
const UNISYS_FLOW = [
  { label: "Gather",    icon: "📥", color: "hsl(210,88%,52%)" },
  { label: "Plan",      icon: "📋", color: "hsl(100,40%,44%)" },
  { label: "Author",    icon: "✍",  color: "hsl(260,60%,55%)" },
  { label: "Review",    icon: "🔍", color: "hsl(40,90%,54%)"  },
  { label: "Publish",   icon: "🚀", color: "hsl(100,40%,44%)" },
];

function UnisysViz({ active }: { active: boolean }) {
  const step = useLoop(UNISYS_FLOW.length + 1, 550, 1000, active);
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "hsl(260,50%,50%)", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 900, fontSize: 11,
        }}>UNI</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Information Developer</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>2017 — 2020 · Data Centre &amp; Logistics</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 14 }}>End-to-end documentation workflow:</div>
      {/* Flow nodes */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
        {UNISYS_FLOW.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: step > i ? f.color + "22" : "hsl(40,14%,92%)",
                border: `2px solid ${step > i ? f.color : "hsl(40,14%,82%)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.4s ease",
                boxShadow: step === i + 1 ? `0 0 0 4px ${f.color}22` : "none",
              }}>
                {f.icon}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, color: step > i ? f.color : "var(--muted)",
                textTransform: "uppercase", letterSpacing: "0.06em",
                transition: "color 0.4s ease",
              }}>
                {f.label}
              </span>
            </div>
            {i < UNISYS_FLOW.length - 1 && (
              <div style={{
                width: 20, height: 2, flexShrink: 0,
                background: step > i + 1 ? "hsl(100,40%,44%)" : "hsl(40,14%,82%)",
                transition: "background 0.4s ease",
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{
        fontSize: 10, color: "var(--muted)", lineHeight: 1.6,
        opacity: step > UNISYS_FLOW.length ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        Projects: <strong style={{ color: "var(--text)" }}>ClearPath Forward!</strong> (Data Centre)
        · <strong style={{ color: "var(--text)" }}>Digistics</strong> (Air Cargo)
      </div>
    </Card>
  );
}

// ── Viz 8: Skills ─────────────────────────────────────────────────────────────
const SKILL_GROUPS = [
  { label: "Markup",     color: "hsl(210,88%,52%)", items: ["DITA","XML","Markdown","YAML","JSON"] },
  { label: "Authoring",  color: "hsl(100,40%,44%)", items: ["Oxygen XML","VS Code","Acrolinx","Confluence"] },
  { label: "CI/CD",      color: "hsl(40,90%,54%)",  items: ["Jenkins","Git","JIRA","Swagger"] },
  { label: "AI & Auto",  color: "hsl(260,60%,55%)", items: ["Python","LangChain","Local LLMs","RAG"] },
];

function SkillsViz({ active }: { active: boolean }) {
  const allItems = SKILL_GROUPS.flatMap((g, gi) => g.items.map((item) => ({ item, gi })));
  const step = useLoop(allItems.length, 140, 1400, active);
  let counter = 0;
  return (
    <Card>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>Tools &amp; Skills</div>
      {SKILL_GROUPS.map((g, gi) => {
        const groupStart = counter;
        counter += g.items.length;
        return (
          <div key={g.label} style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: g.color, marginBottom: 7,
            }}>{g.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {g.items.map((item, ii) => {
                const idx = groupStart + ii;
                return (
                  <span key={item} style={{
                    background: g.color + "14",
                    border: `1.5px solid ${g.color}33`,
                    color: g.color, fontSize: 11, fontWeight: 600,
                    padding: "3px 11px", borderRadius: 9999,
                    opacity: step > idx ? 1 : 0,
                    transform: step > idx ? "scale(1)" : "scale(0.7)",
                    transition: "opacity 0.28s ease, transform 0.28s ease",
                  }}>
                    {item}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ── Section layout ────────────────────────────────────────────────────────────
type SectionDef = {
  num: string;
  title: string;
  desc: string;
  Viz: React.FC<{ active: boolean }>;
};

function Section({ s, idx, total }: { s: SectionDef; idx: number; total: number }) {
  const { ref, visible } = useReveal(0.18);
  const { Viz } = s;
  return (
    <div
      ref={ref}
      style={{
        display: "flex", alignItems: "center", gap: "4rem",
        padding: "5rem 0",
        borderBottom: idx < total - 1 ? "1px solid var(--border)" : "none",
      }}
    >
      {/* Left */}
      <div style={{
        flex: "0 0 300px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-28px)",
        transition: "opacity 0.7s ease 0.05s, transform 0.7s ease 0.05s",
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--muted)", marginBottom: 12,
        }}>{s.num}</p>
        <h2 style={{
          fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.25,
          color: "var(--text)", marginBottom: 14,
        }}>{s.title}</h2>
        <p style={{ fontSize: "0.87rem", color: "var(--muted)", lineHeight: 1.8 }}>
          {s.desc}
        </p>
      </div>

      {/* Right */}
      <div style={{
        flex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(36px)",
        transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
      }}>
        <Viz active={visible} />
      </div>
    </div>
  );
}

// ── Section data ──────────────────────────────────────────────────────────────
const SECTIONS: SectionDef[] = [
  {
    num: "01",
    title: "AI Documentation",
    desc: "I author API references, CLI guides, and developer docs for IBM Cloud — structuring content so LLMs and AI agents can consume it as easily as humans can.",
    Viz: AiDocViz,
  },
  {
    num: "02",
    title: "Docs Automation",
    desc: "Using Python and a local LLM, I automated obsolete content removal — cutting a 3-day manual review process down to 4 hours. CI/CD pipelines via Jenkins keep docs in sync with releases.",
    Viz: AutomationViz,
  },
  {
    num: "03",
    title: "Structured Content (DITA)",
    desc: "DITA/XML authoring with complex DITAVAL profiling to manage content across six IBM Power Server models from a single source — Power10 and Power11.",
    Viz: DitaViz,
  },
  {
    num: "04",
    title: "Open Source & Hackathons",
    desc: "Active contributor to FletX, Requestly, Ansible AMQ, and Terraform. Competed in IBM WatsonX Agentic AI Hackathon and Hacktoberfest to stay at the cutting edge.",
    Viz: OpenSourceViz,
  },
  {
    num: "05",
    title: "IBM — Information Developer",
    desc: "Sep 2022 — Present. Authoring IBM Cloud Power Virtual Server (Hybrid Cloud) and IBM Power10/11 Server hardware documentation. Leading AI-driven content workflows.",
    Viz: IbmViz,
  },
  {
    num: "06",
    title: "Xylem — Technical Documentation",
    desc: "2020 — 2022. End-to-end IoT documentation — Xylem Cloud, Xylem Visenti, IoT Gateways. Collaborated with developers to produce Swagger/OpenAPI docs in agile 2-week sprints.",
    Viz: XylemViz,
  },
  {
    num: "07",
    title: "Unisys — Information Developer",
    desc: "2017 — 2020. Full lifecycle documentation for ClearPath Forward! (Data Centre) and Digistics (Air Cargo). Delivered webhelp, admin guides, release notes, and installation guides.",
    Viz: UnisysViz,
  },
  {
    num: "08",
    title: "Skills & Tools",
    desc: "Across markup languages, authoring tools, CI/CD pipelines, and AI automation — a decade of hands-on technical writing tooling for enterprise-scale documentation.",
    Viz: SkillsViz,
  },
];

// ── Divider label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, padding: "3rem 0 0",
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const what = SECTIONS.slice(0, 4);
  const exp  = SECTIONS.slice(4, 7);
  const skills = SECTIONS.slice(7);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", padding: "5rem 1.5rem 1rem" }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "var(--muted)", marginBottom: 14,
        }}>
          Technical Writer · AI &amp; Cloud Documentation
        </p>
        <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.2rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.1 }}>
          Siddhartha Mani
        </h1>
        <p style={{
          marginTop: 16, fontSize: "0.9rem", color: "var(--muted)",
          maxWidth: 520, margin: "16px auto 0", lineHeight: 1.75,
        }}>
          I turn complex engineering and AI systems into clear, developer-focused documentation —
          structured so both humans and LLMs can consume it easily.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {[
            { label: "Hire me",     href: "mailto:mani.siddhartha@gmail.com" },
            { label: "Résumé",      href: "https://github.com/Siddharthablog/Resume" },
            { label: "LinkedIn",    href: "https://www.linkedin.com/in/siddhartha-mani-98696073/" },
          ].map(btn => (
            <a key={btn.label} href={btn.href}
              target={btn.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{
                padding: "10px 24px", borderRadius: 9999,
                background: "var(--text)", color: "var(--bg)",
                fontSize: "0.82rem", fontWeight: 700, textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.75")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1.5rem 6rem" }}>

        {/* What I do */}
        <SectionLabel label="What I do" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {what.map((s, i) => <Section key={s.num} s={s} idx={i} total={what.length} />)}

        {/* Experience */}
        <SectionLabel label="Where I worked" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {exp.map((s, i) => <Section key={s.num} s={s} idx={i} total={exp.length} />)}

        {/* Skills */}
        <SectionLabel label="Skills & Tools" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {skills.map((s, i) => <Section key={s.num} s={s} idx={i} total={skills.length} />)}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "2rem 1.5rem",
        borderTop: "1px solid var(--border)",
        fontSize: "0.78rem", color: "var(--muted)",
      }}>
        © 2025 Siddhartha Mani · mani.siddhartha@gmail.com
      </div>
    </div>
  );
}
