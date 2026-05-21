import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import "../index.css";
import ChatWidget from "../components/ChatWidget";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HOOKS (same as portfolio)
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
  { label: "Tech Pulse",    id: "tech-pulse" },
  { label: "MSTP Finetune", id: "mstp-finetune" },
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
            background: "none",
            fontSize: 12,
            fontWeight: 700,
            padding: "5px 14px",
            cursor: "pointer",
            color: "var(--muted)",
            textDecoration: "none",
            borderRadius: 9999,
            border: "1.5px solid var(--border)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
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
    <div id="tech-pulse" ref={ref} style={{ scrollMarginTop: 80 }}>
      <SectionLabel label="Project 01 · Tech Pulse" />
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
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 14 }}>
          A fully automated pipeline that scours tech news daily using <strong style={{ color: "var(--text)" }}>Tavily Search</strong>, 
          synthesises insights with <strong style={{ color: "var(--text)" }}>Groq Llama 3.1 70B</strong>, 
          commits structured JSON back to GitHub, and auto-deploys via Vercel — demonstrating autonomous DocOps at scale.
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
      </div>

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
          {[
            { label: "Total Insights", value: `${insights.length}`, color: "hsl(210,88%,52%)" },
            { label: "Sources", value: `${new Set(insights.map(i => i.source)).size}`, color: "hsl(100,40%,44%)" },
            { label: "Categories", value: `${new Set(insights.map(i => i.tag)).size}`, color: "hsl(260,60%,55%)" },
          ].map(s => (
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
            filtered.map((insight, i) => (
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

      {/* Pipeline architecture explainer */}
      <div style={{
        marginTop: "2rem",
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        padding: isMobile ? "1rem" : "1.25rem 1.5rem",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--muted)",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>HOW THIS WORKS</div>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          alignItems: "center",
        }}>
          {[
            { emoji: "⏰", label: "GitHub Actions CRON", color: "hsl(40,10%,30%)" },
            { emoji: "🔍", label: "Tavily Search", color: "hsl(210,88%,52%)" },
            { emoji: "🤖", label: "Groq LLM Synthesis", color: "hsl(260,60%,55%)" },
            { emoji: "📄", label: "JSON Commit", color: "hsl(100,40%,44%)" },
            { emoji: "▲", label: "Vercel Deploy", color: "hsl(0,0%,20%)" },
          ].map((step, i, arr) => (
            <span key={step.label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: step.color + "12",
                border: `1px solid ${step.color}25`,
                color: step.color,
                padding: "3px 9px", borderRadius: 9999,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <span>{step.emoji}</span> {step.label}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: "var(--border)", fontSize: 11, fontWeight: 700, margin: "0 2px" }}>→</span>
              )}
            </span>
          ))}
        </div>
      </div>
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
    { role: "assistant", text: "Hi! I'm MSTP Bot — a fine-tuned Llama model trained on Microsoft Technical Publications data using Unsloth. Ask me anything about technical writing best practices, MSTP guidelines, or documentation standards." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Simulated response — will be replaced with actual Hugging Face Inference API
    setTimeout(() => {
      const responses: Record<string, string> = {
        "default": "That's a great question! Based on MSTP guidelines, I'd recommend following the principles of clarity, consistency, and user-focus. Technical documentation should be task-oriented, use active voice, and include concrete examples wherever possible. Would you like me to elaborate on any specific aspect?",
      };
      setMessages(prev => [...prev, { role: "assistant", text: responses["default"] }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div id="mstp-finetune" ref={ref} style={{ scrollMarginTop: 80 }}>
      <SectionLabel label="Project 02 · MSTP Finetune" />
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 9999,
                background: "hsl(40,90%,52%,0.12)", border: "1.5px solid hsl(40,90%,52%,0.3)",
                color: "hsl(40,90%,42%)", textTransform: "uppercase", letterSpacing: "0.1em",
              }}>Coming Soon</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: 14 }}>
          A Llama model fine-tuned on <strong style={{ color: "var(--text)" }}>Microsoft Technical Publications (MSTP)</strong> style 
          guide data using <strong style={{ color: "var(--text)" }}>Unsloth</strong> for efficient QLoRA training. 
          Hosted on <strong style={{ color: "var(--text)" }}>Hugging Face</strong> and served as an interactive chatbot — 
          demonstrating that a Technical Writer can train, deploy, and integrate custom LLMs.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["Unsloth", "QLoRA", "Llama 3.1", "Hugging Face", "MSTP Style Guide", "Python"].map(t => (
            <span key={t} style={{
              background: "hsl(260,60%,55%,0.1)",
              border: "1.5px solid hsl(260,60%,55%,0.2)",
              color: "hsl(260,60%,55%)", fontSize: 10, fontWeight: 700,
              padding: "2px 10px", borderRadius: 9999,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Chat demo */}
      <div style={{
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
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "hsl(100,60%,45%)",
              animation: "pulseGlow 2s infinite ease-in-out",
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "hsl(100,40%,38%)" }}>DEMO</span>
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
      </div>

      {/* Training architecture */}
      <div style={{
        marginTop: "1.5rem",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: "1rem",
      }}>
        {[
          {
            icon: "📚", title: "Training Data",
            desc: "MSTP style guide extracted, cleaned, and converted to instruction-tuning format (prompt → completion pairs).",
            color: "hsl(210,88%,52%)",
          },
          {
            icon: "⚡", title: "Efficient Fine-Tuning",
            desc: "QLoRA via Unsloth — 4-bit quantisation, 2× faster training, fits on a single free Colab GPU.",
            color: "hsl(100,40%,44%)",
          },
          {
            icon: "🚀", title: "Deployment",
            desc: "Model pushed to Hugging Face Hub. Inference via HF API — zero infrastructure cost.",
            color: "hsl(260,60%,55%)",
          },
        ].map((card, i) => (
          <div key={card.title} style={{
            background: "white",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${card.color}`,
            borderRadius: "0.9rem",
            padding: "1.25rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: `opacity 0.55s ease ${i * 0.12}s, transform 0.55s ease ${i * 0.12}s`,
          }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{card.title}</div>
            <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

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
          }}>2 Projects</span>
        </div>
        <h1 style={{ fontSize: isMobile ? "2rem" : "clamp(2.2rem,5vw,3.2rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.1 }}>
          My AI Projects
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
        <TechPulseProject />
        <MstpFinetune />
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
