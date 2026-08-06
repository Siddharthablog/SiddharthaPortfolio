// @ts-nocheck
/**
 * Vercel serverless function — DocOps Agent Suite (SSE)
 *
 * Single flat handler that serves all 4 DocOps agents.
 * The agent name is passed as a query parameter via vercel.json rewrites:
 *   POST /api/docs-agent/pipeline  → /api/docs-agent?agent=pipeline
 *   POST /api/docs-agent/mcp       → /api/docs-agent?agent=mcp
 *   POST /api/docs-agent/normalize → /api/docs-agent?agent=normalize
 *   POST /api/docs-agent/glossary  → /api/docs-agent?agent=glossary
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DOCOPS_MODEL   = "nvidia/nemotron-3-ultra-550b-a55b:free";

// ── Pipeline prompts ───────────────────────────────────────────────────────────

function pipelineGate1Prompt(input, feedback) {
  return `You are Gate 1 of a Documentation Pipeline Agent for technical writers.
TASK: Validate the provided API source material and produce a structured validation report.
Analyse for: Endpoints/API paths, Request parameters (types, required/optional), Response schemas, Authentication scheme, Error codes, Integration flow, Code examples.
${feedback ? `WRITER CORRECTION: ${feedback} — Re-run validation taking this correction into account.` : ""}
OUTPUT FORMAT: ## ✅ Validation Report — Gate 1 with verdict PASS/PASS WITH GAPS/FAIL, Components Found table with ✅/⚠️/❌ status, Summary, Info Gaps Detected.
SOURCE MATERIAL:
${input}`;
}

function pipelineGate2Prompt(input, gate1Output, feedback) {
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

function pipelineGate3Prompt(input, gate2Output, feedback) {
  return `You are Gate 3 of a Documentation Pipeline Agent.
Generate complete documentation pages per the approved structure plan.
RULES: Use ⚠️ Info Gap markers for anything not in source. Overview pages: NO parameter tables. Integration pages: Step cards with 'What you need' and checkpoints. Reference pages: Markdown pipe tables, ALL parameters, mandatory first in bold. cURL examples use YOUR_API_KEY etc.
${feedback ? `WRITER CORRECTION: ${feedback}` : ""}

PAGE STRUCTURE PLAN (Gate 2):
${gate2Output}

ORIGINAL SOURCE MATERIAL:
${input}`;
}

function pipelineGate4Prompt(gate3Output, feedback) {
  return `You are Gate 4. Review generated docs and produce a generation summary.
OUTPUT: ## 📊 Generation Summary — Gate 4 with Stats table (pages, endpoints, info gaps), Info Gaps list, Quality Observations, Preview of first page.
${feedback ? `ADDITIONAL NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

function pipelineGate5Prompt(gate3Output, feedback) {
  return `You are Gate 5 — final quality gate.
Score each page against rubric (0–5): Completeness, Parameter accuracy, Code examples, Structure, Clarity, Error handling.
THRESHOLDS: 28-30 ✅ Publish-ready, 22-27 ⚠️ Minor revision, Below 22 ❌ Needs Revision.
OUTPUT: ## 🎯 Quality Scorecard — Gate 5 with per-page scoring table.
${feedback ? `SCORING NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

// ── MCP prompts ────────────────────────────────────────────────────────────────

function mcpGate1Prompt(input, feedback) {
  return `You are Gate 1 of an MCP Documentation Agent.
MCP standardises how LLMs call external APIs. Map each endpoint to:
- Tool — Actions LLM invokes (POST/PUT/PATCH/DELETE/GET that aren't stable data)
- Resource — Stable read-only data with URI template (GET /config, GET /schema)
- Prompt — Templated LLM instruction for common workflows
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 🔍 MCP Primitive Audit — Gate 1 with API Name, endpoint count, Primitive Mapping table, Tools/Resources/Prompts lists, Naming Conflict Risk, Info Gaps.
INPUT API SPEC:
${input}`;
}

function mcpGate2Prompt(input, gate1Output, feedback) {
  return `You are Gate 2 of an MCP Documentation Agent. MCP tools require a single flat JSON Schema combining ALL parameter locations.
RULES: Merge path+query+body into one inputSchema per tool. If param names conflict, prefix (body_id vs path_id). Use exact JSON Schema types. For Resources, define URI template. Don't include auth headers in inputSchema.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📐 MCP Tool Schema Design — Gate 2 with per-tool blocks showing snake_case name, method+path, LLM description, inputSchema JSON, naming conflicts, info gaps. Plus Resource blocks with URI template + MIME type.

GATE 1 AUDIT:
${gate1Output}

API SPEC:
${input}`;
}

function mcpGate3Prompt(input, gate2Output, feedback) {
  return `You are Gate 3 of an MCP Documentation Agent. Generate complete publish-ready MCP documentation.
RULES: Tool names must be snake_case verb_noun. Every description starts with present-tense verb. inputSchema must be self-contained (no $ref). Use ⚠️ Info Gap markers. cURL uses YOUR_API_KEY etc. Claude Desktop config must be valid JSON.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: 3 PAGES:
  PAGE 1 — MCP Server Overview (what it does, prerequisites, quick start npx command, Claude Desktop config JSON, authentication)
  PAGE 2 — Tools Reference (per tool: description, when to use, input schema table, cURL example, response, errors table)
  PAGE 3 — Resources Reference (per resource: URI, MIME type, description, fields)

GATE 2 SCHEMA DESIGN:
${gate2Output}

API SPEC:
${input}`;
}

function mcpGate4Prompt(gate3Output, feedback) {
  return `You are Gate 4 of an MCP Documentation Agent. Generate realistic AI prompt examples showing how LLMs use each tool.
For each tool show: User message (natural language), which tool Claude selects, tool call JSON, Claude's response to user, disambiguation note.
Plus: Ambiguity Report listing tools with overlapping descriptions.
${feedback ? `CORRECTION: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

function mcpGate5Prompt(gate3Output, feedback) {
  return `You are Gate 5 — final quality gate for MCP.
Score per tool (0-5): Tool naming, Description quality, Schema completeness, Self-contained schemas, Error coverage, Claude Desktop compatibility.
THRESHOLDS: 27-30 ✅, 20-26 ⚠️, Below 20 ❌.
Plus: MCP Client Compatibility table (Claude Desktop, ChatGPT, Generic MCP Client).
${feedback ? `SCORING NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

// ── Normalizer prompts ─────────────────────────────────────────────────────────

function normalizeAuditPrompt(content, feedback) {
  return `You are an API Reference Normalizer agent.
TASK: Audit API reference pages for structural compliance.
Standard template sections (in order): Environment URLs, Request Headers, Request Parameters, Sample Request (cURL), Sample Response (JSON), Response Parameters, Error Codes, Related APIs.
CHECK FOR: Missing sections, wrong ordering, verbose HTML tables instead of markdown, duplicate metadata, inconsistent parameter tables, hardcoded values in examples.
${feedback ? `CORRECTION NOTE: ${feedback}` : ""}
OUTPUT: ## 🔍 Audit Report with Compliance Summary table (severity 🔴/🟡/🟢), Issues Found count, Sections Analysis, Recommended Fix Order.

CONTENT TO AUDIT:
${content}`;
}

function normalizeFixPrompt(content, auditReport, feedback) {
  return `You are an API Reference Normalizer agent. Apply ALL fixes from the audit report. Produce fully normalised API reference.
RULES: Convert HTML/JSX tables to markdown. Enforce section order. Parameter tables: Parameter|Type|Required|Description. Mandatory params first (bold). Placeholder variables in code. Remove duplicate metadata. Add ⚠️ Info Gap for unknowns.
${feedback ? `ADDITIONAL CORRECTION: ${feedback}` : ""}
OUTPUT: Clean normalized page ready to copy. No commentary.

AUDIT REPORT:
${auditReport}

ORIGINAL CONTENT:
${content}`;
}

// ── Glossary prompts ───────────────────────────────────────────────────────────

function glossaryExtractPrompt(content, feedback) {
  return `You are a Glossary Builder agent.
TASK: Scan docs for API terms, technical terms, domain vocabulary.
Prioritise by Tier: Tier 1 = support-ticket terms (auth, identifiers, callbacks), Tier 2 = domain-specific, Tier 3 = general web/API terms.
Flag inconsistencies (webhook vs web hook, callback_url vs callbackUrl).
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📚 Term Extraction Report with Summary, Inconsistency Flags table, Tier 1/2/3 term tables (Term|Used In|Context Snippet|Defined?).

CONTENT:
${content}`;
}

function glossaryDefinePrompt(content, extractReport, feedback) {
  return `You are a Glossary Builder agent. Generate canonical glossary definitions.
RULES: One sentence max per definition. Never use the term in its own definition. For params: state type, purpose, context. For auth terms: what it represents, when to use. Mark uncertain definitions with ⚠️ Confirm with API team.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📖 Proposed Glossary with Canonical Term Decisions, then Tier 1/2/3 definitions with Type and Context tags.

TERM EXTRACTION REPORT:
${extractReport}

ORIGINAL CONTENT:
${content}`;
}

// ── SSE streaming proxy ────────────────────────────────────────────────────────

async function streamToSSE(res, prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY not configured in Vercel environment variables" });
    return;
  }

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
      res.write(`data: ${JSON.stringify({ error: `OpenRouter error ${orRes.status}: ${errText.slice(0, 300)}` })}\n\n`);
      res.end();
      return;
    }

    const reader = orRes.body.getReader();
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
        if (raw === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          return;
        }
        try {
          const chunk = JSON.parse(raw);
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch { /* skip malformed chunks */ }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    try {
      res.write(`data: ${JSON.stringify({ error: err.message || "Internal error" })}\n\n`);
      res.end();
    } catch { /* headers already sent */ }
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Agent name comes from query parameter (set by vercel.json rewrite)
  const agent = req.query?.agent;
  const body  = req.body ?? {};

  // ── Pipeline ────────────────────────────────────────────────────────────────
  if (agent === "pipeline") {
    const { gate, input, gate1Output, gate2Output, gate3Output, feedback } = body;
    let prompt;
    if      (gate === 1) { if (!input)                     { res.status(400).json({ error: "input required" }); return; }                         prompt = pipelineGate1Prompt(input, feedback); }
    else if (gate === 2) { if (!input || !gate1Output)     { res.status(400).json({ error: "input and gate1Output required" }); return; }          prompt = pipelineGate2Prompt(input, gate1Output, feedback); }
    else if (gate === 3) { if (!input || !gate2Output)     { res.status(400).json({ error: "input and gate2Output required" }); return; }          prompt = pipelineGate3Prompt(input, gate2Output, feedback); }
    else if (gate === 4) { if (!gate3Output)               { res.status(400).json({ error: "gate3Output required" }); return; }                   prompt = pipelineGate4Prompt(gate3Output, feedback); }
    else if (gate === 5) { if (!gate3Output)               { res.status(400).json({ error: "gate3Output required" }); return; }                   prompt = pipelineGate5Prompt(gate3Output, feedback); }
    else                 { res.status(400).json({ error: "gate must be 1–5" }); return; }
    await streamToSSE(res, prompt);
    return;
  }

  // ── MCP ─────────────────────────────────────────────────────────────────────
  if (agent === "mcp") {
    const { gate, input, gate1Output, gate2Output, gate3Output, feedback } = body;
    let prompt;
    if      (gate === 1) { if (!input)                     { res.status(400).json({ error: "input required" }); return; }                         prompt = mcpGate1Prompt(input, feedback); }
    else if (gate === 2) { if (!input || !gate1Output)     { res.status(400).json({ error: "input and gate1Output required" }); return; }          prompt = mcpGate2Prompt(input, gate1Output, feedback); }
    else if (gate === 3) { if (!input || !gate2Output)     { res.status(400).json({ error: "input and gate2Output required" }); return; }          prompt = mcpGate3Prompt(input, gate2Output, feedback); }
    else if (gate === 4) { if (!gate3Output)               { res.status(400).json({ error: "gate3Output required" }); return; }                   prompt = mcpGate4Prompt(gate3Output, feedback); }
    else if (gate === 5) { if (!gate3Output)               { res.status(400).json({ error: "gate3Output required" }); return; }                   prompt = mcpGate5Prompt(gate3Output, feedback); }
    else                 { res.status(400).json({ error: "gate must be 1–5" }); return; }
    await streamToSSE(res, prompt);
    return;
  }

  // ── Normalize ────────────────────────────────────────────────────────────────
  if (agent === "normalize") {
    const { mode, content, auditReport, feedback } = body;
    if (!content) { res.status(400).json({ error: "content required" }); return; }
    let prompt;
    if      (mode === "audit") prompt = normalizeAuditPrompt(content, feedback);
    else if (mode === "fix")   { if (!auditReport) { res.status(400).json({ error: "auditReport required for fix mode" }); return; } prompt = normalizeFixPrompt(content, auditReport, feedback); }
    else                       { res.status(400).json({ error: "mode must be 'audit' or 'fix'" }); return; }
    await streamToSSE(res, prompt);
    return;
  }

  // ── Glossary ─────────────────────────────────────────────────────────────────
  if (agent === "glossary") {
    const { mode, content, extractReport, feedback } = body;
    if (!content) { res.status(400).json({ error: "content required" }); return; }
    let prompt;
    if      (mode === "extract") prompt = glossaryExtractPrompt(content, feedback);
    else if (mode === "define")  { if (!extractReport) { res.status(400).json({ error: "extractReport required for define mode" }); return; } prompt = glossaryDefinePrompt(content, extractReport, feedback); }
    else                         { res.status(400).json({ error: "mode must be 'extract' or 'define'" }); return; }
    await streamToSSE(res, prompt);
    return;
  }

  res.status(404).json({ error: `Unknown agent: ${agent}` });
}
