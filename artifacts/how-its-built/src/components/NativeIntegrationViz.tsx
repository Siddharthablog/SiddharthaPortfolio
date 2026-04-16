import { useEffect, useState } from "react";

const INTEGRATIONS = [
  { label: "HubSpot", color: "#FF7A59", symbol: "H", position: "top" },
  { label: "Salesforce", color: "#00A1E0", symbol: "S", position: "left" },
  { label: "Segment", color: "#52BD95", symbol: "S2", position: "right" },
  { label: "Linear", color: "#5E6AD2", symbol: "L", position: "bottom" },
];

export function NativeIntegrationViz({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!active) { setPhase(0); setPulse(false); return; }
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => { setPhase(3); setPulse(true); }, 1400);
    const reset = setTimeout(() => { setPhase(0); setPulse(false); }, 4000);
    return () => [t1, t2, t3, reset].forEach(clearTimeout);
  }, [active, phase === 0]);

  useEffect(() => {
    if (active && phase === 0) {
      const t = setTimeout(() => setPhase(1), 300);
      return () => clearTimeout(t);
    }
  }, [active, phase]);

  const centerSize = 64;

  return (
    <div
      className="rounded-2xl bg-white border border-border/60 shadow-sm p-8 w-full max-w-sm flex items-center justify-center"
      style={{ minHeight: 240 }}
    >
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        {/* Spokes */}
        {INTEGRATIONS.map((integ, i) => {
          const angle = (i / INTEGRATIONS.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const spokeLen = 72;
          const cx = 110, cy = 110;
          const x2 = cx + Math.cos(rad) * spokeLen;
          const y2 = cy + Math.sin(rad) * spokeLen;

          return (
            <svg
              key={integ.label}
              className="absolute inset-0 pointer-events-none"
              width="220"
              height="220"
            >
              <line
                x1={cx} y1={cy} x2={x2} y2={y2}
                stroke={integ.color}
                strokeWidth="2"
                strokeOpacity="0.45"
                strokeDasharray="5 4"
                style={{
                  opacity: phase >= 2 ? 1 : 0,
                  transition: `opacity 0.4s ease ${i * 0.08}s`,
                }}
              />
            </svg>
          );
        })}

        {/* Integration icons */}
        {INTEGRATIONS.map((integ, i) => {
          const angle = (i / INTEGRATIONS.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const r = 88;
          const x = 110 + Math.cos(rad) * r - 28;
          const y = 110 + Math.sin(rad) * r - 28;

          return (
            <div
              key={integ.label}
              className="absolute flex flex-col items-center gap-1"
              style={{
                left: x,
                top: y,
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
                transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-white"
                style={{
                  background: integ.color + "22",
                  borderColor: integ.color + "55",
                }}
              >
                <span
                  className="font-bold text-lg"
                  style={{ color: integ.color, fontSize: 20, lineHeight: 1 }}
                >
                  {integ.symbol === "H" ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill={integ.color}>
                      <rect x="2" y="4" width="4" height="12" rx="1" />
                      <rect x="8" y="8" width="4" height="4" rx="0.5" />
                      <rect x="14" y="4" width="4" height="12" rx="1" />
                    </svg>
                  ) : integ.symbol === "S" ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3C6.14 3 3 6.14 3 10s3.14 7 7 7 7-3.14 7-7" stroke={integ.color} strokeWidth="2.5" strokeLinecap="round"/>
                      <circle cx="10" cy="10" r="2" fill={integ.color}/>
                    </svg>
                  ) : integ.symbol === "S2" ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill={integ.color}>
                      <path d="M10 3l2.5 4.5H7.5L10 3zm0 14l-2.5-4.5h5L10 17zm-7-7l4.5-2.5v5L3 10zm14 0l-4.5 2.5v-5L17 10z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill={integ.color}>
                      <path d="M5 5h4v4H5zm6 0h4v4h-4zm-6 6h4v4H5zm6 0h4v4h-4z"/>
                    </svg>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* Center hub */}
        <div
          className="absolute flex items-center justify-center rounded-full z-10"
          style={{
            width: centerSize,
            height: centerSize,
            left: 110 - centerSize / 2,
            top: 110 - centerSize / 2,
            background: "hsl(100 40% 48%)",
            boxShadow: pulse
              ? "0 0 0 8px hsl(100 40% 48% / 0.18), 0 0 0 18px hsl(100 40% 48% / 0.09)"
              : "0 0 0 0 transparent",
            transition: "box-shadow 0.7s ease",
            opacity: phase >= 1 ? 1 : 0,
          }}
        >
          <span style={{ color: "white", fontSize: 24, fontWeight: 800 }}>»</span>
        </div>
      </div>
    </div>
  );
}
