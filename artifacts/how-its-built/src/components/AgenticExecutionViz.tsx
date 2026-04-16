import { useEffect, useState } from "react";

export function AgenticExecutionViz({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1600);
    const reset = setTimeout(() => setPhase(0), 3800);
    return () => [t1, t2, t3, reset].forEach(clearTimeout);
  }, [active, phase === 0]);

  useEffect(() => {
    if (active && phase === 0) {
      const t = setTimeout(() => setPhase(1), 300);
      return () => clearTimeout(t);
    }
  }, [active, phase]);

  const glowScale = phase >= 2 ? 1.18 : 1;
  const glowOpacity = phase >= 2 ? 1 : 0;

  return (
    <div
      className="rounded-2xl bg-white border border-border/60 shadow-sm p-8 w-full max-w-sm flex flex-col items-center justify-center"
      style={{ minHeight: 220 }}
    >
      {/* Horizontal flow */}
      <div className="flex items-center gap-0 w-full">
        {/* Left line */}
        <div
          className="flex-1 h-px"
          style={{
            background: "hsl(100 40% 48%)",
            opacity: phase >= 1 ? 0.6 : 0,
            transition: "opacity 0.5s ease",
          }}
        />

        {/* Center node */}
        <div className="relative flex items-center justify-center">
          {/* glow ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 72,
              height: 72,
              background: "hsl(100 40% 48% / 0.18)",
              transform: `scale(${glowScale})`,
              opacity: glowOpacity,
              transition: "transform 0.6s ease, opacity 0.6s ease",
              filter: "blur(8px)",
            }}
          />
          <div
            className="relative z-10 flex items-center gap-1.5 rounded-xl border px-4 py-2.5 bg-white"
            style={{
              borderColor: phase >= 1 ? "hsl(100 40% 48% / 0.5)" : "hsl(var(--border))",
              boxShadow: phase >= 2 ? "0 0 16px 4px hsl(100 40% 48% / 0.22)" : "none",
              transition: "border-color 0.5s, box-shadow 0.6s",
            }}
          >
            <span
              style={{
                color: "hsl(100 40% 38%)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              ✦
            </span>
            <span className="text-sm font-semibold text-foreground">AI Agent</span>
          </div>
        </div>

        {/* Right line */}
        <div
          className="flex-1 h-px"
          style={{
            background: "hsl(100 40% 48%)",
            opacity: phase >= 1 ? 0.6 : 0,
            transition: "opacity 0.5s ease 0.2s",
          }}
        />
      </div>

      {/* Outgoing signals */}
      <div className="flex gap-6 mt-6">
        {["CRM sync", "Score lead", "Route"].map((label, i) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? "translateY(0)" : "translateY(-10px)",
              transition: `opacity 0.4s ease ${i * 0.12}s, transform 0.4s ease ${i * 0.12}s`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "hsl(100 40% 48%)" }}
            />
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Status label */}
      <div
        className="mt-5 text-xs font-medium rounded-full px-3 py-1"
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
