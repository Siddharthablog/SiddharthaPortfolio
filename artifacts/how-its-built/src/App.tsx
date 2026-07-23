import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import "./index.css";
import ChatWidget from "./components/ChatWidget";

const TOOLTIP_MSG = "👆 Click to view my AI projects";

function useTypewriterTooltip() {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let charIndex = 0;
    let typingTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setTimeout>;

    function type() {
      if (charIndex <= TOOLTIP_MSG.length) {
        setText(TOOLTIP_MSG.slice(0, charIndex));
        charIndex++;
        typingTimer = setTimeout(type, 55);
      } else {
        // hold then fade out
        cycleTimer = setTimeout(() => {
          setVisible(false);
          // restart after pause
          cycleTimer = setTimeout(startCycle, 2500);
        }, 2000);
      }
    }

    function startCycle() {
      charIndex = 0;
      setText("");
      setVisible(true);
      typingTimer = setTimeout(type, 300);
    }

    // first appearance after 1.5s
    cycleTimer = setTimeout(startCycle, 1500);

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(cycleTimer);
    };
  }, []);

  return { text, visible };
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

// ── Background Path Animation ─────────────────────────────────────────────────
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

const NAV_LINKS = [
  { label: "Experience",      id: "experience" },
  { label: "Skills",          id: "skills" },
  { label: "Writing Samples", id: "writing" },
];

function TooltipBadge() {
  const { text, visible } = useTypewriterTooltip();
  return (
    <div style={{
      position: "absolute",
      top: "calc(100% + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      background: "white",
      border: "1.5px solid var(--border)",
      borderRadius: 8,
      padding: "5px 11px",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text)",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      zIndex: 99999,
      minWidth: "10ch",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      {/* upward arrow */}
      <span style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderBottom: "7px solid var(--border)",
        display: "block",
      }} />
      <span style={{
        position: "absolute",
        bottom: "calc(100% - 1px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderBottom: "6px solid white",
        display: "block",
      }} />
      {text}<span style={{
        display: "inline-block",
        width: 1.5,
        height: "1em",
        background: "hsl(260,60%,55%)",
        marginLeft: 2,
        verticalAlign: "text-bottom",
        animation: "caretBlink 0.6s step-end infinite",
        opacity: visible ? 1 : 0,
      }} />
    </div>
  );
}

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
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                setActive(id);
              }
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              background: "none",
              border: "none",
              fontSize: 14,
              fontWeight: 900,
              padding: 0,
              cursor: "pointer",
              color: "var(--text)"
            }}
          >
            SM
          </button>
          <div className="ai-btn-wrapper">
            <TooltipBadge />
            <Link href="/ai-projects">
              <a className="ai-projects-btn">
                <span className="btn-robot">🤖</span>
                My AI Projects
              </a>
            </Link>
          </div>
        </div>
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
            {NAV_LINKS.map(({ label, id }) => (
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
          {NAV_LINKS.map(({ label, id }) => (
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

const WRITING_SAMPLES = [
  { icon: "📘", type: "API Reference Documentation", audience: "Developers & Integration Engineers", tags: ["OpenAPI", "Swagger", "Developer Guide"], color: "hsl(210,88%,52%)", link: "https://student-e0a8b063.mintlify.site/api-reference/introduction", desc: "Comprehensive endpoint documentation with request/response examples and authentication details." },
  { icon: "🤖", type: "AI Deployment Guide", audience: "DevOps & AI Engineers", tags: ["Docker", "Google Cloud", "K8"], color: "hsl(260,60%,55%)", link: "https://student-e0a8b063.mintlify.site/essentials/gcaideploymet", desc: "Deploying a Streamlit ML App on Google Cloud with Kubernetes and Grafana." },
  { icon: "📖", type: "User Guide", audience: "End Users & Administrators", tags: ["Task-based", "DITA", "Webhelp"], color: "hsl(100,40%,44%)", link: "#", desc: "Task-oriented instructions and interface breakdowns for end-users and system administrators." },
  { icon: "🧠", type: "RAG System Documentation", audience: "AI Practitioners & Architects", tags: ["RAG", "LangChain", "Docling"], color: "hsl(16,80%,52%)", link: "https://student-e0a8b063.mintlify.site/essentials/mcp-rag", desc: "Architecture deep-dives and implementation guides for Retrieval-Augmented Generation workflows." },
  { icon: "🔧", type: "Fine-Tuning Documentation", audience: "ML Engineers & Researchers", tags: ["LLM", "Fine-tuning", "Python"], color: "hsl(200,80%,44%)", link: "https://student-e0a8b063.mintlify.site/ai-tools/cursor", desc: "Technical reference for fine-tuning Large Language Models on domain-specific datasets." }
];

function WritingSamples() {
  const { ref, visible } = useReveal(0.15);
  const isMobile = useIsMobile();
  return (
    <div id="writing" ref={ref} style={{ padding: "1.5rem 0 0", scrollMarginTop: 80 }}>
      <SectionLabel label="Writing Samples" />
      <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
      <p style={{ marginTop: "1.5rem", marginBottom: "1.25rem", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.8 }}>
        A selection of documentation styles across domains — from developer-focused API references to AI deployment guides.
      </p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {WRITING_SAMPLES.map((sample, i) => (
          <div key={sample.type} style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 6 : 14,
            padding: isMobile ? "0.85rem 0.9rem" : "0.75rem 1rem",
            borderBottom: "1px solid var(--border)",
            borderLeft: `3px solid ${sample.color}`,
            background: "white",
            borderRadius: i === 0 ? "0.7rem 0.7rem 0 0" : i === WRITING_SAMPLES.length - 1 ? "0 0 0.7rem 0.7rem" : "0",
            opacity: 0,
            animation: visible ? `fadeUp 0.4s ease ${i * 0.06}s forwards` : "none",
          }}>

            {isMobile ? (
              /* ── Mobile layout ── */
              <>
                {/* Row 1: icon + title + link */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{sample.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sample.type}
                    </div>
                    <div style={{ fontSize: 10, color: sample.color, fontWeight: 600, marginTop: 1 }}>
                      For: {sample.audience}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {sample.link === "#" ? (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--muted)", opacity: 0.5 }}>
                        Coming soon
                      </span>
                    ) : (
                      <a href={sample.link} target="_blank" rel="noopener noreferrer"
                        className="read-sample-link" style={{ color: sample.color, fontSize: 10, padding: "3px 8px" }}>
                        Read →
                      </a>
                    )}
                  </div>
                </div>
                {/* Row 2: tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 30 }}>
                  {sample.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 9, background: `${sample.color}1E`, color: sample.color,
                      padding: "2px 7px", borderRadius: 9999, fontWeight: 600, whiteSpace: "nowrap",
                    }}>{tag}</span>
                  ))}
                </div>
              </>
            ) : (
              /* ── Desktop layout ── */
              <>
                {/* Icon */}
                <span style={{ fontSize: "1.2rem", flexShrink: 0, width: 28, textAlign: "center" }}>{sample.icon}</span>

                {/* Title + audience */}
                <div style={{ flex: "0 0 220px", minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sample.type}
                  </div>
                  <div style={{ fontSize: 10, color: sample.color, fontWeight: 600, marginTop: 1 }}>
                    For: {sample.audience}
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                  {sample.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 9.5, background: `${sample.color}1E`, color: sample.color,
                      padding: "2px 8px", borderRadius: 9999, fontWeight: 600, whiteSpace: "nowrap",
                    }}>{tag}</span>
                  ))}
                </div>

                {/* Link */}
                <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                  {sample.link === "#" ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", opacity: 0.5, whiteSpace: "nowrap" }}>
                      Coming soon
                    </span>
                  ) : (
                    <a href={sample.link} target="_blank" rel="noopener noreferrer"
                      className="read-sample-link" style={{ color: sample.color }}>
                      Read sample
                      <span className="read-sample-arrow">→</span>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatIDeliver() {
  const { ref, visible } = useReveal(0.12);
  const isMobile = useIsMobile();
  return (
    <div ref={ref} style={{ padding: "4rem 0 0" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
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
  "Author API, CLI, and developer guides for IBM Cloud Power Virtual Server",
  "Collaborate with AI documentation architects to restructure content for LLM and chatbot consumption",
  "Automated obsolete version docs with Python + Ollama — reduced 3-day process to under 4 hours",
  "Deployed Streamlit + RAG peer-review system, reducing peer-review time by 40%",
  "Apply DITAVAL profiling across 6 IBM Power Server models — reduced content duplication by 65%",
  "Use local LLM inference (Ollama) to improve content accuracy, consistency, and end-user experience",
  "Align IBM Cloud documentation with product roadmap across multiple Engineering and PM teams",
  "Explore Langflow and n8n to scale DocOps workflows and documentation automation",
  "Mentor junior writers through knowledge transfer sessions; perform peer reviews for IBM Cloud doc sets",
  "Participate in hackathons, Hacktoberfest, and open-source AI documentation initiatives",
];
function IbmViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={IBM_RESP} color="hsl(210,88%,52%)" />; }

const XYLEM_RESP = [
  "Owned end-to-end IoT documentation for cloud platforms, applications, and gateways",
  "Collaborated with developers in source code to produce Swagger/OpenAPI documentation",
  "Provided documentation demos to stakeholders after each two-week sprint",
  "Operated in an agile environment with sprint planning and review cycles",
  "Deliverables: API docs, Developer Guide, Integration Guide, Release Notes, UAT Guide",
];
function XylemViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={XYLEM_RESP} color="hsl(200,80%,44%)" />; }

const UNISYS_RESP = [
  "Delivered end-to-end documentation for Data Center application software and Air Cargo software",
  "Created DITAVAL files in XML for generating client-specific webhelp outputs",
  "Analysed user stories and updated webhelp content accordingly",
  "Deliverables: Webhelp, Administration & Operational Guide, Release Notes, Installation Guide",
  "Domain: Cloud Computing, Supply Chain Management",
];
function UnisysViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={UNISYS_RESP} color="hsl(260,55%,55%)" />; }

const KREATIO_RESP = [
  "Authored technical documentation for Kreatio CMS and ERP software products",
  "Designed website wireframes based on Project Manager inputs",
  "Produced Kreatio Enterprise Resource Planning (ERP) video tutorials for clients",
  "Domain: CMS, ERP Systems",
];
function KreatioViz(_?: { active?: boolean }) { return <ResponsibilitiesViz items={KREATIO_RESP} color="hsl(16,80%,52%)" />; }

// ─────────────────────────────────────────────────────────────────────────────
// SKILLS animated viz
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_GROUPS = [
  { label: "Markup & Programming", color: "hsl(210,88%,52%)", items: ["DITA","XML","Markdown","YAML","JSON","HTML","JavaScript","reStructuredText","Python"] },
  { label: "Authoring Tools",      color: "hsl(100,40%,44%)", items: ["Arbortext Editor","Oxygen XML","Acrolinx","VS Code"] },
  { label: "AI Frameworks",        color: "hsl(260,60%,55%)", items: ["LangChain","LangGraph","Streamlit","Docling","RAG","MCP","Ollama"] },
  { label: "CCMS & Content",       color: "hsl(40,90%,52%)",  items: ["Astoria","Contenta","DITAVAL","Single Sourcing","Info Mapping"] },
  { label: "CI/CD & Collaboration",color: "hsl(200,80%,44%)", items: ["Jenkins","GitHub","JIRA","Confluence","Swagger"] },
  { label: "Graphics & Media",     color: "hsl(0,70%,55%)",   items: ["draw.io","Clipchamp","TechSmith Camtasia"] },
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
  const isMobile = useIsMobile();
  const { Viz } = r;
  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "flex-start", 
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "1.5rem" : "3.5rem",
      padding: isMobile ? "2.5rem 0" : "4.5rem 0",
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      {/* Left */}
      <div style={{
        flex: isMobile ? "none" : "0 0 290px",
        width: isMobile ? "100%" : undefined,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : isMobile ? "translateY(-12px)" : "translateX(-26px)",
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
        width: isMobile ? "100%" : undefined,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : isMobile ? "translateY(12px)" : "translateX(30px)",
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
    items: ["RAG systems · Agentic AI","Prompt templates","LLM integration docs"],
    color: "hsl(210,88%,52%)",
  },
  {
    icon: "📄",
    title: "Structured Content",
    items: ["DITA · XML · DITAVAL","Markdown · YAML · JSON","reStructuredText · CCMS"],
    color: "hsl(100,40%,44%)",
  },
  {
    icon: "⚙️",
    title: "AI Automation",
    items: ["Python · LangChain · LangGraph","Streamlit · Docling · MCP","Ollama · n8n · Langflow"],
    color: "hsl(40,90%,52%)",
  },
  {
    icon: "🎓",
    title: "Certifications",
    items: ["Agentic AI Bootcamp · 2025","Technical Writing (TWB)","Docker · Hybrid Cloud"],
    color: "hsl(260,60%,55%)",
  },
  {
    icon: "⚡",
    title: "Community",
    items: ["WatsonX Agentic AI Hackathon","Hacktoberfest contributor","Dev.to · Medium blogger"],
    color: "hsl(40,90%,48%)",
  },
  {
    icon: "🐙",
    title: "Open Source Docs",
    items: ["FletX · Requestly","Ansible AMQ · Terraform","WatsonX AI"],
    color: "hsl(100,40%,44%)",
  },
];

// ── Key Achievements ──────────────────────────────────────────────────────────
const KEY_ACHIEVEMENTS = [
  {
    stat: "3 days → 4 hrs",
    label: "Automated archival",
    desc: "Python + Ollama solution for identifying and removing version-specific DITA content",
    color: "hsl(100,40%,44%)",
    icon: "⚡",
  },
  {
    stat: "40% faster",
    label: "Peer-review time",
    desc: "Streamlit + Python + Ollama + Docling RAG system for style guide enforcement and review automation",
    color: "hsl(210,88%,52%)",
    icon: "🤖",
  },
  {
    stat: "65% less",
    label: "Content duplication",
    desc: "Managed docs across 6 IBM Power Server models using DITAVAL profiling from a single source",
    color: "hsl(260,60%,55%)",
    icon: "🗂",
  },
];

function KeyAchievements() {
  const { ref, visible } = useReveal(0.15);
  const isMobile = useIsMobile();
  return (
    <div ref={ref} style={{ marginTop: "2.5rem" }}>
      <div style={{
        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.18em", color: "var(--muted)", marginBottom: 14,
        paddingLeft: 2,
      }}>Key Achievements</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "1rem" }}>
        {KEY_ACHIEVEMENTS.map((a, i) => (
          <div key={a.label} style={{
            background: "white",
            border: `1.5px solid ${a.color}28`,
            borderTop: `3px solid ${a.color}`,
            borderRadius: "0.9rem",
            padding: "1.25rem 1.25rem 1rem",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(18px)",
            transition: `opacity 0.55s ease ${i * 0.12}s, transform 0.55s ease ${i * 0.12}s`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{
                fontSize: "1.55rem", fontWeight: 900, color: a.color,
                letterSpacing: "-0.02em", lineHeight: 1,
              }}>{a.stat}</div>
              <span style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: a.color + "14", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 15,
              }}>{a.icon}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>{a.label}</div>
            <p style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.65 }}>{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickHighlights() {
  const { ref, visible } = useReveal(0.15);
  const isMobile = useIsMobile();
  return (
    <div ref={ref} style={{
      background: "white",
      border: "1px solid var(--border)",
      borderRadius: "1.2rem",
      padding: isMobile ? "1.25rem 1.25rem 1rem" : "2rem 2rem 1.5rem",
      marginTop: "3rem",
      boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
    }}>
      <h3 style={{
        fontSize: 13, fontWeight: 800, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--muted)", marginBottom: 20,
      }}>Quick Highlights</h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
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

function VideoShowcase() {
  const { ref, visible } = useReveal(0.15);
  return (
    <div ref={ref} style={{
      marginTop: "1.5rem",
      marginBottom: "1rem",
      borderRadius: "1.2rem", 
      overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow: "0 4px 30px rgba(0,0,0,0.08)",
      background: "black",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.6s ease, transform 0.6s ease"
    }}>
      <video 
        width="100%" 
        controls 
        autoPlay 
        muted 
        loop
        playsInline
        style={{ display: "block", outline: "none" }}
      >
        <source src="/showcase.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
  const EXP: RowDef[] = [
    {
      title: "IBM Labs R&D — Technical Content Professional",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>Sep 2022 — Present · 11+ yrs overall</strong>
          <em style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Domain: Hybrid Cloud · Data Center Server</em>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Projects:</strong><br />
            • IBM Cloud: Power Virtual Server <Tag label="Hybrid Cloud" color="hsl(210,88%,52%)" /><br />
            • IBM Server <Tag label="Power10" color="hsl(100,40%,44%)" /><Tag label="Power11" color="hsl(100,40%,44%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Tools:</strong><br />
            <Tag label="DITA" color="hsl(210,88%,52%)" /><Tag label="Oxygen XML" color="hsl(210,88%,52%)" />
            <Tag label="Acrolinx" color="hsl(210,88%,52%)" /><Tag label="Python" color="hsl(100,40%,44%)" />
            <Tag label="Ollama" color="hsl(100,40%,44%)" /><Tag label="Streamlit" color="hsl(100,40%,44%)" />
            <Tag label="LangChain" color="hsl(260,60%,55%)" /><Tag label="Jenkins" color="hsl(40,90%,50%)" />
            <Tag label="GitHub" color="hsl(40,90%,50%)" /><Tag label="JIRA" color="hsl(40,90%,50%)" />
          </div>
        </>
      ),
      Viz: IbmViz,
    },
    {
      title: "Xylem India R&D — Lead Technical Writer",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>Jun 2020 — Sep 2022</strong>
          <em style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Domain: IoT Cloud · IoT Application</em>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Projects:</strong><br />
            • Xylem Cloud <Tag label="IoT Cloud" color="hsl(200,80%,44%)" /><br />
            • Xylem Visenti <Tag label="IoT Software" color="hsl(200,80%,44%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Tools:</strong><br />
            <Tag label="Astoria CCMS" color="hsl(200,80%,44%)" /><Tag label="Swagger" color="hsl(200,80%,44%)" />
            <Tag label="Confluence" color="hsl(200,80%,44%)" /><Tag label="JIRA" color="hsl(200,80%,44%)" />
            <Tag label="Acrolinx" color="hsl(200,80%,44%)" />
          </div>
        </>
      ),
      Viz: XylemViz,
    },
    {
      title: "Unisys India R&D — Product Information Specialist",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>Apr 2017 — May 2020</strong>
          <em style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Domain: Cloud Computing · Supply Chain Management</em>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Projects:</strong><br />
            • ClearPath Forward! <Tag label="Data Center Mgmt" color="hsl(260,55%,55%)" /><br />
            • Digistics <Tag label="Air Cargo Mgmt" color="hsl(260,55%,55%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Tools:</strong><br />
            <Tag label="XML" color="hsl(260,55%,55%)" /><Tag label="DITA" color="hsl(260,55%,55%)" />
            <Tag label="Oxygen XML" color="hsl(260,55%,55%)" /><Tag label="DITAVAL" color="hsl(260,55%,55%)" />
          </div>
        </>
      ),
      Viz: UnisysViz,
    },
    {
      title: "Kreatio — Technical Writer",
      desc: (
        <>
          <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>Jan 2015 — Mar 2017</strong>
          <em style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Domain: CMS · ERP Systems</em>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Products:</strong><br />
            • Kreatio CMS <Tag label="Content Management" color="hsl(16,80%,52%)" /><br />
            • Kreatio ERP <Tag label="Enterprise Resource Planning" color="hsl(16,80%,52%)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--text)" }}>Delivered:</strong><br />
            <Tag label="Technical Docs" color="hsl(16,80%,52%)" />
            <Tag label="Website Wireframes" color="hsl(16,80%,52%)" />
            <Tag label="Video Tutorials" color="hsl(16,80%,52%)" />
          </div>
        </>
      ),
      Viz: KreatioViz,
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
      <FullPagePathAnimation />
      <StickyNav />

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", padding: "5rem 1.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--muted)",
          }}>Technical Content Professional · IBM Labs</span>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 9999,
            background: "hsl(100,40%,44%,0.12)", border: "1.5px solid hsl(100,40%,44%,0.3)",
            color: "hsl(100,40%,38%)",
          }}>11+ years experience</span>
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.2rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.1 }}>
          Siddhartha Mani
        </h1>
        <p style={{
          marginTop: 14, fontSize: "0.88rem", color: "var(--muted)",
          maxWidth: 560, margin: "14px auto 0", lineHeight: 1.8,
        }}>
          Technical Writer and AI Documentation Specialist with expertise in RAG systems, Agentic AI, and DocOps automation. Seeking a leadership role to design AI-driven documentation strategies and mentor teams in modern documentation practices.
          <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
            Open to: Remote &amp; Full-time
          </span>
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <div className="ai-btn-wrapper">
            <TooltipBadge />
            <Link href="/ai-projects">
              <a className="ai-projects-btn" style={{ fontSize: "0.82rem", padding: "10px 22px" }}>
                <span className="btn-robot">🤖</span>
                My AI Projects
              </a>
            </Link>
          </div>
          {[
            { label: "Hire me",  href: "mailto:mani.siddhartha@gmail.com" },
            { label: "Résumé",   href: "/resume.pdf" },
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
        <div id="skills" style={{ scrollMarginTop: 80 }}>
          <SectionLabel label="Skills & Tools" />
          <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
          {SKILLS.map((r, i) => <Row key={r.title} r={r} last={i === SKILLS.length - 1} />)}
        </div>

        {/* Key Achievements */}
        <KeyAchievements />

        {/* Experience */}
        <div id="experience" style={{ scrollMarginTop: 80 }}>
          <SectionLabel label="Professional Experience" />
          <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
          {EXP.map((r, i) => <Row key={r.title} r={r} last={i === EXP.length - 1} />)}
        </div>
        {/* Video Portfolio */}
        <VideoShowcase />

        {/* Writing Samples */}
        <WritingSamples />

        {/* What I Deliver */}
        <SectionLabel label="What I Deliver" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        <WhatIDeliver />

        {/* Education & Certifications */}
        <SectionLabel label="Education & Certifications" />
        <div style={{ height: 1, background: "var(--border)", marginTop: "0.5rem" }} />
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "1.25rem",
          padding: "1.25rem 0 2rem",
        }}>
          {/* Left: Education */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{
              fontSize: 9, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.14em", color: "var(--muted)", marginBottom: 2, paddingLeft: 2,
            }}>Education</div>
            {[
              { icon: "🎓", type: "DEGREE", title: "BE Computer Science", sub: "Dayananda Sagar College, Bangalore · 2014", color: "hsl(210,88%,52%)" },
              { icon: "📜", type: "CERT", title: "Technical Writing", sub: "The Writers Block (TWB) · 2015", color: "hsl(100,40%,44%)" },
              { icon: "🤖", type: "CERT", title: "Agentic AI Bootcamp", sub: "LangGraph & LangChain · 2025", color: "hsl(260,60%,55%)" },
              { icon: "🔄", type: "CERT", title: "EXIN Agile Scrum Master", sub: "Agile & Scrum · 2022", color: "hsl(16,80%,52%)" },
            ].map(e => (
              <div key={e.title} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "white", borderRadius: "0.75rem",
                borderLeft: `3px solid ${e.color}`,
                padding: "0.6rem 1rem",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${e.color}14`, border: `1px solid ${e.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}>{e.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{e.title}</span>
                    <span style={{
                      fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "1px 6px", borderRadius: 4,
                      background: `${e.color}14`, border: `1px solid ${e.color}28`,
                      color: e.color, flexShrink: 0,
                    }}>{e.type}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{e.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Certifications & Achievements */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{
              fontSize: 9, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.14em", color: "var(--muted)", marginBottom: 2, paddingLeft: 2,
            }}>Certifications & Achievements</div>
            {[
              { icon: "🐳", type: "CERT", title: "Docker Essentials", sub: "Containerization fundamentals", color: "hsl(200,80%,44%)" },
              { icon: "☁️", type: "CERT", title: "Hybrid Cloud Essentials", sub: "Data Center & Cloud Infrastructure", color: "hsl(40,90%,52%)" },
              { icon: "📡", type: "CERT", title: "APIs with JSON", sub: "API and CLI Documentation · 2017", color: "hsl(16,80%,52%)" },
              { icon: "🏆", type: "HACKATHON", title: "IBMer watsonx Challenge", sub: "Runner-up · 2025", color: "hsl(260,60%,55%)" },
            ].map(e => (
              <div key={e.title} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "white", borderRadius: "0.75rem",
                borderLeft: `3px solid ${e.color}`,
                padding: "0.6rem 1rem",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${e.color}14`, border: `1px solid ${e.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}>{e.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{e.title}</span>
                    <span style={{
                      fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "1px 6px", borderRadius: 4,
                      background: `${e.color}14`, border: `1px solid ${e.color}28`,
                      color: e.color, flexShrink: 0,
                    }}>{e.type}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{e.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "2rem 1.5rem",
        borderTop: "1px solid var(--border)",
        fontSize: "0.78rem", color: "var(--muted)",
      }}>
        © 2026 Siddhartha Mani · mani.siddhartha@gmail.com
      </div>

      {/* AI Chat Widget — always floats on top */}
      <ChatWidget />
    </div>
  );
}
