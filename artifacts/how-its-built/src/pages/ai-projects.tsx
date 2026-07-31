import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import "../index.css";
import ChatWidget from "../components/ChatWidget";

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 55) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}


function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", h, { passive: true });
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return isMobile;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND PATH ANIMATION (same as portfolio)
// ─────────────────────────────────────────────────────────────────────────────

function FullPagePathAnimation() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { w, h } = size;
  const m = 18;
  const r = 18;
  const x1 = m + r;
  const x2 = w - m - r;
  const y1 = m + r;
  const y2 = h - m - r;

  const path = `M ${x1},${m} L ${x2},${m} Q ${w-m},${m} ${w-m},${y1} L ${w-m},${y2} Q ${w-m},${h-m} ${x2},${h-m} L ${x1},${h-m} Q ${m},${h-m} ${m},${y2} L ${m},${y1} Q ${m},${m} ${x1},${m} Z`;

  return (
    <svg 
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 9997
      }}
      aria-hidden="true"
    >
      <path 
        fill="none" 
        stroke="hsl(100,40%,38%)" 
        strokeWidth="1.5" 
        strokeDasharray="5 8" 
        opacity="0.32" 
        d={path} 
      />
      <g opacity="0.82">
        <animateMotion dur="24s" repeatCount="indefinite" rotate="auto" path={path} />
        <text fontSize="16" textAnchor="middle" dominantBaseline="central" fill="hsl(100,40%,32%)">✦</text>
      </g>
      <g opacity="0.65">
        <animateMotion dur="24s" repeatCount="indefinite" rotate="auto" path={path} begin="-12s" />
        <text fontSize="11" textAnchor="middle" dominantBaseline="central" fill="hsl(210,88%,42%)">◆</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY NAV (adapted for AI Projects page)
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SECTIONS = [
  { label: "Job Radar",     id: "job-radar" },
  { label: "API DocOps",    id: "docops-suite" },
  { label: "MSTP Finetune", id: "mstp-finetune" },
  { label: "Tech Pulse",    id: "tech-pulse" },
];

function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 40);
      if (window.scrollY > 40) setMenuOpen(false);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    PAGE_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) setActive(id);
            });
          },
          { rootMargin: "-30% 0px -60% 0px" }
        );
        obs.observe(el);
        observers.push(obs);
      }
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        zIndex: 10000,
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "hsla(45,22%,92%,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "background 0.35s ease, border-color 0.35s ease"
      }}>
        <Link href="/">
          <a style={{
            background: "white",
            fontSize: 12,
            fontWeight: 700,
            padding: "5px 16px",
            cursor: "pointer",
            color: "var(--text)",
            textDecoration: "none",
            borderRadius: 9999,
            border: "1.5px solid hsl(40,14%,76%)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            transition: "all 0.2s ease",
          }}>
            ← Portfolio
          </a>
        </Link>
        {isMobile ? (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: menuOpen ? "hsl(40,14%,88%)" : "white",
            border: "1.5px solid hsl(40,14%,76%)",
            color: "var(--text)",
            borderRadius: 9999,
            padding: "5px 16px",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            transition: "all 0.2s ease",
          }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            {PAGE_SECTIONS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  borderRadius: 9999,
                  padding: "5px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: active === id ? "hsl(100,40%,38%)" : "white",
                  border: active === id ? "1.5px solid hsl(100,40%,38%)" : "1.5px solid hsl(40,14%,76%)",
                  color: active === id ? "white" : "var(--text)",
                  boxShadow: active === id ? "0 2px 8px hsl(100,40%,44%,0.25)" : "0 1px 4px rgba(0,0,0,0.07)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>
      {isMobile && (
        <div style={{
          position: "fixed", top: 54, left: 0, right: 0, zIndex: 9999,
          background: "hsla(45,22%,92%,0.97)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          padding: menuOpen ? "1rem 1.25rem 1.25rem" : "0 1.25rem",
          display: "flex", flexDirection: "column", gap: 8,
          maxHeight: menuOpen ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease, padding 0.3s ease",
        }}>
          {PAGE_SECTIONS.map(({ label, id }) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: active === id ? "hsl(100,40%,38%)" : "white",
              border: `1.5px solid ${active === id ? "hsl(100,40%,38%)" : "hsl(40,14%,76%)"}`,
              cursor: "pointer", padding: "10px 16px", borderRadius: 9999,
              fontSize: 13, fontWeight: 600, textAlign: "left",
              color: active === id ? "white" : "var(--text)",
              transition: "all 0.2s ease",
            }}>{label}</button>
          ))}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS (same design language as portfolio)
// ─────────────────────────────────────────────────────────────────────────────

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
// PROJECT 1: TECH PULSE — AI-curated daily insights
// ─────────────────────────────────────────────────────────────────────────────

type Insight = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  tag: string;
  date: string;
};

type Job = {
  id: string;
  job_title: string;
  company: string;
  location: string;
  experience: string | null;
  skills: string[];
  summary: string;
  apply_url: string;
  naukri_url: string | null;
  source: string;
  date: string;
};

const SOURCE_COLORS: Record<string, string> = {
  "LinkedIn":          "hsl(210,88%,52%)",
  "LinkedIn + Naukri": "hsl(260,60%,55%)",
  "Naukri":            "hsl(100,40%,44%)",
};

function JobCard({ job, index, visible }: { job: Job; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const color = SOURCE_COLORS[job.source] || "hsl(210,88%,52%)";
  const expColor = job.experience ? "hsl(100,40%,44%)" : "hsl(40,10%,60%)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        border: `1.5px solid ${hovered ? color : "var(--border)"}`,
        borderTop: `3px solid ${color}`,
        borderRadius: "0.9rem",
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.5s ease ${index * 0.07}s, transform 0.5s ease ${index * 0.07}s, border-color 0.2s ease`,
        cursor: "default",
        boxShadow: hovered ? `0 4px 18px ${color}20` : "0 1px 6px rgba(0,0,0,0.04)",
      }}
    >
      {/* Title + company */}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)", lineHeight: 1.3, marginBottom: 2 }}>
          {job.job_title}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: color }}>
          {job.company}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
          background: `${expColor}15`, border: `1px solid ${expColor}40`, color: expColor,
        }}>
          🕐 {job.experience || "Exp not listed"}
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
          background: `${color}12`, border: `1px solid ${color}30`, color: color,
        }}>
          📍 {job.location}
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 600, color: "var(--muted)",
        }}>
          via {job.source} · {job.date}
        </span>
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {job.skills.slice(0, 4).map(s => (
            <span key={s} style={{
              fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 9999,
              background: "hsl(45,22%,95%)", border: "1px solid var(--border)", color: "var(--muted)",
            }}>{s}</span>
          ))}
        </div>
      )}

      {/* Summary */}
      <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
        {job.summary}
      </p>

      {/* Apply button */}
      <a
        href={job.apply_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 2,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10.5,
          fontWeight: 800,
          color: "white",
          background: color,
          padding: "5px 14px",
          borderRadius: 9999,
          textDecoration: "none",
          alignSelf: "flex-start",
          transition: "opacity 0.15s",
          opacity: hovered ? 0.9 : 1,
        }}
      >
        Apply →
      </a>
    </div>
  );
}

function JobRadarProject() {
  const { ref, visible } = useReveal(0.1);
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSource, setActiveSource] = useState("All");
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    fetch("/jobs.json")
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: Job[]) => { setJobs(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const sources = ["All", "LinkedIn + Naukri", "LinkedIn", "Naukri"];
  const filtered = activeSource === "All" ? jobs : jobs.filter(j => j.source === activeSource);

  return (
    <div id="job-radar" ref={ref} style={{ scrollMarginTop: 80 }}>
      <SectionLabel label="Project 01 · Job Radar" />
      <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />

      {/* Intro card */}
      <div style={{
        background: "white", border: "1px solid var(--border)", borderRadius: "1.2rem",
        padding: isMobile ? "1.25rem" : "2rem", marginTop: "1.5rem",
        boxShadow: "0 2px 20px rgba(0,0,0,0.05)", position: "relative",
      }}>
        <span style={{
          position: "absolute", top: 14, right: 14,
          fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, hsl(260,60%,55%), hsl(210,88%,52%))",
          color: "white",
          padding: "3px 10px", borderRadius: 9999,
          boxShadow: "0 2px 8px hsl(260,60%,55%,0.35)",
        }}>⚡ Agentic</span>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: "hsl(260,60%,55%,0.12)", border: "1.5px solid hsl(260,60%,55%,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>💼</div>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.25, marginBottom: 6 }}>
              Autonomous Job Radar
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "hsl(100,60%,45%)",
                display: "inline-block", animation: "pulseGlow 2s infinite ease-in-out",
              }} />
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.14em", color: "hsl(100,40%,38%)",
              }}>Live · Refreshed daily · Senior TW · Bangalore </span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 14 }}>
          A daily job curation pipeline that searches <strong style={{ color: "var(--text)" }}>Naukri</strong> for experience and skills,
          and <strong style={{ color: "var(--text)" }}>LinkedIn</strong> for direct apply links. It merges results by company,
          summarizes each role with <strong style={{ color: "var(--text)" }}>Groq LLM</strong>, and deploys updates automatically via{" "}
          <strong style={{ color: "var(--text)" }}>GitHub Actions and Vercel</strong>.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {["GitHub Actions", "Tavily API", "Groq LLM", "Naukri", "LinkedIn", "Python", "Vercel CI/CD"].map(t => (
              <span key={t} style={{
                background: "hsl(260,60%,55%,0.1)", border: "1.5px solid hsl(260,60%,55%,0.2)",
                color: "hsl(260,60%,55%)", fontSize: 10, fontWeight: 700,
                padding: "2px 10px", borderRadius: 9999,
              }}>{t}</span>
            ))}
          </div>
          <style>{`
            @keyframes docsPulse {
              0%, 100% { box-shadow: 0 0 0 0 hsl(260,60%,55%,0.45); }
              50%       { box-shadow: 0 0 0 6px hsl(260,60%,55%,0); }
            }
            @keyframes docsShimmer {
              0%   { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            .docs-btn {
              flex-shrink: 0;
              font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
              padding: 4px 14px; border-radius: 9999px; cursor: pointer;
              border: 1.5px solid hsl(260,60%,55%,0.35);
              color: hsl(260,60%,55%);
              background: linear-gradient(90deg,
                white 0%, hsl(260,60%,55%,0.12) 40%,
                hsl(210,88%,52%,0.12) 60%, white 100%);
              background-size: 200% auto;
              animation: docsPulse 1.8s ease-in-out infinite, docsShimmer 2.4s linear infinite;
              transition: all 0.2s ease;
            }
            .docs-btn:hover {
              background: hsl(260,60%,55%);
              color: white;
              animation: none;
              box-shadow: 0 2px 12px hsl(260,60%,55%,0.45);
            }
            .docs-btn.open {
              background: hsl(260,60%,55%);
              color: white;
              animation: none;
              box-shadow: 0 2px 8px hsl(260,60%,55%,0.3);
            }
          `}</style>
          <button
            onClick={() => setShowDocs(d => !d)}
            className={`docs-btn${showDocs ? " open" : ""}`}
          >
            {showDocs ? "✕ Close" : "📖 Documentation"}
          </button>
        </div>
      </div>

      {/* ── Architecture Deep-Dive ── */}
      {showDocs && <div style={{
        marginTop: "1.25rem",
        display: "flex", flexDirection: "column", gap: "0.85rem",
        animation: "fadeUp 0.35s ease forwards",
      }}>

        {/* Why it's agentic callout */}
        <div style={{
          background: "linear-gradient(135deg, hsl(260,60%,55%,0.07) 0%, hsl(210,88%,52%,0.06) 100%)",
          border: "1.5px solid hsl(260,60%,55%,0.22)",
          borderRadius: "1rem", padding: "1rem 1.25rem",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🧠</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "hsl(260,60%,50%)", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Why it's agentic
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.75, margin: 0 }}>
              This pipeline runs on a <strong style={{ color: "var(--text)" }}>daily cron schedule</strong> with no human intervention.
              Each run selects queries, validates results, resolves company-name conflicts using an LLM, generates role summaries, and deploys the output automatically.
              All stages produce <strong style={{ color: "var(--text)" }}>structured logs in GitHub Actions</strong> for full observability.
            </p>
          </div>
        </div>

        {/* 5-stage pipeline */}
        <div style={{
          background: "white", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: isMobile ? "1rem" : "1.25rem 1.5rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted)", marginBottom: "1rem" }}>
            Pipeline · 5 Stages
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                step: "01", icon: "⏰", color: "hsl(40,90%,52%)", title: "GitHub Actions Cron",
                detail: "Triggers daily at 06:00 UTC. Spins up a Python environment, installs dependencies, and starts the orchestrator script.",
                tags: ["cron: '0 6 * * *'", "ubuntu-latest", "pip install"],
              },
              {
                step: "02", icon: "🔍", color: "hsl(100,40%,44%)", title: "Naukri Scrape via Tavily",
                detail: "The Tavily Search API sends structured queries to Naukri.com, filtered by role (Senior Technical Writer) and location (Bangalore). Each result returns the job title, company, experience range, required skills, and posting date.",
                tags: ["Tavily API", "site:naukri.com", "experience filter", "skills extraction"],
              },
              {
                step: "03", icon: "🔗", color: "hsl(210,88%,52%)", title: "LinkedIn Direct-Apply Links",
                detail: "A second Tavily query runs simultaneously, targeting LinkedIn Jobs for the same role and location. It retrieves direct /jobs/view/ apply URLs and completes in parallel with Stage 2 to minimize total run time.",
                tags: ["site:linkedin.com/jobs", "concurrent fetch", "apply URL extraction"],
              },
              {
                step: "04", icon: "🤖", color: "hsl(260,60%,55%)", title: "Groq LLM · Merge & Summarise",
                detail: "Groq (Llama 3 70B) processes both result sets and matches Naukri listings to LinkedIn links using fuzzy company-name logic, accounting for abbreviations and punctuation variants. It then generates a one-sentence summary per role, highlighting the key responsibilities and technology stack.",
                tags: ["Groq API", "Llama 3 70B", "fuzzy match", "one-line summary"],
              },
              {
                step: "05", icon: "🚀", color: "hsl(16,80%,52%)", title: "Commit JSON → Vercel Deploy",
                detail: "The pipeline serializes merged results to jobs.json and commits the file to the repository using the GitHub API. Vercel detects the push event, triggers a rebuild, and publishes the updated site automatically, typically within 90 seconds of the scheduled run.",
                tags: ["jobs.json", "git commit --author bot", "Vercel webhook", "~90s TTD"],
              },
            ].map((stage, i, arr) => (
              <div key={stage.step} style={{ display: "flex", gap: 0 }}>
                {/* Left: step line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 36 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: `${stage.color}18`, border: `2px solid ${stage.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                  }}>{stage.icon}</div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: "var(--border)", margin: "4px 0" }} />
                  )}
                </div>
                {/* Right: content */}
                <div style={{ flex: 1, paddingLeft: 10, paddingBottom: i < arr.length - 1 ? "1rem" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: stage.color, letterSpacing: "0.08em",
                      background: `${stage.color}14`, border: `1px solid ${stage.color}30`,
                      padding: "1px 6px", borderRadius: 4 }}>STEP {stage.step}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{stage.title}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 6px" }}>{stage.detail}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {stage.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 9.5, fontFamily: "monospace",
                        background: `${stage.color}0e`, border: `1px solid ${stage.color}25`,
                        color: stage.color, padding: "1px 7px", borderRadius: 4, fontWeight: 700,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack grid */}
        <div style={{
          background: "white", border: "1px solid var(--border)",
          borderRadius: "1rem", padding: isMobile ? "1rem" : "1.25rem 1.5rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted)", marginBottom: "0.85rem" }}>
            Tech Stack
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: "0.65rem",
          }}>
            {[
              { layer: "Orchestration", tools: "GitHub Actions", icon: "⚙️", color: "hsl(40,90%,52%)" },
              { layer: "Search / Retrieval", tools: "Tavily Search API", icon: "🔍", color: "hsl(100,40%,44%)" },
              { layer: "LLM Inference", tools: "Groq · Llama 3 70B", icon: "🤖", color: "hsl(260,60%,55%)" },
              { layer: "Language", tools: "Python 3.11", icon: "🐍", color: "hsl(210,88%,52%)" },
              { layer: "Data Format", tools: "JSON Schema", icon: "📄", color: "hsl(200,80%,44%)" },
              { layer: "Hosting", tools: "Vercel (static)", icon: "🚀", color: "hsl(16,80%,52%)" },
              { layer: "Source 1", tools: "Naukri.com", icon: "🏢", color: "hsl(100,40%,44%)" },
              { layer: "Source 2", tools: "LinkedIn Jobs", icon: "🔗", color: "hsl(210,88%,52%)" },
            ].map(item => (
              <div key={item.layer} style={{
                borderRadius: "0.65rem", padding: "0.65rem 0.85rem",
                background: `${item.color}08`, border: `1px solid ${item.color}22`,
              }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{item.layer}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text)" }}>{item.tools}</div>
              </div>
            ))}
          </div>
        </div>

      </div>}

      {/* Source filter + stats */}
      {jobs.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "1.5rem", marginBottom: "1rem" }}>
            {sources.map(s => {
              const isActive = activeSource === s;
              const color = SOURCE_COLORS[s] || "hsl(40,10%,30%)";
              return (
                <button key={s} onClick={() => setActiveSource(s)} style={{
                  padding: "5px 14px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                  background: isActive ? color : "white",
                  color: isActive ? "white" : color,
                  border: `1.5px solid ${isActive ? color : color + "35"}`,
                  cursor: "pointer", transition: "all 0.2s ease",
                  boxShadow: isActive ? `0 2px 8px ${color}30` : "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  {s}
                  {s !== "All" && (
                    <span style={{ marginLeft: 5, fontSize: 9, opacity: 0.7 }}>
                      ({jobs.filter(j => j.source === s).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: isMobile ? 12 : 24, flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[
              { label: "Jobs Found",  value: `${jobs.length}`,                                          color: "hsl(260,60%,55%)" },
              { label: "Companies",   value: `${new Set(jobs.map(j => j.company)).size}`,               color: "hsl(210,88%,52%)" },
              { label: "With Exp",    value: `${jobs.filter(j => j.experience).length}`,                color: "hsl(100,40%,44%)" },
              { label: "With Links",  value: `${jobs.filter(j => j.apply_url?.includes("linkedin")).length}`, color: "hsl(16,80%,52%)" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.4rem", fontWeight: 900, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</span>
                <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Job cards grid */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)", fontSize: 13 }}>
          Loading jobs…
        </div>
      )}
      {error && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)", fontSize: 13 }}>
          Could not load jobs. Check back soon.
        </div>
      )}
      {!loading && !error && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}>
          {filtered.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} visible={visible} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: 13 }}>
              No jobs found for "{activeSource}".
            </div>
          )}
        </div>
      )}

    </div>
  );
}

const TAG_COLORS: Record<string, string> = {
  "AI Docs":                  "hsl(210,88%,52%)",
  "API Standards":            "hsl(260,60%,55%)",
  "DevOps & CI/CD":           "hsl(100,40%,44%)",
  "DITA & Structured Content":"hsl(40,90%,52%)",
  "Dev Tools":                "hsl(16,80%,52%)",
};

const TAG_ICONS: Record<string, string> = {
  "AI Docs":                  "🤖",
  "API Standards":            "📄",
  "DevOps & CI/CD":           "⚡",
  "DITA & Structured Content":"🗂",
  "Dev Tools":                "🔧",
};

function InsightCard({ insight, index, visible }: { insight: Insight; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const color = TAG_COLORS[insight.tag] || "hsl(210,88%,52%)";
  const icon = TAG_ICONS[insight.tag] || "📰";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        borderRadius: "1rem",
        border: `1px solid ${hovered ? color + '44' : 'var(--border)'}`,
        borderLeft: `4px solid ${color}`,
        padding: "1.25rem 1.25rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: hovered
          ? `0 8px 30px ${color}18, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        opacity: visible ? 1 : 0,
        animation: visible ? `insightCardIn 0.5s ease ${index * 0.08}s forwards` : "none",
      }}
    >
      {/* Tag + Date row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 10, fontWeight: 700,
          background: color + "14", border: `1.5px solid ${color}30`,
          color: color, padding: "3px 10px", borderRadius: 9999,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          <span>{icon}</span>{insight.tag}
        </span>
        <span style={{
          fontSize: 10, color: "var(--muted)", fontWeight: 500,
          fontFamily: "monospace",
        }}>
          {insight.date}
        </span>
      </div>

      {/* Title */}
      <h4 style={{
        fontSize: 13, fontWeight: 750, color: "var(--text)",
        lineHeight: 1.4, margin: 0,
      }}>
        {insight.title}
      </h4>

      {/* Summary */}
      <p style={{
        fontSize: 11.5, color: "var(--muted)",
        lineHeight: 1.75, margin: 0, flex: 1,
      }}>
        {insight.summary}
      </p>

      {/* Footer: source + link */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: 8, borderTop: "1px solid var(--border)",
        marginTop: "auto",
      }}>
        <span style={{
          fontSize: 10, color: "var(--muted)", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: color, display: "inline-block", flexShrink: 0,
          }} />
          {insight.source}
        </span>
        <a
          href={insight.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11, fontWeight: 700, color: color,
            textDecoration: "none",
            transition: "opacity 0.2s",
            opacity: hovered ? 1 : 0.7,
          }}
        >
          Read →
        </a>
      </div>
    </div>
  );
}

function SkeletonCard() {
  const shimmerBg = "linear-gradient(90deg, hsl(40,14%,90%) 25%, hsl(40,14%,95%) 50%, hsl(40,14%,90%) 75%)";
  return (
    <div style={{
      background: "white",
      borderRadius: "1rem",
      border: "1px solid var(--border)",
      borderLeft: "4px solid hsl(40,14%,80%)",
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{
          width: 80, height: 18, borderRadius: 9999,
          background: shimmerBg, backgroundSize: "800px 100%",
          animation: "shimmer 1.5s infinite linear",
        }} />
        <div style={{
          width: 60, height: 14, borderRadius: 4,
          background: shimmerBg, backgroundSize: "800px 100%",
          animation: "shimmer 1.5s infinite linear",
        }} />
      </div>
      <div style={{
        width: "85%", height: 14, borderRadius: 4,
        background: shimmerBg, backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite linear 0.1s",
      }} />
      <div style={{
        width: "100%", height: 10, borderRadius: 4,
        background: shimmerBg, backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite linear 0.2s",
      }} />
      <div style={{
        width: "70%", height: 10, borderRadius: 4,
        background: shimmerBg, backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite linear 0.3s",
      }} />
    </div>
  );
}

function TechPulseProject() {
  const { ref, visible } = useReveal(0.1);
  const isMobile = useIsMobile();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [error, setError] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);

  useEffect(() => {
    fetch("/insights.json")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Insight[]) => {
        setInsights(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const allTags = ["All", ...Object.keys(TAG_COLORS)];
  const filtered = activeTag === "All"
    ? insights
    : insights.filter(i => i.tag === activeTag);

  return (
    <div id="tech-pulse" ref={ref} style={{ scrollMarginTop: 80, marginTop: "4rem" }}>
      <SectionLabel label="Project 04 · Tech Pulse" />
      <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />

      {/* Project intro card */}
      <div style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "1.2rem",
        padding: isMobile ? "1.25rem" : "2rem",
        marginTop: "1.5rem",
        boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
        position: "relative",
      }}>
        <span style={{
          position: "absolute", top: 14, right: 14,
          fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, hsl(260,60%,55%), hsl(210,88%,52%))",
          color: "white",
          padding: "3px 10px", borderRadius: 9999,
          boxShadow: "0 2px 8px hsl(260,60%,55%,0.35)",
        }}>⚡ Agentic</span>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: "hsl(210,88%,52%,0.12)", border: "1.5px solid hsl(210,88%,52%,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>📡</div>
          <div>
            <h2 style={{
              fontSize: "1.3rem", fontWeight: 800, color: "var(--text)",
              lineHeight: 1.25, marginBottom: 6,
            }}>
              Autonomous Web Curation Engine
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "hsl(100,60%,45%)",
                display: "inline-block",
                animation: "pulseGlow 2s infinite ease-in-out",
              }} />
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.14em", color: "hsl(100,40%,38%)",
              }}>Live · Refreshed daily · Zero human intervention</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.8, marginBottom: 8, fontWeight: 600 }}>
          Stay current with the documentation industry, without the manual search.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 14 }}>
          Documentation teams get a daily feed of curated articles across AI tooling, API standards,
          structured authoring, and DevOps practices. Every article is filtered and summarised for
          relevance to docs work, so the team stays informed without leaving their workflow.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 14 }}>
          A <strong style={{ color: "var(--text)" }}>GitHub Actions CRON</strong> job runs daily,
          querying <strong style={{ color: "var(--text)" }}>Tavily Search</strong> across five
          documentation categories. Each result is filtered and summarised by{" "}
          <strong style={{ color: "var(--text)" }}>GPT-OSS 120B via Groq</strong>, with off-topic
          articles automatically dropped. The top 9 insights are written to{" "}
          <strong style={{ color: "var(--text)" }}>insights.json</strong> and committed back to the
          repository, triggering a <strong style={{ color: "var(--text)" }}>Vercel</strong> redeploy
          with no manual steps.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["GitHub Actions", "Tavily API", "Groq LLM", "Python", "JSON Schema", "Vercel CI/CD"].map(t => (
            <span key={t} style={{
              background: "hsl(210,88%,52%,0.1)",
              border: "1.5px solid hsl(210,88%,52%,0.2)",
              color: "hsl(210,88%,52%)", fontSize: 10, fontWeight: 700,
              padding: "2px 10px", borderRadius: 9999,
            }}>{t}</span>
          ))}
        </div>

        {/* HOW THIS WORKS pipeline strip */}
        <div style={{
          marginTop: "1.25rem",
          background: "hsl(210,88%,52%,0.04)",
          border: "1px solid hsl(210,88%,52%,0.12)",
          borderRadius: "0.75rem",
          padding: "0.85rem 1.1rem",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.14em", color: "var(--muted)", marginBottom: 10,
          }}>HOW THIS WORKS</div>
          <style>{`
            @keyframes arrowPulse {
              0%,100% { opacity: 0.35; transform: translateX(0); }
              50%      { opacity: 1;    transform: translateX(3px); }
            }
          `}</style>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6,
          }}>
            {[
              { emoji: "⏰", label: "GitHub Actions CRON", color: "hsl(40,10%,30%)"    },
              { emoji: "🔍", label: "Tavily Search",        color: "hsl(210,88%,52%)"  },
              { emoji: "🤖", label: "Groq LLM Synthesis",   color: "hsl(260,60%,55%)"  },
              { emoji: "📄", label: "JSON Commit",          color: "hsl(100,40%,44%)"  },
              { emoji: "▲",  label: "Vercel Deploy",        color: "hsl(0,0%,20%)"     },
            ].map((step, i, arr) => (
              <span key={step.label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 700,
                  background: step.color + "12",
                  border: `1px solid ${step.color}28`,
                  color: step.color,
                  padding: "4px 10px", borderRadius: 9999,
                }}>
                  <span>{step.emoji}</span>{step.label}
                </span>
                {i < arr.length - 1 && (
                  <span style={{
                    fontSize: 12, fontWeight: 800,
                    color: "hsl(210,88%,52%)",
                    display: "inline-block",
                    animation: `arrowPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
                  }}>→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Launch / Close button — same slot */}
        <div style={{ marginTop: "1.25rem" }}>
          {!newsOpen ? (
            <button
              onClick={() => setNewsOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700,
                background: "hsl(210,88%,52%)", color: "white",
                border: "none", cursor: "pointer",
                boxShadow: "0 2px 12px hsl(210,88%,52%,0.35)", transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              🚀 Launch Autonomous News →
            </button>
          ) : (
            <button
              onClick={() => setNewsOpen(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 18px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                background: "hsl(210,88%,52%)", color: "white",
                border: "none", cursor: "pointer",
                boxShadow: "0 2px 12px hsl(210,88%,52%,0.35)", transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {newsOpen && <>
      {/* Tag filter pills */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6,
        marginTop: "1.5rem", marginBottom: "1.25rem",
      }}>
        {allTags.map(tag => {
          const isActive = activeTag === tag;
          const color = tag === "All" ? "hsl(40,10%,30%)" : (TAG_COLORS[tag] || "hsl(40,10%,30%)");
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{
                padding: "5px 14px", borderRadius: 9999,
                fontSize: 11, fontWeight: 700,
                background: isActive ? color : "white",
                color: isActive ? "white" : color,
                border: `1.5px solid ${isActive ? color : color + '35'}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? `0 2px 8px ${color}30` : "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {tag !== "All" && <span style={{ marginRight: 4 }}>{TAG_ICONS[tag]}</span>}
              {tag}
              {tag !== "All" && (
                <span style={{
                  marginLeft: 5, fontSize: 9, opacity: 0.7,
                }}>
                  ({insights.filter(i => i.tag === tag).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      {insights.length > 0 && (
        <div style={{
          display: "flex", gap: isMobile ? 12 : 24, flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}>
          {(() => {
            const displayed = filtered.slice(0, 6);
            return [
              { label: "Total Insights", value: `${displayed.length}`,                                    color: "hsl(210,88%,52%)" },
              { label: "Sources",        value: `${new Set(displayed.map(i => i.source)).size}`,           color: "hsl(100,40%,44%)" },
              { label: "Categories",     value: `${new Set(displayed.map(i => i.tag)).size}`,              color: "hsl(260,60%,55%)" },
            ];
          })().map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                fontSize: "1.4rem", fontWeight: 900, color: s.color,
                letterSpacing: "-0.02em",
              }}>{s.value}</span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          textAlign: "center", padding: "3rem 1rem",
          background: "white", borderRadius: "1rem",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
          <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            Insights are loading... Check back soon.
          </p>
        </div>
      )}

      {/* Insight cards */}
      {!loading && !error && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}>
          {filtered.length > 0 ? (
            filtered.slice(0, 6).map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} visible={visible} />
            ))
          ) : (
            <div style={{
              gridColumn: "1 / -1", textAlign: "center",
              padding: "2.5rem 1rem",
              background: "white", borderRadius: "1rem",
              border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                No insights found for "{activeTag}" yet. Try another category.
              </p>
            </div>
          )}
        </div>
      )}

      </>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT 2: MSTP FINETUNE — LLM fine-tuned chatbot
// ─────────────────────────────────────────────────────────────────────────────

function MstpFinetune() {
  const { ref, visible } = useReveal(0.1);
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<{role: string; text: string}[]>([
    { role: "assistant", text: "Hi! I'm MSTP Bot — fine-tuned on Microsoft Technical Publications (MSTP) guidelines. Ask me anything about technical writing or documentation standards.\n\n⏳ Hosted on HF Spaces (free tier) — first response may take ~30s to warm up." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [botOpen, setBotOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Call the HF-powered serverless function with retry for cold starts
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch("/api/mstp-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: userMsg }],
          }),
        });

        const data = await res.json();

        // Model is loading (cold start) — wait and retry
        if (res.status === 503 && data.retryAfter && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, (data.retryAfter || 15) * 1000));
          continue;
        }

        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        setMessages(prev => [...prev, { role: "assistant", text: data.answer }]);
        setIsTyping(false);
        return; // success — exit
      } catch (err: any) {
        if (attempt === maxRetries) {
          setMessages(prev => [...prev, {
            role: "assistant",
            text: `Sorry, I couldn't reach the model right now (${err.message || "Unknown error"}). Please try again in a moment.`,
          }]);
          setIsTyping(false);
        }
      }
    }
  };

  return (
    <div id="mstp-finetune" ref={ref} style={{ scrollMarginTop: 80 }}>
      <SectionLabel label="Project 03 · MSTP Finetune" />
      <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />

      {/* Project intro card */}
      <div style={{
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "1.2rem",
        padding: isMobile ? "1.25rem" : "2rem",
        marginTop: "1.5rem",
        boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: "hsl(260,60%,55%,0.12)", border: "1.5px solid hsl(260,60%,55%,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🧠</div>
          <div>
            <h2 style={{
              fontSize: "1.3rem", fontWeight: 800, color: "var(--text)",
              lineHeight: 1.25, marginBottom: 6,
            }}>
              Fine-Tuned LLM for Technical Writing Standards
            </h2>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 14 }}>
          <strong style={{ color: "var(--text)" }}>Llama 3.2 3B Instruct</strong> fine-tuned on{" "}
          <strong style={{ color: "var(--text)" }}>Microsoft Technical Publications (MSTP)</strong> style
          guide data using <strong style={{ color: "var(--text)" }}>Unsloth QLoRA</strong> with 4-bit quantisation
          on a single free Colab T4 GPU. The model was trained with LoRA rank 16, merged into full weights,
          quantised to <strong style={{ color: "var(--text)" }}>GGUF format</strong> for local inference via{" "}
          <strong style={{ color: "var(--text)" }}>Ollama</strong>, and deployed as a chatbot on{" "}
          <strong style={{ color: "var(--text)" }}>Hugging Face Spaces</strong> backed by the HF Inference API.
        </p>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 2, marginBottom: 14, display: "flex", flexDirection: "column", gap: 2 }}>
          <span>
            🤖 <strong style={{ color: "var(--text)" }}>Try the chatbot:</strong>{" "}
            <a href="https://huggingface.co/spaces/Siddhartha03/mstp-finetune-bot" target="_blank" rel="noopener noreferrer"
              style={{ color: "hsl(260,60%,55%)", textDecoration: "underline" }}>
              huggingface.co/spaces/Siddhartha03/mstp-finetune-bot
            </a>
          </span>
          <span>
            🦙 <strong style={{ color: "var(--text)" }}>Run locally with Ollama</strong> — download the GGUF model:{" "}
            <a href="https://huggingface.co/Siddhartha03/unsloth_Llama-3.2-3B-Instruct_1779362309" target="_blank" rel="noopener noreferrer"
              style={{ color: "hsl(260,60%,55%)", textDecoration: "underline" }}>
              unsloth_Llama-3.2-3B-Instruct
            </a>
          </span>
          <span>
            ☁️ <strong style={{ color: "var(--text)" }}>Host on any AI inference platform</strong> — full model weights:{" "}
            <a href="https://huggingface.co/Siddhartha03/mstp-Llama-3.2-3B-Instruct" target="_blank" rel="noopener noreferrer"
              style={{ color: "hsl(260,60%,55%)", textDecoration: "underline" }}>
              mstp-Llama-3.2-3B-Instruct
            </a>
          </span>
          <span>
            🏠 <strong style={{ color: "var(--text)" }}>All models & spaces:</strong>{" "}
            <a href="https://huggingface.co/Siddhartha03" target="_blank" rel="noopener noreferrer"
              style={{ color: "hsl(260,60%,55%)", textDecoration: "underline" }}>
              huggingface.co/Siddhartha03
            </a>
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["Unsloth", "QLoRA", "Llama 3.2 3B", "Hugging Face", "MSTP Style Guide", "Python", "Ollama"].map(t => (
            <span key={t} style={{
              background: "hsl(260,60%,55%,0.1)",
              border: "1.5px solid hsl(260,60%,55%,0.2)",
              color: "hsl(260,60%,55%)", fontSize: 10, fontWeight: 700,
              padding: "2px 10px", borderRadius: 9999,
            }}>{t}</span>
          ))}
        </div>

        {/* Launch button */}
        {!botOpen && (
          <div style={{ marginTop: "1.25rem" }}>
            <button
              onClick={() => setBotOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700,
                background: "hsl(260,60%,55%)", color: "white",
                border: "none", cursor: "pointer", textDecoration: "none",
                boxShadow: "0 2px 12px hsl(260,60%,55%,0.35)", transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              🚀 Launch Fine-Tuned LLM →
            </button>
          </div>
        )}
      </div>

      {/* Chat demo */}
      {botOpen && <div style={{
        marginTop: "1.5rem",
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "1.2rem",
        overflow: "hidden",
        boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        {/* Chat header */}
        <div style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 10,
          background: "hsl(45,22%,97%)",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444","#f59e0b","#22c55e"].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <span style={{
            fontSize: 11, color: "var(--muted)", fontFamily: "monospace", fontWeight: 600,
          }}>mstp-finetune-bot.py</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "hsl(100,60%,45%)",
              animation: "pulseGlow 2s infinite ease-in-out",
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "hsl(100,40%,38%)" }}>DEMO</span>
            <button
              onClick={() => setBotOpen(false)}
              title="Close"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: "50%",
                border: "1.5px solid var(--border)",
                background: "transparent",
                color: "var(--muted)",
                fontSize: 12, fontWeight: 700,
                cursor: "pointer", lineHeight: 1,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "hsl(0,70%,55%)";
                (e.currentTarget as HTMLButtonElement).style.color = "white";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(0,70%,55%)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              }}
            >✕</button>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{
          padding: "1.25rem",
          height: 320,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animation: `insightCardIn 0.3s ease forwards`,
              }}
            >
              <div style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: msg.role === "user"
                  ? "hsl(210,88%,52%)"
                  : "hsl(45,22%,95%)",
                color: msg.role === "user" ? "white" : "var(--text)",
                fontSize: 12.5,
                lineHeight: 1.7,
                fontWeight: 500,
                whiteSpace: "pre-wrap",
                border: msg.role === "user" ? "none" : "1px solid var(--border)",
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "10px 18px",
                borderRadius: "14px 14px 14px 4px",
                background: "hsl(45,22%,95%)",
                border: "1px solid var(--border)",
                display: "flex", gap: 5, alignItems: "center",
              }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--muted)",
                    animation: `chatPulse 1.2s infinite ${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div style={{
          padding: "1rem 1.25rem",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 8,
          background: "hsl(45,22%,97%)",
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask about MSTP guidelines, style rules, docs standards..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--text)",
              background: "white",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "hsl(260,60%,55%)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: input.trim() && !isTyping ? "hsl(260,60%,55%)" : "hsl(40,14%,85%)",
              color: input.trim() && !isTyping ? "white" : "var(--muted)",
              fontSize: 12,
              fontWeight: 700,
              cursor: input.trim() && !isTyping ? "pointer" : "default",
              transition: "all 0.2s ease",
            }}
          >
            Send
          </button>
        </div>
      </div>}

      {/* Fine-tuning pipeline flow diagram */}
      <div style={{
        marginTop: "1.5rem",
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        padding: isMobile ? "1rem" : "1.25rem 1.5rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s",
      }}>
        {/* Header */}
        <div style={{
          fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "1rem",
        }}>Fine-Tuning Pipeline</div>

        {/* Flow */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "flex-start",
          gap: 0,
        }}>
          {[
            {
              icon: "📚", title: "Training Data", color: "hsl(210,88%,52%)",
              steps: ["Extract MSTP style guide", "Clean & normalise text", "Format as prompt → completion pairs", "Split train / eval sets"],
            },
            {
              icon: "⚡", title: "Fine-Tuning", color: "hsl(100,40%,44%)",
              steps: ["Load Llama 3.2 3B base", "Apply 4-bit QLoRA via Unsloth", "Train on free Colab GPU", "Evaluate on held-out set"],
            },
            {
              icon: "🚀", title: "Deployment", color: "hsl(260,60%,55%)",
              steps: ["Merge LoRA adapters", "Push weights to HF Hub", "Expose via HF Inference API", "Embed in portfolio chatbot"],
            },
          ].map((stage, i, arr) => (
            <div key={stage.title} style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "flex-start",
              flex: 1,
            }}>
              {/* Stage card */}
              <div style={{
                flex: 1,
                borderRadius: "0.7rem",
                border: `1.5px solid ${stage.color}30`,
                borderTop: `3px solid ${stage.color}`,
                padding: "0.85rem 1rem",
                background: `${stage.color}06`,
              }}>
                {/* Stage header */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: 16 }}>{stage.icon}</span>
                  <span style={{
                    fontSize: 11.5, fontWeight: 800, color: stage.color,
                  }}>{stage.title}</span>
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 9, fontWeight: 700,
                    background: `${stage.color}18`,
                    color: stage.color,
                    border: `1px solid ${stage.color}30`,
                    borderRadius: 9999,
                    padding: "1px 7px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>Step {i + 1}</span>
                </div>
                {/* Sub-steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {stage.steps.map((step, si) => (
                    <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{
                        flexShrink: 0, width: 16, height: 16,
                        borderRadius: "50%",
                        background: `${stage.color}18`,
                        border: `1px solid ${stage.color}35`,
                        color: stage.color,
                        fontSize: 8, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1,
                      }}>{si + 1}</span>
                      <span style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow connector between stages */}
              {i < arr.length - 1 && (
                <div
                  className="pipeline-arrow"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: isMobile ? "auto" : 32,
                    height: isMobile ? 24 : "auto",
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 900,
                    color: "var(--muted)",
                    transform: isMobile ? "rotate(90deg)" : "none",
                  }}
                >›</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────


function TypewriterHeading() {
  const full = "Welcome to my AI project page";
  const AI_START = full.indexOf("AI");
  const AI_END = AI_START + 2;
  const displayed = useTypewriter(full, 55);

  const before = displayed.slice(0, AI_START);
  const aiPart = displayed.slice(AI_START, Math.min(displayed.length, AI_END));
  const after  = displayed.slice(AI_END);
  const aiDone = displayed.length >= AI_END;

  return (
    <>
      <style>{`
        @keyframes twBlink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes aiFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes aiColors  {
          0%   { color: hsl(260,60%,55%); }
          25%  { color: hsl(210,88%,52%); }
          50%  { color: hsl(340,80%,55%); }
          75%  { color: hsl(160,60%,42%); }
          100% { color: hsl(260,60%,55%); }
        }
      `}</style>
      {before}
      {aiPart && (
        <span style={{
          display: "inline-block",
          fontStyle: "italic",
          animation: aiDone
            ? "aiFloat 1.6s ease-in-out infinite, aiColors 2.4s linear infinite"
            : "none",
        }}>{aiPart}</span>
      )}
      {after}
      <span style={{
        display: "inline-block",
        width: "2px",
        height: "0.75em",
        background: "var(--text)",
        marginLeft: 3,
        verticalAlign: "middle",
        animation: "twBlink 0.8s step-end infinite",
      }} />
    </>
  );
}


function DocOpsSuiteSection() {
  const { ref, visible } = useReveal(0.1);
  const isMobile = useIsMobile();

  const agents = [
    { icon: "⚙️", color: "hsl(100,40%,44%)", name: "Pipeline Agent", desc: "5-gate sequential workflow — Validate → Structure → Generate → Review → Score" },
    { icon: "🤖", color: "hsl(210,88%,52%)", name: "MCP Agent", desc: "Transforms API specs into Model Context Protocol docs for AI clients like Claude" },
    { icon: "🔧", color: "hsl(16,80%,52%)", name: "Normalizer", desc: "Audits existing API reference content and produces a clean, normalised version" },
    { icon: "📖", color: "hsl(260,60%,55%)", name: "Glossary Builder", desc: "Extracts terms, flags inconsistencies, and proposes canonical definitions" },
  ];

  return (
    <div id="docops-suite" ref={ref} style={{ scrollMarginTop: 80 }}>
      <SectionLabel label="Project 02 · API DocOps" />
      <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />

      {/* Project intro card */}
      <div style={{
        background: "white", border: "1px solid var(--border)", borderRadius: "1.2rem",
        padding: isMobile ? "1.25rem" : "2rem", marginTop: "1.5rem",
        boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: "hsl(100,40%,44%,0.12)", border: "1.5px solid hsl(100,40%,44%,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🗂️</div>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.25, marginBottom: 6 }}>
              API DocOps
            </h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 9999, background: "hsl(100,40%,44%,0.1)", border: "1.5px solid hsl(100,40%,44%,0.22)", color: "hsl(100,40%,38%)" }}>Live Demo</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 9999, background: "hsl(210,88%,52%,0.1)", border: "1.5px solid hsl(210,88%,52%,0.22)", color: "hsl(210,88%,45%)" }}>OpenRouter</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 16 }}>
          <strong style={{ color: "var(--text)" }}>4 AI agents</strong> that convert raw API specifications into complete developer
          documentation. Each agent uses a multi-gate pipeline with a{" "}
          <strong style={{ color: "var(--text)" }}>human approval step at each gate</strong>. Documentation is validated, structured,
          generated, and scored using <strong style={{ color: "var(--text)" }}>NVIDIA Nemotron 3</strong> via OpenRouter, with
          real-time output streamed over <strong style={{ color: "var(--text)" }}>SSE</strong>.
        </p>

        {/* Agent grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: 16 }}>
          {agents.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "hsl(45,22%,97%)", borderRadius: "0.75rem", padding: "0.75rem", border: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${a.color}14`, border: `1px solid ${a.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {["React 19", "Express.js", "SSE Streaming", "OpenRouter", "NVIDIA Nemotron 3", "Vite", "TailwindCSS v4", "TypeScript"].map(t => (
            <span key={t} style={{ background: "hsl(100,40%,44%,0.1)", border: "1.5px solid hsl(100,40%,44%,0.2)", color: "hsl(100,40%,38%)", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 9999 }}>{t}</span>
          ))}
        </div>

        <Link href="/docops">
          <a style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700,
            background: "hsl(100,40%,44%)", color: "white", textDecoration: "none",
            boxShadow: "0 2px 12px hsl(100,40%,44%,0.35)", transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            🚀 Launch API DocOps →
          </a>
        </Link>
      </div>
    </div>
  );
}

export default function AIProjectsPage() {
  const isMobile = useIsMobile();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <FullPagePathAnimation />
      <StickyNav />

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", padding: "5rem 1.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--muted)",
          }}>AI Portfolio · Siddhartha Mani</span>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 9999,
            background: "hsl(260,60%,55%,0.12)", border: "1.5px solid hsl(260,60%,55%,0.3)",
            color: "hsl(260,60%,50%)",
          }}>4 Projects</span>
        </div>
        <h1 style={{ fontSize: isMobile ? "1.5rem" : "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.2, minHeight: "1.3em" }}>
          <TypewriterHeading />
        </h1>
        <p style={{
          marginTop: 14, fontSize: "0.88rem", color: "var(--muted)",
          maxWidth: 560, margin: "14px auto 0", lineHeight: 1.8,
        }}>
          Exploring the intersection of AI, automation, and technical documentation —
          from autonomous content pipelines to fine-tuned language models.
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        <JobRadarProject />
        <DocOpsSuiteSection />
        <MstpFinetune />
        <TechPulseProject />
      </div>

      {/* ── Footer ── */}
      <div style={{
        textAlign: "center", padding: "2rem 1.5rem",
        borderTop: "1px solid var(--border)",
        fontSize: "0.78rem", color: "var(--muted)",
      }}>
        © 2026 Siddhartha Mani · mani.siddhartha@gmail.com
      </div>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
