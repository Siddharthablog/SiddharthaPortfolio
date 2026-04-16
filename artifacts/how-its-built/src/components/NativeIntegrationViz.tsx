import { useEffect, useState } from "react";

const INTEGRATIONS = [
  { label: "HubSpot", color: "#FF7A59" },
  { label: "Salesforce", color: "#00A1E0" },
  { label: "Segment", color: "#52BD95" },
  { label: "Linear", color: "#5E6AD2" },
];

export function NativeIntegrationViz({ active, compact }: { active: boolean; compact?: boolean }) {
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
      const reset = setTimeout(() => { if (!cancelled) run(); }, 4000);
      return () => [t1, t2, t3, reset].forEach(clearTimeout);
    }

    const init = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(init); };
  }, [active]);

  const containerSize = compact ? 180 : 220;
  const orbitR = compact ? 64 : 82;
  const iconSize = compact ? 38 : 48;
  const hubSize = compact ? 50 : 62;
  const cx = containerSize / 2;
  const cy = containerSize / 2;

  return (
    <div
      className="rounded-2xl bg-white border border-border/50 shadow-sm w-full flex items-center justify-center"
      style={{ padding: compact ? "10px" : "20px", minHeight: compact ? 130 : 170 }}
    >
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* SVG spokes */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={containerSize}
          height={containerSize}
        >
          {INTEGRATIONS.map((integ, i) => {
            const angle = (i / INTEGRATIONS.length) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x2 = cx + Math.cos(rad) * orbitR;
            const y2 = cy + Math.sin(rad) * orbitR;
            return (
              <line
                key={integ.label}
                x1={cx} y1={cy}
                x2={x2} y2={y2}
                stroke={integ.color}
                strokeWidth="1.5"
                strokeOpacity={phase >= 2 ? 0.45 : 0}
                strokeDasharray="4 3"
                style={{ transition: `stroke-opacity 0.4s ease ${i * 0.08}s` }}
              />
            );
          })}
        </svg>

        {/* Integration icons around orbit */}
        {INTEGRATIONS.map((integ, i) => {
          const angle = (i / INTEGRATIONS.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = cx + Math.cos(rad) * orbitR - iconSize / 2;
          const y = cy + Math.sin(rad) * orbitR - iconSize / 2;

          const IconSVG = ({ color }: { color: string }) => {
            if (i === 0) return (
              <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 20 20" fill={color}>
                <rect x="2" y="4" width="4" height="12" rx="1" />
                <rect x="8" y="8" width="4" height="4" rx="0.5" />
                <rect x="14" y="4" width="4" height="12" rx="1" />
              </svg>
            );
            if (i === 1) return (
              <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 20 20" fill="none">
                <path d="M10 3C6.14 3 3 6.14 3 10s3.14 7 7 7 7-3.14 7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="2" fill={color}/>
              </svg>
            );
            if (i === 2) return (
              <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 20 20" fill={color}>
                <path d="M10 3l2.5 4.5H7.5L10 3zm0 14l-2.5-4.5h5L10 17zm-7-7l4.5-2.5v5L3 10zm14 0l-4.5 2.5v-5L17 10z"/>
              </svg>
            );
            return (
              <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 20 20" fill={color}>
                <path d="M5 5h4v4H5zm6 0h4v4h-4zm-6 6h4v4H5zm6 0h4v4h-4z"/>
              </svg>
            );
          };

          return (
            <div
              key={integ.label}
              className="absolute flex items-center justify-center rounded-xl border"
              style={{
                left: x,
                top: y,
                width: iconSize,
                height: iconSize,
                background: integ.color + "18",
                borderColor: integ.color + "50",
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "scale(1)" : "scale(0.4)",
                transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
              }}
            >
              <IconSVG color={integ.color} />
            </div>
          );
        })}

        {/* Center hub */}
        <div
          className="absolute flex items-center justify-center rounded-full z-10 flex-shrink-0"
          style={{
            width: hubSize,
            height: hubSize,
            left: cx - hubSize / 2,
            top: cy - hubSize / 2,
            background: "hsl(100 40% 48%)",
            opacity: phase >= 1 ? 1 : 0,
            boxShadow: phase >= 3
              ? "0 0 0 7px hsl(100 40% 48% / 0.16), 0 0 0 16px hsl(100 40% 48% / 0.08)"
              : "0 0 0 0px transparent",
            transition: "box-shadow 0.7s ease, opacity 0.4s ease",
          }}
        >
          <span style={{ color: "white", fontSize: compact ? 20 : 26, fontWeight: 800, lineHeight: 1 }}>»</span>
        </div>
      </div>
    </div>
  );
}
