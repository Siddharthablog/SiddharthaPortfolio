import { useEffect, useRef, useState } from "react";
import "./index.css";
import { ComposableModulesViz } from "./components/ComposableModulesViz";
import { AgenticExecutionViz } from "./components/AgenticExecutionViz";
import { SemanticWaterfallsViz } from "./components/SemanticWaterfallsViz";
import { NativeIntegrationViz } from "./components/NativeIntegrationViz";

const sections = [
  {
    id: "composable",
    title: "Composable AI Modules",
    description:
      "Each workflow is made up of plug-and-play data-action modules — enrichment, deduplication, scoring, routing, automated by AI.",
    viz: ComposableModulesViz,
  },
  {
    id: "agentic",
    title: "Agentic Execution",
    description:
      "Our agents don't just follow scripts. They understand your ICP, coordinate across systems, and evolve with your GTM.",
    viz: AgenticExecutionViz,
  },
  {
    id: "semantic",
    title: "Semantic Data Waterfalls",
    description:
      "We orchestrate, filter, and score data using your ICP and motion logic, not generic firmographics.",
    viz: SemanticWaterfallsViz,
  },
  {
    id: "native",
    title: "Native Integration (in out the GTM stack)",
    description:
      "Bi-directional sync across your CRM, MAP, CDP, enrichment sources, and major LLMs. Built-in prompt engineering.",
    viz: NativeIntegrationViz,
  },
];

function useIntersection(ref: React.RefObject<Element | null>, threshold = 0.4) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function Section({
  section,
  index,
}: {
  section: (typeof sections)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<Element>, 0.3);
  const Viz = section.viz;

  return (
    <div
      ref={ref}
      className="flex flex-col md:flex-row items-center gap-10 md:gap-16 py-20 md:py-28"
      style={{ minHeight: "min(80vh, 540px)" }}
    >
      {/* Left: Text */}
      <div
        className="flex-1 max-w-sm"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-30px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          transitionDelay: "0.1s",
        }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4 text-foreground">
          {section.title}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          {section.description}
        </p>
      </div>

      {/* Right: Animated Viz */}
      <div
        className="flex-1 flex justify-center items-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(40px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          transitionDelay: "0.25s",
        }}
      >
        <Viz active={visible} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(45, 20%, 93%)" }}>
      {/* Header */}
      <div className="text-center pt-20 pb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          How it's built
        </h1>
      </div>

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-6">
        {sections.map((section, i) => (
          <div key={section.id}>
            <Section section={section} index={i} />
            {i < sections.length - 1 && (
              <div className="border-t border-border/60 mx-auto w-32" />
            )}
          </div>
        ))}
      </div>

      <div className="h-24" />
    </div>
  );
}
