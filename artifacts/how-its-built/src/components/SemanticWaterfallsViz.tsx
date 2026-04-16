import { useEffect, useState } from "react";

const SOURCES = ["CRM", "3rd party", "Intent", "Usage"];

export function SemanticWaterfallsViz({ active, compact }: { active: boolean; compact?: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    let cancelled = false;

    function run() {
      if (cancelled) return;
      setPhase(0);
      const t1 = setTimeout(() => { if (!cancelled) setPhase(1); }, 200);
      const t2 = setTimeout(() => { if (!cancelled) setPhase(2); }, 800);
      const t3 = setTimeout(() => { if (!cancelled) setPhase(3); }, 1400);
      const reset = setTimeout(() => { if (!cancelled) run(); }, 3500);
      return () => [t1, t2, t3, reset].forEach(clearTimeout);
    }

    const init = setTimeout(run, 200);
    return () => { cancelled = true; clearTimeout(init); };
  }, [active]);

  const fs = compact ? 10 : 13;

  return (
    <div
      className="rounded-2xl bg-white border border-border/50 shadow-sm w-full"
      style={{ padding: compact ? "14px 16px" : "22px 24px" }}
    >
      {/* Row 1: Orchestration + bubbles */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-muted-foreground font-medium flex-shrink-0 leading-tight"
          style={{ fontSize: compact ? 9 : 11, minWidth: 64 }}
        >
          Orchestration
          <br />Layer
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {SOURCES.map((s, i) => (
            <div
              key={s}
              className="rounded-full px-2 py-0.5 font-medium border"
              style={{
                fontSize: compact ? 9 : 11,
                background: "hsl(210 40% 96%)",
                borderColor: "hsl(210 30% 82%)",
                color: "hsl(210 30% 40%)",
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "translateY(0)" : "translateY(-8px)",
                transition: `opacity 0.35s ease ${i * 0.09}s, transform 0.35s ease ${i * 0.09}s`,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Connector lines */}
      <div className="relative flex justify-center" style={{ height: 28, marginLeft: 72 }}>
        <svg width="180" height="28" viewBox="0 0 180 28" fill="none" className="absolute">
          {[16, 56, 96, 136].map((x, i) => (
            <line
              key={i}
              x1={x} y1={0} x2={90} y2={28}
              stroke="hsl(100 40% 55%)"
              strokeWidth="1.5"
              strokeOpacity={phase >= 2 ? 0.5 : 0}
              strokeDasharray="4 3"
              style={{ transition: `stroke-opacity 0.4s ease ${i * 0.07}s` }}
            />
          ))}
        </svg>
      </div>

      {/* Row 2: ICP Mapping + nodes */}
      <div className="flex items-center gap-2">
        <span
          className="text-muted-foreground font-medium flex-shrink-0"
          style={{ fontSize: compact ? 9 : 11, minWidth: 64 }}
        >
          ICP Mapping
        </span>
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full flex items-center justify-center"
              style={{
                width: compact ? 32 : 40,
                height: compact ? 32 : 40,
                background: "hsl(100 40% 48% / 0.16)",
                border: "2px solid hsl(100 40% 48% / 0.38)",
                fontSize: compact ? 12 : 15,
                color: "hsl(100 40% 35%)",
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? "scale(1)" : "scale(0.5)",
                transition: `opacity 0.4s ease ${i * 0.12}s, transform 0.4s ease ${i * 0.12}s`,
                boxShadow: "0 0 9px 2px hsl(100 40% 48% / 0.18)",
              }}
            >
              ◈
            </div>
          ))}
        </div>
      </div>

      {/* Arrow down */}
      <div style={{ marginLeft: 76, marginTop: 6 }}>
        <div
          style={{
            width: 2,
            height: 16,
            background: "hsl(var(--muted-foreground) / 0.25)",
            borderRadius: 2,
            opacity: phase >= 3 ? 1 : 0,
            transition: "opacity 0.4s ease 0.4s",
          }}
        />
      </div>
    </div>
  );
}
