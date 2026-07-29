// @ts-nocheck
/**
 * Vercel serverless function — DocOps MCP Documentation Agent (SSE)
 * Route: POST /api/docs-agent-mcp
 *
 * vercel.json rewrites /api/docs-agent/mcp → this file.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DOCOPS_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

function gate1Prompt(input, feedback) {
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

function gate2Prompt(input, gate1Output, feedback) {
  return `You are Gate 2 of an MCP Documentation Agent. MCP tools require a single flat JSON Schema combining ALL parameter locations.
RULES: Merge path+query+body into one inputSchema per tool. If param names conflict, prefix (body_id vs path_id). Use exact JSON Schema types. For Resources, define URI template. Don't include auth headers in inputSchema.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📐 MCP Tool Schema Design — Gate 2 with per-tool blocks showing snake_case name, method+path, LLM description, inputSchema JSON, naming conflicts, info gaps. Plus Resource blocks with URI template + MIME type.

GATE 1 AUDIT:
${gate1Output}

API SPEC:
${input}`;
}

function gate3Prompt(input, gate2Output, feedback) {
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

function gate4Prompt(gate3Output, feedback) {
  return `You are Gate 4 of an MCP Documentation Agent. Generate realistic AI prompt examples showing how LLMs use each tool.
For each tool show: User message (natural language), which tool Claude selects, tool call JSON, Claude's response to user, disambiguation note.
Plus: Ambiguity Report listing tools with overlapping descriptions.
${feedback ? `CORRECTION: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${gate3Output}`;
}

function gate5Prompt(gate3Output, feedback) {
  return `You are Gate 5 — final quality gate for MCP.
Score per tool (0-5): Tool naming, Description quality, Schema completeness, Self-contained schemas, Error coverage, Claude Desktop compatibility.
THRESHOLDS: 27-30 ✅, 20-26 ⚠️, Below 20 ❌.
Plus: MCP Client Compatibility table (Claude Desktop, ChatGPT, Generic MCP Client).
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
