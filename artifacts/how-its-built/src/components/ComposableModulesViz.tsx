import { useEffect, useState } from "react";

const MODULES = [
  { label: "Find Company URL", icon: "🔍", indent: false },
  { label: "AI Agent", icon: "✦", indent: true },
  { label: "Get Relevant News", icon: "🔍", indent: true },
];

export function ComposableModulesViz({ active, compact }: { active: boolean; compact?: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    let cancelled = false;

    function run() {
      if (cancelled) return;
      setStep(0);
      const timers: ReturnType<typeof setTimeout>[] = [];
      MODULES.forEach((_, i) => {
        timers.push(setTimeout(() => { if (!cancelled) setStep(i + 1); }, 500 + i * 480));
      });
      timers.push(setTimeout(() => { if (!cancelled) run(); }, 500 + MODULES.length * 480 + 1400));
    }
    const init = setTimeout(run, 200);

    return () => { cancelled = true; clearTimeout(init); };
  }, [active]);

  const pad = compact ? "p-4" : "p-7";

  return (
    <div className={`rounded-2xl bg-white border border-border/50 shadow-sm ${pad} w-full`}>
      <div className="space-y-2.5">
        {MODULES.map((mod, i) => (
          <div
            key={mod.label}
            className="flex items-center gap-2"
            style={{
              marginLeft: mod.indent ? 20 : 0,
              opacity: step > i ? 1 : 0,
              transform: step > i ? "translateX(0)" : "translateX(18px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            <div
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-gray-50/80 px-3 py-1.5 flex-1"
              style={{
                boxShadow:
                  mod.indent && i === 1 && step > i
                    ? "0 0 0 2px hsl(100 40% 48% / 0.22)"
                    : "none",
                transition: "box-shadow 0.5s ease",
              }}
            >
              <span
                className="flex items-center justify-center rounded-md flex-shrink-0"
                style={{
                  width: compact ? 22 : 28,
                  height: compact ? 22 : 28,
                  fontSize: compact ? 11 : 13,
                  background: mod.indent
                    ? "hsl(100 40% 48% / 0.14)"
                    : "hsl(210 90% 54% / 0.10)",
                  color: mod.indent ? "hsl(100 40% 35%)" : "hsl(210 90% 40%)",
                }}
              >
                {mod.icon}
              </span>
              <span
                className="font-medium text-foreground"
                style={{ fontSize: compact ? 11 : 13 }}
              >
                {mod.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
