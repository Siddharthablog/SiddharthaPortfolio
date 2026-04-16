import { useEffect, useState } from "react";

const SOURCES = ["CRM", "3rd party", "Intent", "Usage"];
const NODES = [0, 1, 2];

export function SemanticWaterfallsViz({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    const reset = setTimeout(() => setPhase(0), 3600);
    return () => [t1, t2, t3, reset].forEach(clearTimeout);
  }, [active, phase === 0]);

  useEffect(() => {
    if (active && phase === 0) {
      const t = setTimeout(() => setPhase(1), 200);
      return () => clearTimeout(t);
    }
  }, [active, phase]);

  return (
    <div
      className="rounded-2xl bg-white border border-border/60 shadow-sm p-6 w-full max-w-sm"
      style={{ minHeight: 220 }}
    >
      {/* Orchestration label */}
      <div className="flex items-start gap-3 mb-2">
        <span
          className="text-[10px] text-muted-foreground font-medium mt-1 whitespace-nowrap"
          style={{ minWidth: 80 }}
        >
          Orchestration
          <br />
          Layer
        </span>

        {/* Source bubbles */}
        <div className="flex gap-2 flex-wrap">
          {SOURCES.map((s, i) => (
            <div
              key={s}
              className="rounded-full px-3 py-1 text-[11px] font-medium border"
              style={{
                background: "hsl(210 40% 96%)",
                borderColor: "hsl(210 30% 82%)",
                color: "hsl(210 30% 40%)",
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "translateY(0)" : "translateY(-10px)",
                transition: `opacity 0.35s ease ${i * 0.1}s, transform 0.35s ease ${i * 0.1}s`,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Connector lines flowing down */}
      <div className="relative flex justify-center my-1" style={{ height: 32 }}>
        {phase >= 2 && (
          <svg width="240" height="32" viewBox="0 0 240 32" fill="none" className="absolute">
            {[30, 85, 140, 195].map((x, i) => (
              <line
                key={i}
                x1={x} y1={0} x2={120} y2={32}
                stroke="hsl(100 40% 55%)"
                strokeWidth="1.5"
                strokeOpacity="0.5"
                strokeDasharray="4 3"
                style={{
                  opacity: phase >= 2 ? 1 : 0,
                  transition: `opacity 0.4s ease ${i * 0.08}s`,
                }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* ICP Mapping label + scoring nodes */}
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] text-muted-foreground font-medium whitespace-nowrap"
          style={{ minWidth: 80 }}
        >
          ICP Mapping
        </span>

        <div className="flex gap-3 flex-1 justify-center">
          {NODES.map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(100 40% 48% / 0.18)",
                border: "2px solid hsl(100 40% 48% / 0.4)",
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? "scale(1)" : "scale(0.6)",
                transition: `opacity 0.4s ease ${i * 0.13}s, transform 0.4s ease ${i * 0.13}s`,
                boxShadow: "0 0 10px 2px hsl(100 40% 48% / 0.2)",
              }}
            >
              <span style={{ fontSize: 14, color: "hsl(100 40% 35%)" }}>◈</span>
            </div>
          ))}
        </div>
      </div>

      {/* Downward arrow */}
      <div className="flex justify-start pl-20 mt-3">
        <div
          style={{
            width: 2,
            height: 20,
            background: "hsl(var(--muted-foreground) / 0.3)",
            borderRadius: 2,
            opacity: phase >= 3 ? 1 : 0,
            transition: "opacity 0.4s ease 0.4s",
          }}
        />
      </div>
    </div>
  );
}
