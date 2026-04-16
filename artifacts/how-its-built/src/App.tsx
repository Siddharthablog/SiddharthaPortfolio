import { useEffect, useRef, useState } from "react";
import "./index.css";

// ─── Intersection hook ───────────────────────────────────────────────────────
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

// ─── Typewriter ──────────────────────────────────────────────────────────────
const ROLES = [
  "API Documentation",
  "AI-Optimised Content",
  "Developer Guides",
  "DITA / XML Authoring",
  "Docs-as-Code Workflows",
];

function Typewriter() {
  const [text, setText] = useState("");
  const [roleIdx, setRoleIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = ROLES[roleIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting && text === target) {
      timer = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && text === "") {
      setDeleting(false);
      setRoleIdx((i) => (i + 1) % ROLES.length);
    } else {
      timer = setTimeout(() => {
        setText(deleting ? text.slice(0, -1) : target.slice(0, text.length + 1));
      }, deleting ? 40 : 70);
    }
    return () => clearTimeout(timer);
  }, [text, deleting, roleIdx]);

  return (
    <span style={{ color: "#e2e8f0", fontSize: "1.1rem" }}>
      {text}
      <span className="typed-cursor" />
    </span>
  );
}

// ─── Animated viz: AI Documentation ─────────────────────────────────────────
function DocViz({ active }: { active: boolean }) {
  const lines = [
    { w: "85%", color: "#e2e8f0" },
    { w: "70%", color: "#94a3b8" },
    { w: "90%", color: "#94a3b8" },
    { w: "55%", color: "#94a3b8" },
    { w: "75%", color: "#06b6d4" },
    { w: "60%", color: "#94a3b8" },
  ];
  return (
    <div className="glass p-5 w-full" style={{ minHeight: 160 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: "#64748b" }}>api-reference.md</span>
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            height: 7,
            background: l.color === "#06b6d4"
              ? "linear-gradient(90deg,#06b6d4,#7c3aed)"
              : l.color,
            borderRadius: 4,
            marginBottom: 8,
            opacity: active ? 0.75 : 0,
            width: active ? l.w : "0%",
            transition: `width 0.55s ease ${i * 0.12}s, opacity 0.4s ease ${i * 0.12}s`,
          }}
        />
      ))}
      <div style={{
        marginTop: 10,
        fontSize: 10,
        color: "#7c3aed",
        opacity: active ? 1 : 0,
        transition: "opacity 0.5s ease 0.9s",
        fontFamily: "monospace"
      }}>
        ✦ LLM-optimised structure applied
      </div>
    </div>
  );
}

// ─── Animated viz: DITA / Structured Content ─────────────────────────────────
function DitaViz({ active }: { active: boolean }) {
  const tags = [
    { tag: "<concept>", indent: 0 },
    { tag: "<title>", indent: 1 },
    { tag: "<conbody>", indent: 1 },
    { tag: "<p>", indent: 2 },
    { tag: "</conbody>", indent: 1 },
    { tag: "</concept>", indent: 0 },
  ];
  return (
    <div className="glass p-5 w-full" style={{ minHeight: 160, fontFamily: "monospace", fontSize: 12 }}>
      {tags.map((t, i) => (
        <div
          key={i}
          style={{
            paddingLeft: t.indent * 18,
            color: t.tag.startsWith("</") ? "#7c3aed" : "#06b6d4",
            opacity: active ? 1 : 0,
            transform: active ? "translateX(0)" : "translateX(-16px)",
            transition: `opacity 0.35s ease ${i * 0.13}s, transform 0.35s ease ${i * 0.13}s`,
            lineHeight: "1.9",
          }}
        >
          {t.tag}
          {(t.tag === "<title>" || t.tag === "<p>") && (
            <span style={{ color: "#e2e8f0" }}>
              {t.tag === "<title>" ? " Getting Started" : " Clear, structured content..."}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Animated viz: Automation & Tools ────────────────────────────────────────
function AutomationViz({ active }: { active: boolean }) {
  const steps = [
    { label: "Scan docs repo", color: "#06b6d4", icon: "🔍" },
    { label: "LLM validation", color: "#7c3aed", icon: "✦" },
    { label: "Auto-remove stale", color: "#22c55e", icon: "✂" },
    { label: "Publish pipeline", color: "#f59e0b", icon: "🚀" },
  ];
  return (
    <div className="glass p-5 w-full" style={{ minHeight: 160 }}>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
            opacity: active ? 1 : 0,
            transform: active ? "translateX(0)" : "translateX(20px)",
            transition: `opacity 0.4s ease ${i * 0.18}s, transform 0.4s ease ${i * 0.18}s`,
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: s.color + "22",
            border: `1.5px solid ${s.color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            flexShrink: 0,
          }}>
            {s.icon}
          </div>
          <div style={{
            flex: 1,
            height: 6,
            background: s.color,
            borderRadius: 4,
            opacity: 0.7,
          }} />
          <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{s.label}</span>
        </div>
      ))}
      <div style={{
        fontSize: 10, color: "#22c55e", marginTop: 4, fontFamily: "monospace",
        opacity: active ? 1 : 0, transition: "opacity 0.4s ease 0.9s"
      }}>
        ✓ 3-day process → 4 hours saved
      </div>
    </div>
  );
}

// ─── Animated viz: Open-Source & Hackathon ───────────────────────────────────
function OpenSourceViz({ active }: { active: boolean }) {
  const projects = ["FletX", "Requestly", "Ansible AMQ", "Terraform", "WatsonX AI"];
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) { setCount(0); return; }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setCount(i);
      if (i >= projects.length) clearInterval(t);
    }, 320);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="glass p-5 w-full" style={{ minHeight: 160 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {projects.map((p, i) => (
          <span
            key={p}
            style={{
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.35)",
              color: "#c4b5fd",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 9999,
              opacity: count > i ? 1 : 0,
              transform: count > i ? "scale(1)" : "scale(0.7)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            {p}
          </span>
        ))}
      </div>
      <div style={{
        fontSize: 10, color: "#94a3b8", lineHeight: 1.6,
        opacity: active ? 1 : 0, transition: "opacity 0.5s ease 1.6s"
      }}>
        🏆 Hacktoberfest contributor<br />
        ⚡ WatsonX Agentic AI Hackathon
      </div>
    </div>
  );
}

// ─── What I Do section ───────────────────────────────────────────────────────
const WHAT_I_DO = [
  {
    num: "01",
    title: "AI Documentation",
    desc: "RAG systems, prompt templates, and LLM integration docs structured so that both humans and AI agents can consume them.",
    Viz: DocViz,
  },
  {
    num: "02",
    title: "Structured Content",
    desc: "DITA/XML authoring with complex DITAVAL profiling across multi-model server documentation at IBM.",
    Viz: DitaViz,
  },
  {
    num: "03",
    title: "Docs Automation",
    desc: "Python + local LLM pipelines that cut a 3-day manual content review process down to 4 hours.",
    Viz: AutomationViz,
  },
  {
    num: "04",
    title: "Open Source & Hackathons",
    desc: "Active contributor to open-source projects and hackathons including Hacktoberfest and IBM WatsonX.",
    Viz: OpenSourceViz,
  },
];

function WhatIDoCard({ item, delay }: { item: typeof WHAT_I_DO[0]; delay: number }) {
  const { ref, visible } = useReveal(0.2);
  const { Viz } = item;

  return (
    <div
      ref={ref}
      className="glass glass-hover"
      style={{
        padding: "1.5rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", marginBottom: 8 }}>
        {item.num}
      </p>
      <h3 className="neon" style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>
        {item.title}
      </h3>
      <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
        {item.desc}
      </p>
      <Viz active={visible} />
    </div>
  );
}

// ─── Experience timeline ─────────────────────────────────────────────────────
const EXPERIENCE = [
  {
    company: "IBM",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    period: "Sep 2022 — Present",
    role: "Information Developer",
    color: "#06b6d4",
    highlights: [
      "Authored API, CLI, and developer guides for IBM Cloud Power Virtual Server",
      "Collaborated with AI Docs architects to structure content for LLM consumption",
      "Automated stale content removal with Python + local LLM — 3 days → 4 hours",
      "Applied DITAVAL profiling across 6 IBM Power Server models (Power10/11)",
      "Mentored junior writers; led peer reviews and IBM Style Guide governance",
    ],
    tags: ["DITA", "XML", "Markdown", "Jenkins", "Git", "Acrolinx", "Python", "Oxygen XML"],
  },
  {
    company: "Xylem",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Xylem_Logo.svg",
    period: "2020 — 2022",
    role: "Technical Documentation",
    color: "#7c3aed",
    highlights: [
      "End-to-end IoT solution docs — IoT Cloud, Applications, and Gateways",
      "Collaborated with developers on Swagger/OpenAPI documentation",
      "Delivered API docs, SDK guides, UAT guides, and release notes in 2-week sprints",
    ],
    tags: ["Swagger", "Confluence", "Astoria CCMS", "JIRA", "Acrolinx"],
  },
  {
    company: "Unisys",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/Unisys_logo_2022.svg",
    period: "2017 — 2020",
    role: "Information Developer",
    color: "#a855f7",
    highlights: [
      "End-to-end docs for Fabric Computing Manager (Data Centre) and Digistics (Air Cargo)",
      "Analysed user stories; generated client-specific webhelp using DITAVAL files",
      "Delivered webhelp, admin guides, release notes, and installation guides",
    ],
    tags: ["XML", "DITA", "Webhelp", "Arbortext", "JIRA"],
  },
];

function ExperienceCard({ job, delay }: { job: typeof EXPERIENCE[0]; delay: number }) {
  const { ref, visible } = useReveal(0.15);

  return (
    <div
      ref={ref}
      className="glass glass-hover"
      style={{
        padding: "1.75rem",
        marginBottom: "1.5rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-32px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Left: logo + meta */}
        <div style={{ minWidth: 130 }}>
          <img src={job.logo} alt={job.company} style={{ height: 22, filter: "brightness(0) invert(1)", opacity: 0.85 }} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{job.period}</div>
          <div
            style={{
              marginTop: 6,
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 9999,
              background: job.color + "22",
              border: `1px solid ${job.color}44`,
              color: job.color,
            }}
          >
            {job.role}
          </div>
        </div>

        {/* Right: highlights + tags */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: 14 }}>
            {job.highlights.map((h, i) => (
              <li
                key={i}
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  lineHeight: 1.7,
                  paddingLeft: 14,
                  position: "relative",
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.4s ease ${delay + 0.1 + i * 0.08}s`,
                }}
              >
                <span style={{ position: "absolute", left: 0, color: job.color }}>›</span>
                {h}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {job.tags.map((t) => (
              <span
                key={t}
                style={{
                  background: "rgba(15,23,36,0.9)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "#7dd3fc",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  padding: "2px 9px",
                  borderRadius: 9999,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skills grid ─────────────────────────────────────────────────────────────
const SKILLS = [
  {
    category: "Markup & Formats",
    color: "#06b6d4",
    items: ["DITA", "XML", "Markdown", "YAML", "JSON", "reStructuredText"],
  },
  {
    category: "Authoring Tools",
    color: "#7c3aed",
    items: ["Oxygen XML", "VS Code", "Acrolinx", "Confluence", "Astoria CCMS"],
  },
  {
    category: "CI/CD & Collab",
    color: "#22c55e",
    items: ["Jenkins", "Git", "JIRA", "Swagger / OpenAPI", "Postman"],
  },
  {
    category: "Automation & AI",
    color: "#f59e0b",
    items: ["Python", "LangChain", "Local LLMs", "Vibe Coding", "RAG Systems"],
  },
  {
    category: "Media & Visuals",
    color: "#ec4899",
    items: ["draw.io", "Camtasia", "PowerPoint GIFs"],
  },
  {
    category: "Certifications",
    color: "#a855f7",
    items: ["AI Complete Bootcamp", "Technical Writing", "Docker", "Hybrid Cloud", "Data Centre"],
  },
];

function SkillsSection() {
  const { ref, visible } = useReveal(0.1);

  return (
    <section ref={ref} style={{ marginTop: "5rem" }}>
      <h2
        className="neon"
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: "2.5rem",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        Skills & Tools
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {SKILLS.map((group, gi) => (
          <div
            key={group.category}
            className="glass"
            style={{
              padding: "1.25rem",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 0.55s ease ${gi * 0.1}s, transform 0.55s ease ${gi * 0.1}s`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: group.color,
                marginBottom: 12,
                borderBottom: `1px solid ${group.color}22`,
                paddingBottom: 6,
              }}
            >
              {group.category}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {group.items.map((item, ii) => (
                <span
                  key={item}
                  style={{
                    background: group.color + "14",
                    border: `1px solid ${group.color}33`,
                    color: group.color,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 9999,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "scale(1)" : "scale(0.75)",
                    transition: `opacity 0.35s ease ${gi * 0.1 + ii * 0.06}s, transform 0.35s ease ${gi * 0.1 + ii * 0.06}s`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(7,16,38,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(124,58,237,0.12)",
        padding: "0 2rem",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span className="neon" style={{ fontWeight: 800, fontSize: "0.95rem" }}>
        Siddhartha Mani
      </span>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {["#about", "#what-i-do", "#experience", "#skills", "#contact"].map((href) => (
          <a
            key={href}
            href={href}
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => ((e.target as HTMLElement).style.color = "#e2e8f0")}
            onMouseOut={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
          >
            {href.replace("#", "").replace(/-/g, " ")}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ─── Highlights data ─────────────────────────────────────────────────────────
const HIGHLIGHTS = [
  { icon: "🤖", label: "AI Documentation",    sub: "RAG · Prompts · LLM Docs" },
  { icon: "📄", label: "Structured Content",  sub: "DITA · XML · CCMS" },
  { icon: "⚙️", label: "Automation",          sub: "Python · LangChain · Jenkins" },
  { icon: "🏆", label: "Certifications",      sub: "AI · Docker · Hybrid Cloud" },
  { icon: "⚡", label: "Hackathon",           sub: "WatsonX · Link Checker" },
  { icon: "🌐", label: "Open Source",         sub: "FletX · Requestly · Terraform" },
];

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <div className="grid-bg" aria-hidden />
      <Nav />

      {/* ── HERO ── */}
      <section
        id="about"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 1.5rem 3rem",
          position: "relative",
        }}
      >
        {/* Ambient orbs */}
        <div className="orb" style={{
          position: "absolute", width: 480, height: 480,
          background: "rgba(124,58,237,0.09)", top: "10%", left: "5%",
          animationDelay: "0s",
        }} />
        <div className="orb" style={{
          position: "absolute", width: 360, height: 360,
          background: "rgba(6,182,212,0.07)", bottom: "12%", right: "8%",
          animationDelay: "3s",
        }} />

        <div style={{ maxWidth: 1100, width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }}>

            {/* Left: identity */}
            <div className="glass" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg,#06b6d4,#7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 800, color: "white",
                  boxShadow: "0 0 24px rgba(124,58,237,0.3)",
                  flexShrink: 0,
                }}>
                  SM
                </div>
                <div>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1 }}>
                    Siddhartha Mani
                  </h1>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                    Information Developer · AI & Cloud Documentation
                  </p>
                </div>
              </div>

              <h2 className="neon" style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 10 }}>
                Technical Writer
              </h2>
              <div style={{ marginBottom: "1.25rem", minHeight: 28 }}>
                <Typewriter />
              </div>

              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                I turn complex engineering and AI systems into clear, developer-focused
                documentation — structured so both humans and LLMs can consume it easily.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: "1.25rem" }}>
                <a className="cta-btn" href="mailto:mani.siddhartha@gmail.com">Hire me</a>
                <a className="cta-btn" href="https://github.com/Siddharthablog/Resume" target="_blank" rel="noopener noreferrer">View résumé</a>
                <a className="cta-btn" href="https://www.linkedin.com/in/siddhartha-mani-98696073/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#475569" }}>Open to: Remote &amp; Full-time</p>
            </div>

            {/* Right: quick highlights */}
            <div className="glass glass-hover" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.25rem" }}>
                Quick highlights
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {HIGHLIGHTS.map((h) => (
                  <div key={h.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{h.icon}</span>
                    <div>
                      <div className="neon" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{h.label}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.5, marginTop: 2 }}>
                        {h.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 6rem" }}>

        {/* ── WHAT I DO ── */}
        <section id="what-i-do" style={{ marginTop: "4rem" }}>
          <h2
            className="neon"
            style={{ fontSize: "1.75rem", fontWeight: 800, textAlign: "center", marginBottom: "2.5rem" }}
          >
            What I do
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {WHAT_I_DO.map((item, i) => (
              <WhatIDoCard key={item.num} item={item} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* ── EXPERIENCE ── */}
        <section id="experience" style={{ marginTop: "5rem" }}>
          <h2
            className="neon"
            style={{ fontSize: "1.75rem", fontWeight: 800, textAlign: "center", marginBottom: "2.5rem" }}
          >
            Professional Experience
          </h2>
          {EXPERIENCE.map((job, i) => (
            <ExperienceCard key={job.company} job={job} delay={i * 0.1} />
          ))}
        </section>

        {/* ── SKILLS ── */}
        <section id="skills">
          <SkillsSection />
        </section>

        {/* ── CONTACT ── */}
        <section
          id="contact"
          style={{ marginTop: "5rem", textAlign: "center" }}
        >
          <div className="glass" style={{ padding: "3rem 2rem", display: "inline-block", width: "100%", maxWidth: 600, margin: "0 auto" }}>
            <h2 className="neon" style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>
              Let's work together
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
              Looking for a technical writer who bridges AI, developer docs, and automation?<br />
              Let's connect.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a className="cta-btn" href="mailto:mani.siddhartha@gmail.com">
                mani.siddhartha@gmail.com
              </a>
              <a className="cta-btn" href="https://github.com/Siddharthablog/Resume" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a className="cta-btn" href="https://www.linkedin.com/in/siddhartha-mani-98696073/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </section>

        <footer style={{ textAlign: "center", marginTop: "3rem", color: "#334155", fontSize: "0.75rem" }}>
          © 2025 Siddhartha Mani · Built with React + Vite
        </footer>
      </div>
    </>
  );
}
