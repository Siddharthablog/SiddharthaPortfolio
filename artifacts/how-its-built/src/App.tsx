import { useEffect, useRef, useState } from "react";
import "./index.css";

// ── Intersection reveal hook ──────────────────────────────────────────────────
function useReveal(threshold = 0.28) {
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

// ── Animated card 1: AI Documentation ─────────────────────────────────────────
function AiDocViz({ active }: { active: boolean }) {
  const lines = [
    { w: 88, label: "# Getting Started with IBM Cloud API", bold: true },
    { w: 60, label: "Base URL: https://api.cloud.ibm.com" },
    { w: 78, label: "## Authentication" },
    { w: 92, label: "POST /v1/iam/token  →  Bearer token" },
    { w: 55, label: "## Endpoints" },
    { w: 82, label: "GET  /v2/resource-instances" },
    { w: 71, label: "POST /v2/resource-instances  →  201 Created" },
  ];

  return (
    <div className="card" style={{ padding: "1.5rem", width: "100%" }}>
      {/* Editor chrome */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
        {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
          api-reference.md
        </span>
      </div>

      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            height: l.bold ? 9 : 6,
            background: l.bold
              ? "linear-gradient(90deg, hsl(210,88%,52%), hsl(100,40%,44%))"
              : i % 3 === 0
              ? "hsl(100,40%,44%)"
              : "hsl(40,8%,80%)",
            borderRadius: 4,
            marginBottom: 9,
            width: active ? `${l.w}%` : "0%",
            opacity: active ? 1 : 0,
            transition: `width 0.55s ease ${i * 0.11}s, opacity 0.4s ease ${i * 0.11}s`,
          }}
        />
      ))}

      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          fontFamily: "monospace",
          color: "hsl(100,40%,38%)",
          fontWeight: 600,
          opacity: active ? 1 : 0,
          transition: "opacity 0.5s ease 1s",
        }}
      >
        ✦ LLM-optimised structure applied
      </div>
    </div>
  );
}

// ── Animated card 2: Docs Automation ──────────────────────────────────────────
function AutomationViz({ active }: { active: boolean }) {
  const steps = [
    { icon: "🔍", label: "Scan docs repo", sub: "1,240 topics found", color: "hsl(210,88%,52%)" },
    { icon: "✦",  label: "LLM validation", sub: "Local model review",  color: "hsl(100,40%,44%)" },
    { icon: "✂",  label: "Remove stale content", sub: "312 topics flagged", color: "hsl(40,90%,56%)" },
    { icon: "🚀", label: "Publish pipeline", sub: "Jenkins → live in 4 hr", color: "hsl(100,40%,44%)" },
  ];

  return (
    <div className="card" style={{ padding: "1.5rem", width: "100%" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14, fontFamily: "monospace" }}>
        automation.py — running…
      </div>

      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            opacity: active ? 1 : 0,
            transform: active ? "translateX(0)" : "translateX(24px)",
            transition: `opacity 0.45s ease ${i * 0.2}s, transform 0.45s ease ${i * 0.2}s`,
          }}
        >
          {/* icon bubble */}
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: s.color + "1a",
            border: `1.5px solid ${s.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>
            {s.icon}
          </div>

          {/* progress bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{s.label}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{s.sub}</span>
            </div>
            <div style={{ height: 5, background: "hsl(40,14%,88%)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: s.color,
                borderRadius: 3,
                width: active ? "100%" : "0%",
                transition: `width 0.6s ease ${i * 0.2 + 0.25}s`,
              }} />
            </div>
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 6, fontSize: 11, fontWeight: 700,
        color: "hsl(100,40%,38%)", fontFamily: "monospace",
        opacity: active ? 1 : 0, transition: "opacity 0.5s ease 1.2s",
      }}>
        ✓  3-day manual process → 4 hours
      </div>
    </div>
  );
}

// ── Animated card 3: Structured Content (DITA) ────────────────────────────────
function DitaViz({ active }: { active: boolean }) {
  const tokens = [
    { text: "<?xml version=\"1.0\"?>",             color: "hsl(40,8%,60%)",  indent: 0 },
    { text: "<concept id=\"power-server\">",        color: "hsl(210,88%,52%)", indent: 0 },
    { text: "  <title>",                            color: "hsl(100,40%,44%)", indent: 1 },
    { text: "    IBM Power10 Server Guide",         color: "hsl(40,10%,30%)",  indent: 2 },
    { text: "  </title>",                           color: "hsl(100,40%,44%)", indent: 1 },
    { text: "  <conbody>",                          color: "hsl(210,88%,52%)", indent: 1 },
    { text: "    <p audience=\"admin\">…</p>",      color: "hsl(40,10%,30%)",  indent: 2 },
    { text: "    <p audience=\"dev\">…</p>",        color: "hsl(40,10%,30%)",  indent: 2 },
    { text: "  </conbody>",                         color: "hsl(210,88%,52%)", indent: 1 },
    { text: "</concept>",                           color: "hsl(210,88%,52%)", indent: 0 },
  ];

  return (
    <div className="card" style={{ padding: "1.5rem", width: "100%" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14, fontFamily: "monospace" }}>
        power-server.dita — DITAVAL profiling active
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.85 }}>
        {tokens.map((t, i) => (
          <div
            key={i}
            style={{
              paddingLeft: t.indent * 14,
              color: t.color,
              opacity: active ? 1 : 0,
              transform: active ? "translateX(0)" : "translateX(-14px)",
              transition: `opacity 0.32s ease ${i * 0.1}s, transform 0.32s ease ${i * 0.1}s`,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, fontSize: 10, fontWeight: 600,
        color: "hsl(210,88%,44%)", fontFamily: "monospace",
        opacity: active ? 1 : 0, transition: "opacity 0.5s ease 1.2s",
      }}>
        ✓ 6 Power Server models · single source
      </div>
    </div>
  );
}

// ── Animated card 4: Open Source & Hackathon ──────────────────────────────────
function OpenSourceViz({ active }: { active: boolean }) {
  const projects = [
    { name: "FletX",         color: "hsl(210,88%,52%)" },
    { name: "Requestly",     color: "hsl(100,40%,44%)" },
    { name: "Ansible AMQ",   color: "hsl(40,90%,52%)"  },
    { name: "Terraform",     color: "hsl(260,60%,58%)"  },
    { name: "WatsonX AI",    color: "hsl(100,40%,44%)" },
    { name: "Link Checker",  color: "hsl(210,88%,52%)" },
  ];

  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setCount(i);
      if (i >= projects.length) clearInterval(t);
    }, 300);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="card" style={{ padding: "1.5rem", width: "100%" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>
        Contributions &amp; Hackathons
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {projects.map((p, i) => (
          <span
            key={p.name}
            style={{
              background: p.color + "18",
              border: `1.5px solid ${p.color}44`,
              color: p.color,
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: 9999,
              opacity: count > i ? 1 : 0,
              transform: count > i ? "scale(1)" : "scale(0.6)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            {p.name}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          opacity: active && count >= projects.length ? 1 : 0,
          transition: "opacity 0.5s ease 0.2s",
        }}
      >
        {[
          { icon: "🏆", text: "Hacktoberfest contributor" },
          { icon: "⚡", text: "IBM WatsonX Agentic AI Hackathon" },
        ].map((item) => (
          <div key={item.text} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section component ─────────────────────────────────────────────────────────
const SECTIONS = [
  {
    num: "01",
    title: "AI Documentation",
    desc: "I author API references, CLI guides, and developer docs for IBM Cloud — structuring content so that LLMs and AI agents can consume it as easily as humans can.",
    Viz: AiDocViz,
  },
  {
    num: "02",
    title: "Docs Automation",
    desc: "Using Python and a local LLM, I automated obsolete content removal — cutting a 3-day manual review process down to 4 hours. CI/CD pipelines via Jenkins keep docs always in sync with releases.",
    Viz: AutomationViz,
  },
  {
    num: "03",
    title: "Structured Content (DITA)",
    desc: "DITA/XML authoring with complex DITAVAL profiling to manage content across six IBM Power Server models from a single source — ensuring accuracy across every variant.",
    Viz: DitaViz,
  },
  {
    num: "04",
    title: "Open Source & Hackathons",
    desc: "I contribute to open-source projects including FletX, Requestly, Ansible AMQ, and Terraform, and compete in hackathons like IBM WatsonX Agentic AI to stay at the cutting edge.",
    Viz: OpenSourceViz,
  },
];

function Section({ section, index }: { section: typeof SECTIONS[0]; index: number }) {
  const { ref, visible } = useReveal(0.22);
  const { Viz } = section;

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: index % 2 === 0 ? "row" : "row",
        alignItems: "center",
        gap: "4rem",
        padding: "5rem 0",
        borderBottom: index < SECTIONS.length - 1 ? "1px solid var(--border)" : "none",
      }}
    >
      {/* ── Left: text ── */}
      <div
        style={{
          flex: "0 0 340px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-28px)",
          transition: "opacity 0.7s ease 0.05s, transform 0.7s ease 0.05s",
        }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--muted)", marginBottom: 12,
        }}>
          {section.num}
        </p>
        <h2 style={{
          fontSize: "1.55rem", fontWeight: 800, lineHeight: 1.25,
          color: "var(--text)", marginBottom: 14,
        }}>
          {section.title}
        </h2>
        <p style={{
          fontSize: "0.88rem", color: "var(--muted)",
          lineHeight: 1.78, maxWidth: 320,
        }}>
          {section.desc}
        </p>
      </div>

      {/* ── Right: animated card ── */}
      <div
        style={{
          flex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(36px)",
          transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
        }}
      >
        <Viz active={visible} />
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "5rem 1.5rem 1rem" }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "var(--muted)", marginBottom: 14,
        }}>
          Technical Writer · AI &amp; Cloud Documentation
        </p>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 900, color: "var(--text)", lineHeight: 1.1,
        }}>
          Siddhartha Mani
        </h1>
        <p style={{
          marginTop: 16, fontSize: "0.9rem", color: "var(--muted)",
          maxWidth: 520, margin: "16px auto 0",
          lineHeight: 1.7,
        }}>
          I turn complex engineering and AI systems into clear, developer-focused
          documentation — structured so both humans and LLMs can consume it easily.
        </p>

        {/* CTA links */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {[
            { label: "Hire me",       href: "mailto:mani.siddhartha@gmail.com" },
            { label: "View résumé",   href: "https://github.com/Siddharthablog/Resume" },
            { label: "LinkedIn",      href: "https://www.linkedin.com/in/siddhartha-mani-98696073/" },
          ].map((btn) => (
            <a
              key={btn.label}
              href={btn.href}
              target={btn.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                borderRadius: 9999,
                background: "var(--text)",
                color: "var(--bg)",
                fontSize: "0.82rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
              onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: 900, margin: "3rem auto 0", height: 1, background: "var(--border)" }} />

      {/* Sections */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        {SECTIONS.map((section, i) => (
          <Section key={section.num} section={section} index={i} />
        ))}
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
