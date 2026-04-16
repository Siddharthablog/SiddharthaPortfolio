import { useEffect, useState } from "react";

const MODULES = [
  { label: "Find Company URL", icon: "🔍", delay: 0 },
  { label: "AI Agent", icon: "✦", delay: 0.35, indent: true },
  { label: "Get Relevant News", icon: "🔍", delay: 0.7, indent: true },
];

export function ComposableModulesViz({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    MODULES.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), 400 + i * 420));
    });
    // loop
    const loop = setTimeout(() => setStep(0), 400 + MODULES.length * 420 + 1200);
    return () => { timers.forEach(clearTimeout); clearTimeout(loop); };
  }, [active, step === 0 && active]);

  useEffect(() => {
    if (!active || step !== 0) return;
    const t = setTimeout(() => setStep(1), 300);
    return () => clearTimeout(t);
  }, [active, step]);

  return (
    <div
      className="rounded-2xl bg-white border border-border/60 shadow-sm p-7 w-full max-w-sm"
      style={{ minHeight: 220 }}
    >
      <div className="space-y-3">
        {MODULES.map((mod, i) => {
          const visible = step > i;
          return (
            <div
              key={mod.label}
              className="flex items-center gap-3"
              style={{
                marginLeft: mod.indent ? 28 : 0,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(24px)",
                transition: "opacity 0.45s ease, transform 0.45s ease",
              }}
            >
              {/* connector line for indented items */}
              {mod.indent && (
                <div
                  className="absolute"
                  style={{
                    left: 28,
                    width: 2,
                    height: 24,
                    background: "hsl(100 40% 48% / 0.35)",
                    borderRadius: 2,
                    marginTop: -24,
                  }}
                />
              )}
              <div
                className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-gray-50 px-3 py-2 flex-1"
                style={{
                  boxShadow: mod.indent && i === 1 && visible
                    ? "0 0 0 2px hsl(100 40% 48% / 0.25)"
                    : "none",
                  transition: "box-shadow 0.6s ease",
                }}
              >
                <span
                  className="flex items-center justify-center rounded-md w-7 h-7 text-sm"
                  style={{
                    background: mod.indent ? "hsl(100 40% 48% / 0.15)" : "hsl(210 90% 54% / 0.12)",
                    color: mod.indent ? "hsl(100 40% 35%)" : "hsl(210 90% 40%)",
                  }}
                >
                  {mod.icon}
                </span>
                <span className="text-sm font-medium text-foreground">{mod.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* animated connector lines */}
      <svg
        className="absolute pointer-events-none"
        style={{ top: 0, left: 0, width: "100%", height: "100%" }}
        aria-hidden
      />
    </div>
  );
}
