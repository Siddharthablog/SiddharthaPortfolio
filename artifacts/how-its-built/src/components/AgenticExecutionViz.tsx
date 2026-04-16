import { useEffect, useState } from "react";

export function AgenticExecutionViz({ active, compact }: { active: boolean; compact?: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    let cancelled = false;

    function run() {
      if (cancelled) return;
      setPhase(0);
      const t1 = setTimeout(() => { if (!cancelled) setPhase(1); }, 300);
      const t2 = setTimeout(() => { if (!cancelled) setPhase(2); }, 900);
      const t3 = setTimeout(() => { if (!cancelled) setPhase(3); }, 1500);
      const reset = setTimeout(() => { if (!cancelled) run(); }, 3600);
      return () => [t1, t2, t3, reset].forEach(clearTimeout);
    }

    const init = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(init); };
  }, [active]);

  return (
    <div
      className="rounded-2xl bg-white border border-border/50 shadow-sm w-full flex flex-col items-center justify-center"
      style={{ padding: compact ? "18px 16px" : "28px 24px", minHeight: compact ? 130 : 180 }}
    >
      {/* Horizontal flow */}
      <div className="flex items-center w-full">
        <div
          className="flex-1 h-px"
          style={{
            background: "hsl(100 40% 48%)",
            opacity: phase >= 1 ? 0.55 : 0,
            transition: "opacity 0.5s ease",
          }}
        />

        <div className="relative flex items-center justify-center mx-2">
          {/* glow */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: compact ? 54 : 70,
              height: compact ? 54 : 70,
              background: "hsl(100 40% 48% / 0.16)",
              transform: `scale(${phase >= 2 ? 1.15 : 1})`,
              opacity: phase >= 2 ? 1 : 0,
              transition: "transform 0.6s ease, opacity 0.6s ease",
              filter: "blur(7px)",
            }}
          />
          <div
            className="relative z-10 flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2"
            style={{
              borderColor: phase >= 1 ? "hsl(100 40% 48% / 0.5)" : "hsl(var(--border))",
              boxShadow: phase >= 2 ? "0 0 14px 3px hsl(100 40% 48% / 0.2)" : "none",
              transition: "border-color 0.5s, box-shadow 0.6s",
              fontSize: compact ? 11 : 13,
            }}
          >
            <span style={{ color: "hsl(100 40% 38%)", fontWeight: 800 }}>✦</span>
            <span className="font-semibold text-foreground">AI Agent</span>
          </div>
        </div>

        <div
          className="flex-1 h-px"
          style={{
            background: "hsl(100 40% 48%)",
            opacity: phase >= 1 ? 0.55 : 0,
            transition: "opacity 0.5s ease 0.2s",
          }}
        />
      </div>

      {/* Outgoing signals */}
      <div className="flex gap-4 mt-4">
        {["CRM sync", "Score lead", "Route"].map((label, i) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? "translateY(0)" : "translateY(-8px)",
              transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(100 40% 48%)" }} />
            <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div
        className="mt-3 text-[9px] font-medium rounded-full px-2.5 py-0.5"
        style={{
          background: "hsl(100 40% 48% / 0.1)",
          color: "hsl(100 40% 35%)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 0.5s ease 0.3s",
        }}
      >
        Coordinating across systems...
      </div>
    </div>
  );
}
