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
// WHAT I DELIVER — 2×2 capability card grid
// ─────────────────────────────────────────────────────────────────────────────

/** Counts up from 0 to `target` over ~800ms once `active` is true */
function useCounter(target: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    let start = 0;
    const step = Math.ceil(target / 28);
    const iv = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(iv); }
      else setVal(start);
    }, 28);
    return () => clearInterval(iv);
  }, [active, target]);
  return val;
}

type Capability = {
  icon: string;
  color: string;
  metricNum: number;
  metricSuffix: string;
  metricLabel: string;
  headline: string;
  desc: string;
  tags: string[];
  deliverables: string[];
};

const CAPABILITIES: Capability[] = [
  {
    icon: "📝",
    color: "hsl(210,88%,52%)",
    metricNum: 7,
    metricSuffix: "+",
    metricLabel: "IBM Cloud products",
    headline: "Documentation LLMs can actually read",
    desc: "API references, CLI guides, and developer docs for IBM Cloud — structured so AI agents and human readers get the same high-quality experience.",
    tags: ["API Docs","CLI Guides","Developer Guides","RAG"],
    deliverables: ["Getting Started Guide","API Reference","CLI Reference","Troubleshooting Guide"],
  },
  {
    icon: "⚡",
    color: "hsl(100,40%,44%)",
    metricNum: 18,
    metricSuffix: "×",
    metricLabel: "faster than manual review",
    headline: "Automation that eliminates the manual grind",
    desc: "Python + local LLM detects and removes stale content. Jenkins CI/CD keeps docs in perfect sync with every release — no backlog, no drift.",
    tags: ["Python","LangChain","Jenkins","CI/CD"],
    deliverables: ["Stale Content Scanner","LLM Validation Script","Jenkins Pipeline","Release Automation"],
  },
  {
    icon: "🗂",
    color: "hsl(40,90%,52%)",
    metricNum: 6,
    metricSuffix: "",
    metricLabel: "server models, 1 source",
    headline: "One source. Every audience. Perfect accuracy.",
    desc: "DITA/XML with DITAVAL profiling across IBM Power10 and Power11 server variants — zero content duplication, six unique deliverables from a single source.",
    tags: ["DITA","XML","DITAVAL","Oxygen XML"],
    deliverables: ["Power10 Admin Guide","Power11 Admin Guide","Webhelp","Release Notes"],
  },
  {
    icon: "🏆",
    color: "hsl(260,60%,55%)",
    metricNum: 4,
    metricSuffix: " projects",
    metricLabel: "+ 2 hackathons",
    headline: "Always building beyond the day job",
    desc: "Active contributor to FletX, Requestly, Ansible AMQ, and Terraform. Competed in WatsonX Agentic AI Hackathon and Hacktoberfest to stay at the cutting edge.",
    tags: ["FletX","Requestly","Ansible AMQ","Terraform"],
    deliverables: ["OSS Contribution Docs","Hackathon Projects","Link Checker Extension","WatsonX AI Docs"],
  },
];

function CapabilityCard({ cap, idx, visible }: { cap: Capability; idx: number; visible: boolean }) {
  const count = useCounter(cap.metricNum, visible);
  const step = useLoop(cap.deliverables.length, 480, 1400, visible);

  return (
    <div style={{
      background: "white",
      border: "1px solid var(--border)",
      borderRadius: "1rem",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${idx * 0.12}s, transform 0.6s ease ${idx * 0.12}s`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
    }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: cap.color, borderRadius: "1rem 1rem 0 0" }} />

      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Top row: icon + metric */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: cap.color + "14", border: `1.5px solid ${cap.color}28`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>{cap.icon}</div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: "1.9rem", fontWeight: 900, lineHeight: 1,
              color: cap.color, letterSpacing: "-0.03em",
            }}>
              {count}{cap.metricSuffix}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {cap.metricLabel}
            </div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h3 style={{
            fontSize: "1rem", fontWeight: 800, lineHeight: 1.3,
            color: "var(--text)", marginBottom: 7,
          }}>{cap.headline}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.75 }}>
            {cap.desc}
          </p>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {cap.tags.map(t => (
            <span key={t} style={{
              background: cap.color + "12",
              border: `1.5px solid ${cap.color}28`,
              color: cap.color, fontSize: 10, fontWeight: 700,
              padding: "2px 9px", borderRadius: 9999,
            }}>{t}</span>
          ))}
        </div>

        {/* Deliverables: animated list */}
        <div style={{
          background: "hsl(45,22%,97%)",
          border: "1px solid var(--border)",
          borderRadius: 8, padding: "0.75rem 1rem",
          marginTop: "auto",
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 7 }}>
            Deliverables
          </div>
          {cap.deliverables.map((d, i) => (
            <div key={d} style={{
              display: "flex", alignItems: "center", gap: 7, marginBottom: 5,
              opacity: step > i ? 1 : 0,
              transform: step > i ? "translateX(0)" : "translateX(10px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: step === i + 1 ? cap.color : cap.color + "55",
                boxShadow: step === i + 1 ? `0 0 0 3px ${cap.color}22` : "none",
                transition: "box-shadow 0.3s",
              }} />
              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{d}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function WhatIDeliver() {
  const { ref, visible } = useReveal(0.12);
  return (
    <div ref={ref} style={{ padding: "4rem 0 0" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "1.25rem",
      }}>
        {CAPABILITIES.map((cap, i) => (
          <CapabilityCard key={cap.headline} cap={cap} idx={i} visible={visible} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE — company cards with responsibilities animation
// ─────────────────────────────────────────────────────────────────────────────

// ── Reusable responsibilities card with play/pause ───────────────────────────
function ResponsibilitiesViz({
  items, color,
}: { items: string[]; color: string }) {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setActive(a => (a + 1) % items.length);
    }, 1800);
    return () => clearInterval(iv);
  }, [paused, items.length]);

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.14em", color: "var(--muted)",
        }}>Responsibilities</span>
        <button
          onClick={() => setPaused(p => !p)}
          title={paused ? "Resume" : "Pause"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: paused ? color + "15" : "hsl(40,14%,92%)",
            border: `1.5px solid ${paused ? color + "44" : "var(--border)"}`,
            borderRadius: 9999, padding: "4px 12px",
            fontSize: 11, fontWeight: 700,
            color: paused ? color : "var(--muted)",
            cursor: "pointer", transition: "all 0.2s ease",
          }}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      {/* All bullets — always visible, active one highlighted */}
      {items.map((b, i) => (
        <div key={i} style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          padding: "6px 8px", borderRadius: 8,
          background: active === i ? color + "0d" : "transparent",
          transition: "background 0.45s ease",
          marginBottom: 2,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 5,
            background: active === i ? color : color + "38",
            boxShadow: active === i ? `0 0 0 3px ${color}22` : "none",
            transition: "background 0.4s ease, box-shadow 0.4s ease",
          }} />
          <span style={{
            fontSize: 12, lineHeight: 1.65,
            color: active === i ? "var(--text)" : "var(--muted)",
            fontWeight: active === i ? 600 : 400,
            transition: "color 0.4s ease, font-weight 0.3s ease",
          }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

// ── Company-specific data ─────────────────────────────────────────────────────
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
function IbmViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={IBM_RESP} color="hsl(210,88%,52%)" />; }

const XYLEM_RESP = [
  "End-to-end IoT solution documentation: IoT Cloud, Applications, Gateways",
  "Worked with developers in source code to produce Swagger/OpenAPI documentation",
  "Operated in two-week agile sprint cycles",
  "Delivered API docs, Developer Guide, Integration Guide, SDK docs",
  "Delivered Release Notes and UAT Guide",
  "Projects — Xylem Cloud (IoT Cloud) · Xylem Visenti (IoT Software)",
];
function XylemViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={XYLEM_RESP} color="hsl(200,80%,44%)" />; }

const UNISYS_RESP = [
  "End-to-end documentation: information gathering, planning, content analysis, execution, testing, delivery",
  "Created docs for Fabric Computing Manager (Data Centre Monitoring) — ClearPath Forward!",
  "Created docs for Digistics (Transportation / Air Cargo Management) software",
  "Analysed user stories and updated webhelp accordingly",
  "Created DITAVAL files in XML for generating client-specific webhelp variants",
  "Deliverables: Webhelp, Admin & Operational Guide, Release Notes, Installation Guide",
];
function UnisysViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={UNISYS_RESP} color="hsl(260,55%,55%)" />; }

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

        {/* Skills */}
        <SectionLabel label="Skills & Tools" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {SKILLS.map((r, i) => <Row key={r.title} r={r} last={i === SKILLS.length - 1} />)}

        {/* Experience */}
        <SectionLabel label="Professional Experience" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        {EXP.map((r, i) => <Row key={r.title} r={r} last={i === EXP.length - 1} />)}

        {/* What I Deliver — at end */}
        <SectionLabel label="What I Deliver" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        <WhatIDeliver />

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
