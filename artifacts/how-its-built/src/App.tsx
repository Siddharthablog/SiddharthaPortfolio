import { useEffect, useRef, useState } from "react";
import "./index.css";

// ── Reveal hook ───────────────────────────────────────────────────────────────
function useReveal(threshold = 0.18) {
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

/** Continuously loops 0 → max, resets, repeats */
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
    const t = setTimeout(run, 400);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return step;
}

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block",
      background: color + "15",
      border: `1.5px solid ${color}33`,
      color,
      fontSize: 10, fontWeight: 700,
      padding: "2px 9px", borderRadius: 9999,
      marginRight: 5, marginBottom: 5,
    }}>{label}</span>
  );
}

function MacBar({ filename }: { filename: string }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
      {["#ef4444","#f59e0b","#22c55e"].map(c => (
        <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
      ))}
      <span style={{ marginLeft: 8, fontSize: 10.5, color: "var(--muted)", fontFamily: "monospace" }}>{filename}</span>
    </div>
  );
}

// ── Section label divider ─────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "3.5rem 0 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.2em",
        textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WHAT I DO — animated viz cards
// ─────────────────────────────────────────────────────────────────────────────

// 01 AI Documentation
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
    <div className="card" style={{ padding: "1.5rem" }}>
      <MacBar filename="api-reference.md" />
      {DOC_LINES.map((l, i) => (
        <div key={i} style={{
          height: i === 0 ? 9 : 6,
          background: l.accent ? "linear-gradient(90deg,hsl(210,88%,52%),hsl(100,40%,44%))" : "hsl(40,8%,82%)",
          borderRadius: 4, marginBottom: 9,
          width: step > i ? `${l.w}%` : "0%",
          opacity: step > i ? 1 : 0,
          transition: "width 0.4s ease, opacity 0.35s ease",
        }} />
      ))}
      <div style={{
        fontSize: 11, fontFamily: "monospace", color: "hsl(100,40%,36%)", fontWeight: 600, marginTop: 8,
        opacity: step > DOC_LINES.length ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        ✦ LLM-optimised structure applied
      </div>
    </div>
  );
}

// 02 Docs Automation
const AUTO_STEPS = [
  { icon: "🔍", label: "Scan docs repo",      sub: "1,240 topics",      color: "hsl(210,88%,52%)" },
  { icon: "✦",  label: "LLM validation",       sub: "Local model",       color: "hsl(100,40%,44%)" },
  { icon: "✂",  label: "Remove stale content", sub: "312 flagged",        color: "hsl(40,90%,54%)"  },
  { icon: "🚀", label: "Jenkins publish",       sub: "Live in 4 hr",      color: "hsl(100,40%,44%)" },
];
function AutomationViz({ active }: { active: boolean }) {
  const step = useLoop(AUTO_STEPS.length + 1, 480, 1000, active);
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <MacBar filename="automation.py — running…" />
      {AUTO_STEPS.map((s, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 11, marginBottom: 11,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(20px)",
          transition: "opacity 0.38s ease, transform 0.38s ease",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: s.color + "1a", border: `1.5px solid ${s.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{s.label}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{s.sub}</span>
            </div>
            <div style={{ height: 4, background: "hsl(40,14%,88%)", borderRadius: 3, overflow: "hidden" }}>
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
    </div>
  );
}

// 03 DITA
const DITA_LINES = [
  { text: '<?xml version="1.0"?>',          color: "hsl(40,8%,60%)",    indent: 0 },
  { text: '<concept id="power-server">',     color: "hsl(210,88%,52%)",  indent: 0 },
  { text: "<title>",                         color: "hsl(100,40%,44%)",  indent: 1 },
  { text: "  IBM Power10 Server Guide",      color: "hsl(40,10%,30%)",   indent: 2 },
  { text: "</title>",                        color: "hsl(100,40%,44%)",  indent: 1 },
  { text: "<conbody>",                       color: "hsl(210,88%,52%)",  indent: 1 },
  { text: '  <p audience="admin">…</p>',    color: "hsl(40,10%,30%)",   indent: 2 },
  { text: '  <p audience="dev">…</p>',      color: "hsl(40,10%,30%)",   indent: 2 },
  { text: "</conbody>",                      color: "hsl(210,88%,52%)",  indent: 1 },
  { text: "</concept>",                      color: "hsl(210,88%,52%)",  indent: 0 },
];
function DitaViz({ active }: { active: boolean }) {
  const step = useLoop(DITA_LINES.length + 1, 130, 1400, active);
  return (
    <div className="card" style={{ padding: "1.5rem", fontFamily: "monospace" }}>
      <MacBar filename="power-server.dita — DITAVAL active" />
      <div style={{ fontSize: 11, lineHeight: 1.9 }}>
        {DITA_LINES.map((t, i) => (
          <div key={i} style={{
            paddingLeft: t.indent * 14, color: t.color,
            opacity: step > i ? 1 : 0,
            transform: step > i ? "translateX(0)" : "translateX(-12px)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}>{t.text}</div>
        ))}
      </div>
      <div style={{
        marginTop: 10, fontSize: 10, fontWeight: 600, color: "hsl(210,88%,44%)", fontFamily: "sans-serif",
        opacity: step > DITA_LINES.length ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        ✓ 6 Power Server models · single source
      </div>
    </div>
  );
}

// 04 Open Source
const OS_PROJECTS = [
  { name: "FletX",        color: "hsl(210,88%,52%)" },
  { name: "Requestly",    color: "hsl(100,40%,44%)" },
  { name: "Ansible AMQ",  color: "hsl(40,90%,52%)"  },
  { name: "Terraform",    color: "hsl(260,60%,58%)"  },
  { name: "WatsonX AI",   color: "hsl(100,40%,44%)" },
  { name: "Link Checker", color: "hsl(210,88%,52%)" },
];
function OpenSourceViz({ active }: { active: boolean }) {
  const step = useLoop(OS_PROJECTS.length + 2, 300, 1200, active);
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>Contributions &amp; Hackathons</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {OS_PROJECTS.map((p, i) => (
          <span key={p.name} style={{
            background: p.color + "18", border: `1.5px solid ${p.color}44`,
            color: p.color, fontSize: 12, fontWeight: 600,
            padding: "4px 13px", borderRadius: 9999,
            opacity: step > i ? 1 : 0,
            transform: step > i ? "scale(1)" : "scale(0.6)",
            transition: "opacity 0.26s ease, transform 0.26s ease",
          }}>{p.name}</span>
        ))}
      </div>
      {[
        { icon: "🏆", text: "Hacktoberfest contributor" },
        { icon: "⚡", text: "IBM WatsonX Agentic AI Hackathon" },
      ].map((item, i) => (
        <div key={item.text} style={{
          display: "flex", gap: 7, alignItems: "center", marginBottom: 6,
          opacity: step > OS_PROJECTS.length + i ? 1 : 0,
          transform: step > OS_PROJECTS.length + i ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.32s ease, transform 0.32s ease",
        }}>
          <span style={{ fontSize: 14 }}>{item.icon}</span>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE — company cards with responsibilities animation
// ─────────────────────────────────────────────────────────────────────────────

const IBM_RESP = [
  "Author API, CLI, and developer guides for IBM Cloud",
  "Collaborate with AI Docs architects to optimise content for LLM consumption",
  "Automated stale content removal with Python + local LLM → 3 days to 4 hours",
  "Develop IBM Power Server component docs and troubleshooting guides",
  "Apply DITAVAL profiling across 6 IBM Power Server hardware models",
  "Perform peer reviews and quality checks across multiple cloud & hardware projects",
  "Coordinate with engineering, product, and UX teams per release cycle",
  "Mentor junior writers on IBM Style Guide and content best practices",
  "Participate in Hacktoberfest and open-source documentation initiatives",
  "Integrate AI-driven content validation and metadata tagging in doc workflows",
];

function IbmViz({ active }: { active: boolean }) {
  const step = useLoop(IBM_RESP.length, 400, 1400, active);
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <MacBar filename="ibm-responsibilities.md" />
      {IBM_RESP.map((b, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(16px)",
          transition: "opacity 0.32s ease, transform 0.32s ease",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 6,
            background: step === i + 1 ? "hsl(100,40%,44%)" : "hsl(100,40%,44%,0.4)",
            boxShadow: step === i + 1 ? "0 0 0 3px hsl(100,40%,44%,0.2)" : "none",
            transition: "box-shadow 0.3s",
          }} />
          <span style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

const XYLEM_RESP = [
  "End-to-end IoT solution documentation: IoT Cloud, Applications, Gateways",
  "Worked with developers in source code to produce Swagger/OpenAPI documentation",
  "Operated in two-week agile sprint cycles",
  "Delivered: API docs, Developer Guide, Integration Guide, SDK docs",
  "Delivered: Release Notes and UAT Guide",
  "Projects — Xylem Cloud (IoT Cloud) · Xylem Visenti (IoT Software)",
];
function XylemViz({ active }: { active: boolean }) {
  const step = useLoop(XYLEM_RESP.length, 450, 1200, active);
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <MacBar filename="xylem-responsibilities.md" />
      {XYLEM_RESP.map((b, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(16px)",
          transition: "opacity 0.32s ease, transform 0.32s ease",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 6,
            background: step === i + 1 ? "hsl(200,80%,44%)" : "hsl(200,80%,44%,0.38)",
            boxShadow: step === i + 1 ? "0 0 0 3px hsl(200,80%,44%,0.18)" : "none",
            transition: "box-shadow 0.3s",
          }} />
          <span style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

const UNISYS_RESP = [
  "End-to-end documentation: information gathering, planning, content analysis, execution, testing, delivery",
  "Created docs for Fabric Computing Manager (Data Centre Monitoring) — ClearPath Forward!",
  "Created docs for Digistics (Transportation / Air Cargo Management) software",
  "Analysed user stories and updated webhelp accordingly",
  "Created DITAVAL files in XML for generating client-specific webhelp variants",
  "Deliverables: Webhelp, Admin & Operational Guide, Release Notes, Installation Guide",
];
function UnisysViz({ active }: { active: boolean }) {
  const step = useLoop(UNISYS_RESP.length, 450, 1200, active);
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <MacBar filename="unisys-responsibilities.md" />
      {UNISYS_RESP.map((b, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8,
          opacity: step > i ? 1 : 0,
          transform: step > i ? "translateX(0)" : "translateX(16px)",
          transition: "opacity 0.32s ease, transform 0.32s ease",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 6,
            background: step === i + 1 ? "hsl(260,55%,55%)" : "hsl(260,55%,55%,0.38)",
            boxShadow: step === i + 1 ? "0 0 0 3px hsl(260,55%,55%,0.18)" : "none",
            transition: "box-shadow 0.3s",
          }} />
          <span style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILLS animated viz
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_GROUPS = [
  { label: "Markup Languages",  color: "hsl(210,88%,52%)", items: ["DITA","XML","Markdown","YAML","JSON","reStructuredText"] },
  { label: "Authoring Tools",   color: "hsl(100,40%,44%)", items: ["Oxygen XML Editor","VS Code","Acrolinx","Confluence","Astoria CCMS"] },
  { label: "CI/CD & DevOps",    color: "hsl(40,90%,52%)",  items: ["Jenkins","Git","JIRA","Swagger","Postman"] },
  { label: "AI & Automation",   color: "hsl(260,60%,55%)", items: ["Python","LangChain","Local LLMs","RAG","Vibe Coding"] },
  { label: "Graphics & Media",  color: "hsl(0,70%,55%)",   items: ["draw.io","Camtasia","PowerPoint GIFs"] },
];
function SkillsViz({ active }: { active: boolean }) {
  const allCount = SKILL_GROUPS.reduce((s, g) => s + g.items.length, 0);
  const step = useLoop(allCount, 110, 1600, active);
  let idx = 0;
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      {SKILL_GROUPS.map((g) => {
        const start = idx;
        idx += g.items.length;
        return (
          <div key={g.label} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.1em", color: g.color, marginBottom: 6,
            }}>{g.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {g.items.map((item, ii) => {
                const pos = start + ii;
                return (
                  <span key={item} style={{
                    background: g.color + "14", border: `1.5px solid ${g.color}30`,
                    color: g.color, fontSize: 10.5, fontWeight: 600,
                    padding: "2px 10px", borderRadius: 9999,
                    marginRight: 5, marginBottom: 5,
                    opacity: step > pos ? 1 : 0,
                    transform: step > pos ? "scale(1)" : "scale(0.65)",
                    transition: "opacity 0.24s ease, transform 0.24s ease",
                  }}>{item}</span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic section row (left text + right viz)
// ─────────────────────────────────────────────────────────────────────────────
type RowDef = { num?: string; title: string; desc: React.ReactNode; Viz: React.FC<{ active: boolean }> };

function Row({ r, last }: { r: RowDef; last: boolean }) {
  const { ref, visible } = useReveal(0.16);
  const { Viz } = r;
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "flex-start", gap: "3.5rem",
      padding: "4.5rem 0",
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      {/* Left */}
      <div style={{
        flex: "0 0 290px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-26px)",
        transition: "opacity 0.65s ease 0.05s, transform 0.65s ease 0.05s",
      }}>
        {r.num && (
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--muted)", marginBottom: 10,
          }}>{r.num}</p>
        )}
        <h2 style={{ fontSize: "1.38rem", fontWeight: 800, lineHeight: 1.25, color: "var(--text)", marginBottom: 12 }}>
          {r.title}
        </h2>
        <div style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8 }}>
          {r.desc}
        </div>
      </div>

      {/* Right */}
      <div style={{
        flex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(30px)",
        transition: "opacity 0.65s ease 0.18s, transform 0.65s ease 0.18s",
      }}>
        <Viz active={visible} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK HIGHLIGHTS section
// ─────────────────────────────────────────────────────────────────────────────
const HIGHLIGHTS = [
  {
    icon: "🤖",
    title: "AI Documentation",
    items: ["RAG systems","Prompt templates","LLM integration docs"],
    color: "hsl(210,88%,52%)",
  },
  {
    icon: "📄",
    title: "Structured Content",
    items: ["DITA · XML","Markdown · YAML","reStructuredText · CCMS"],
    color: "hsl(100,40%,44%)",
  },
  {
    icon: "⚙️",
    title: "Automation & Tools",
    items: ["Python · LangChain","Jenkins · Postman","Vibe Coding"],
    color: "hsl(40,90%,52%)",
  },
  {
    icon: "🎓",
    title: "Certifications",
    items: ["AI Complete Bootcamp","Technical Writing","Docker · Hybrid Cloud"],
    color: "hsl(260,60%,55%)",
  },
  {
    icon: "⚡",
    title: "Hackathons",
    items: ["WatsonX Agentic AI","Link Checker Extension","Hacktoberfest"],
    color: "hsl(40,90%,48%)",
  },
  {
    icon: "🐙",
    title: "Open Source Docs",
    items: ["FletX · Requestly","Ansible AMQ · Terraform","WatsonX AI"],
    color: "hsl(100,40%,44%)",
  },
];

function QuickHighlights() {
  const { ref, visible } = useReveal(0.15);
  return (
    <div ref={ref} style={{
      background: "white",
      border: "1px solid var(--border)",
      borderRadius: "1.2rem",
      padding: "2rem 2rem 1.5rem",
      marginTop: "3rem",
      boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
    }}>
      <h3 style={{
        fontSize: 13, fontWeight: 800, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--muted)", marginBottom: 20,
      }}>Quick Highlights</h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1.25rem",
      }}>
        {HIGHLIGHTS.map((h, i) => (
          <div key={h.title} style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: h.color + "14", border: `1.5px solid ${h.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>{h.icon}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{h.title}</div>
              {h.items.map(item => (
                <div key={item} style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.7 }}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const WHAT: RowDef[] = [
    {
      num: "01", title: "AI Documentation",
      desc: "I author API references, CLI guides, and developer docs for IBM Cloud — structuring content so LLMs and AI agents can consume it as easily as humans can.",
      Viz: AiDocViz,
    },
    {
      num: "02", title: "Docs Automation",
      desc: "Using Python and a local LLM, I automated obsolete content removal — cutting a 3-day manual review process down to 4 hours. CI/CD pipelines via Jenkins keep docs in sync with releases.",
      Viz: AutomationViz,
    },
    {
      num: "03", title: "Structured Content (DITA)",
      desc: "DITA/XML authoring with complex DITAVAL profiling to manage content across six IBM Power Server models from a single source — ensuring accuracy across every variant.",
      Viz: DitaViz,
    },
    {
      num: "04", title: "Open Source & Hackathons",
      desc: "Active contributor to FletX, Requestly, Ansible AMQ, and Terraform. Competed in IBM WatsonX Agentic AI Hackathon and Hacktoberfest to stay at the cutting edge.",
      Viz: OpenSourceViz,
    },
  ];

  const EXP: RowDef[] = [
    {
      title: "IBM — Information Developer",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>Sep 2022 — Present</strong>
          IBM Cloud Power Virtual Server <em style={{ color: "hsl(210,88%,50%)" }}>(Hybrid Cloud)</em> ·
          IBM Power10 &amp; Power11 Server hardware
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Projects:</strong><br />
            • IBM Cloud: Power Virtual Server <Tag label="Hybrid Cloud" color="hsl(210,88%,52%)" /><br />
            • IBM Server <Tag label="Power10" color="hsl(100,40%,44%)" /><Tag label="Power11" color="hsl(100,40%,44%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Skills:</strong><br />
            <Tag label="DITA" color="hsl(210,88%,52%)" />
            <Tag label="XML" color="hsl(210,88%,52%)" />
            <Tag label="Markdown" color="hsl(210,88%,52%)" />
            <Tag label="YAML" color="hsl(210,88%,52%)" />
            <Tag label="JSON" color="hsl(210,88%,52%)" />
            <Tag label="Oxygen XML" color="hsl(100,40%,44%)" />
            <Tag label="Acrolinx" color="hsl(100,40%,44%)" />
            <Tag label="VS Code" color="hsl(100,40%,44%)" />
            <Tag label="Jenkins" color="hsl(40,90%,50%)" />
            <Tag label="Git" color="hsl(40,90%,50%)" />
            <Tag label="JIRA" color="hsl(40,90%,50%)" />
            <Tag label="draw.io" color="hsl(0,65%,52%)" />
            <Tag label="Camtasia" color="hsl(0,65%,52%)" />
          </div>
        </>
      ),
      Viz: IbmViz,
    },
    {
      title: "Xylem — Technical Documentation",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>2020 — 2022</strong>
          End-to-end IoT documentation for IoT Cloud, Applications, and Gateways in two-week agile sprints.
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Projects:</strong><br />
            • Xylem Cloud <Tag label="IoT Cloud" color="hsl(200,80%,44%)" /><br />
            • Xylem Visenti <Tag label="IoT Software" color="hsl(200,80%,44%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Skills:</strong><br />
            <Tag label="Confluence" color="hsl(200,80%,44%)" />
            <Tag label="Astoria CCMS" color="hsl(200,80%,44%)" />
            <Tag label="Swagger" color="hsl(200,80%,44%)" />
            <Tag label="JIRA" color="hsl(200,80%,44%)" />
            <Tag label="Acrolinx" color="hsl(200,80%,44%)" />
            <Tag label="IoT Cloud" color="hsl(200,80%,44%)" />
          </div>
        </>
      ),
      Viz: XylemViz,
    },
    {
      title: "Unisys — Information Developer",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>2017 — 2020</strong>
          Full lifecycle documentation for data centre and logistics software products.
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Projects:</strong><br />
            • ClearPath Forward! <Tag label="Data Centre Management" color="hsl(260,55%,55%)" /><br />
            • Digistics <Tag label="Air Cargo Management" color="hsl(260,55%,55%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Skills:</strong><br />
            <Tag label="XML" color="hsl(260,55%,55%)" />
            <Tag label="DITA" color="hsl(260,55%,55%)" />
            <Tag label="Oxygen XML" color="hsl(260,55%,55%)" />
            <Tag label="DITAVAL" color="hsl(260,55%,55%)" />
          </div>
        </>
      ),
      Viz: UnisysViz,
    },
  ];

  const SKILLS: RowDef[] = [
    {
      title: "Skills & Tools",
      desc: "Across markup languages, authoring environments, CI/CD pipelines, and AI automation — a decade of hands-on technical writing tooling for enterprise-scale documentation.",
      Viz: SkillsViz,
    },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", padding: "5rem 1.5rem 0" }}>
        <p style={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "var(--muted)", marginBottom: 12,
        }}>Technical Writer · AI &amp; Cloud Documentation</p>
        <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.2rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.1 }}>
          Siddhartha Mani
        </h1>
        <p style={{
          marginTop: 14, fontSize: "0.88rem", color: "var(--muted)",
          maxWidth: 500, margin: "14px auto 0", lineHeight: 1.8,
        }}>
          I turn complex engineering and AI systems into clear, developer-focused documentation —
          structured so both humans and LLMs can consume it easily.
          <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
            Open to: Remote &amp; Full-time
          </span>
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "Hire me",  href: "mailto:mani.siddhartha@gmail.com" },
            { label: "Résumé",   href: "https://github.com/Siddharthablog/Resume" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/siddhartha-mani-98696073/" },
          ].map(btn => (
            <a key={btn.label} href={btn.href}
              target={btn.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{
                padding: "10px 22px", borderRadius: 9999,
                background: "var(--text)", color: "var(--bg)",
                fontSize: "0.82rem", fontWeight: 700, textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.75")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >{btn.label}</a>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 1.5rem 6rem" }}>

        {/* Quick Highlights */}
        <QuickHighlights />

        {/* What I do */}
        <SectionLabel label="What I do" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {WHAT.map((r, i) => <Row key={r.title} r={r} last={i === WHAT.length - 1} />)}

        {/* Experience */}
        <SectionLabel label="Professional Experience" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {EXP.map((r, i) => <Row key={r.title} r={r} last={i === EXP.length - 1} />)}

        {/* Skills */}
        <SectionLabel label="Skills & Tools" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {SKILLS.map((r, i) => <Row key={r.title} r={r} last={i === SKILLS.length - 1} />)}

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
