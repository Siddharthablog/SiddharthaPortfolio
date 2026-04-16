import { useEffect, useState } from "react";
import "./index.css";
import { ComposableModulesViz } from "./components/ComposableModulesViz";
import { AgenticExecutionViz } from "./components/AgenticExecutionViz";
import { SemanticWaterfallsViz } from "./components/SemanticWaterfallsViz";
import { NativeIntegrationViz } from "./components/NativeIntegrationViz";

const sections = [
  {
    id: "composable",
    num: "01",
    title: "Composable AI Modules",
    description:
      "Each workflow is made up of plug-and-play data-action modules — enrichment, deduplication, scoring, routing, automated by AI.",
    viz: ComposableModulesViz,
  },
  {
    id: "agentic",
    num: "02",
    title: "Agentic Execution",
    description:
      "Our agents don't just follow scripts. They understand your ICP, coordinate across systems, and evolve with your GTM.",
    viz: AgenticExecutionViz,
  },
  {
    id: "semantic",
    num: "03",
    title: "Semantic Data Waterfalls",
    description:
      "We orchestrate, filter, and score data using your ICP and motion logic, not generic firmographics.",
    viz: SemanticWaterfallsViz,
  },
  {
    id: "native",
    num: "04",
    title: "Native Integration",
    description:
      "Bi-directional sync across your CRM, MAP, CDP, enrichment sources, and major LLMs. Built-in prompt engineering.",
    viz: NativeIntegrationViz,
  },
];

export default function App() {
  const [active, setActive] = useState(false);

  // Auto-start animations after a short delay on mount
  useEffect(() => {
    const t = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "hsl(45, 22%, 92%)" }}
    >
      {/* Header */}
      <div className="text-center pt-7 pb-4 flex-shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          How it's built
        </h1>
      </div>

      {/* 2×2 grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-px overflow-hidden">
        {sections.map((section, i) => {
          const Viz = section.viz;
          const delay = i * 0.12;
          return (
            <div
              key={section.id}
              className="relative flex items-stretch overflow-hidden"
              style={{
                background: "hsl(45, 22%, 92%)",
                borderRight: i % 2 === 0 ? "1px solid hsl(40 15% 82%)" : "none",
                borderBottom: i < 2 ? "1px solid hsl(40 15% 82%)" : "none",
              }}
            >
              {/* Left: text */}
              <div
                className="flex flex-col justify-center px-8 py-5 flex-shrink-0"
                style={{
                  width: "44%",
                  opacity: active ? 1 : 0,
                  transform: active ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
                }}
              >
                <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
                  {section.num}
                </p>
                <h2 className="text-base font-bold leading-tight mb-2 text-foreground">
                  {section.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
              </div>

              {/* Divider */}
              <div
                className="w-px flex-shrink-0 self-stretch my-6"
                style={{ background: "hsl(40 15% 82%)" }}
              />

              {/* Right: viz */}
              <div
                className="flex-1 flex items-center justify-center p-4"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "translateX(0)" : "translateX(20px)",
                  transition: `opacity 0.6s ease ${delay + 0.15}s, transform 0.6s ease ${delay + 0.15}s`,
                }}
              >
                <div className="w-full max-w-[260px]">
                  <Viz active={active} compact />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
