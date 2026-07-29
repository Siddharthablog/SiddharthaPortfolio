// @ts-nocheck
/**
 * Vercel serverless function — DocOps Pipeline Agent (SSE)
 * Route: POST /api/docs-agent-pipeline
 *
 * vercel.json rewrites /api/docs-agent/pipeline → this file.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DOCOPS_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

function gate1Prompt(input, feedback) {
  return `You are Gate 1 of a Documentation Pipeline Agent for technical writers.
TASK: Validate the provided API source material and produce a structured validation report.
Analyse for: Endpoints/API paths, Request parameters (types, required/optional), Response schemas, Authentication scheme, Error codes, Integration flow, Code examples.
${feedback ? `WRITER CORRECTION: ${feedback} — Re-run validation taking this correction into account.` : ""}
OUTPUT FORMAT: ## ✅ Validation Report — Gate 1 with verdict PASS/PASS WITH GAPS/FAIL, Components Found table with ✅/⚠️/❌ status, Summary, Info Gaps Detected.
SOURCE MATERIAL:
${input}`;
}

function gate2Prompt(input, gate1Output, feedback) {
  return `You are Gate 2 of a Documentation Pipeline Agent.
The source material has been validated. Map it to three mandatory documentation page types.
RULES: NEVER collapse Overview, Integration, and Reference into a single page type. Overview = conceptual, no parameter tables. Integration = procedural, step-by-step. Reference = factual and complete.
${feedback ? `WRITER CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📐 Page Structure Plan — Gate 2 with Page Inventory, then detailed sections for each page.

GATE 1 VALIDATION OUTPUT:
${gate1Output}

ORIGINAL SOURCE MATERIAL:
${input}`;
}

function gate3Prompt(input, gate2Output, feedback) {
  return `You are Gate 3 of a Documentation Pipeline Agent.
Generate complete documentation pages per the approved structure plan.
RULES: Use ⚠️ Info Gap markers for anything not in source. Overview pages: NO parameter tables. Integration pages: Step cards with 'What you need' and checkpoints. Reference pages: Markdown pipe tables, ALL parameters, mandatory first in bold. cURL examples use YOUR_API_KEY etc.
${feedback ? `WRITER CORRECTION: ${feedback}` : ""}

PAGE STRUCTURE PLAN (Gate 2):
${gate2Output}

ORIGINAL SOURCE MATERIAL:
${input}`;
}

function gate4Prompt(gate3Output, feedback) {
  return `You are Gate 4. Review generated docs and produce a generation summary.
OUTPUT: ## 📊 Generation Summary — Gate 4 with Stats table (pages, endpoints, info gaps), Info Gaps list, Quality Observations, Preview of first page.
${feedback ? `ADDITIONAL NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

function gate5Prompt(gate3Output, feedback) {
  return `You are Gate 5 — final quality gate.
Score each page against rubric (0–5): Completeness, Parameter accuracy, Code examples, Structure, Clarity, Error handling.
THRESHOLDS: 28-30 ✅ Publish-ready, 22-27 ⚠️ Minor revision, Below 22 ❌ Needs Revision.
OUTPUT: ## 🎯 Quality Scorecard — Gate 5 with per-page scoring table.
${feedback ? `SCORING NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const { gate, input, gate1Output, gate2Output, gate3Output, feedback } = req.body ?? {};

  let prompt: string;
  if      (gate === 1) { if (!input) { res.status(400).json({ error: "input required" }); return; } prompt = gate1Prompt(input, feedback); }
  else if (gate === 2) { if (!input || !gate1Output) { res.status(400).json({ error: "input and gate1Output required" }); return; } prompt = gate2Prompt(input, gate1Output, feedback); }
  else if (gate === 3) { if (!input || !gate2Output) { res.status(400).json({ error: "input and gate2Output required" }); return; } prompt = gate3Prompt(input, gate2Output, feedback); }
  else if (gate === 4) { if (!gate3Output) { res.status(400).json({ error: "gate3Output required" }); return; } prompt = gate4Prompt(gate3Output, feedback); }
  else if (gate === 5) { if (!gate3Output) { res.status(400).json({ error: "gate3Output required" }); return; } prompt = gate5Prompt(gate3Output, feedback); }
  else { res.status(400).json({ error: "Invalid gate number" }); return; }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "OPENROUTER_API_KEY not configured" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const orRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://siddhartha.dev",
        "X-Title": "API DocOps",
      },
      body: JSON.stringify({
        model: DOCOPS_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_tokens: 4096,
        temperature: 0.25,
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      res.write(`data: ${JSON.stringify({ error: `OpenRouter error ${orRes.status}: ${errText.slice(0, 200)}` })}\n\n`);
      res.end();
      return;
    }

    const reader = (orRes.body as any).getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); return; }
        try {
          const chunk = JSON.parse(raw);
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch { /* skip malformed */ }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message || "Internal error" })}\n\n`);
    res.end();
  }
}
