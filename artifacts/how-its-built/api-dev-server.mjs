/**
 * Local dev API server — mimics Vercel serverless functions.
 * Runs on port 3001 so the Vite proxy (/api → localhost:3001) works.
 *
 * Usage:  node api-dev-server.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Load .env manually (no extra dependencies) ─────────────────────────────
function loadEnv() {
  // Try local .env first, then root .env, then .env.example as fallback
  const envPaths = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", "..", ".env"),
    path.join(__dirname, ".env.example"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes (single or double) — standard .env behaviour
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
      console.log(`  ✓ Loaded env from ${envPath}`);
    }
  }
}

loadEnv();

// ── Langfuse v5 OTEL tracing (optional — only runs if LANGFUSE keys are set) ─

let _spanProcessor = null;
let _langfuseReady = false;

function initLangfuse() {
  if (_langfuseReady) return true;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  if (!publicKey || !secretKey) return false;
  const baseUrl = process.env.LANGFUSE_BASE_URL || "https://jp.cloud.langfuse.com";
  try {
    const { BasicTracerProvider } = require("@opentelemetry/sdk-trace-base");
    const { LangfuseSpanProcessor } = require("@langfuse/otel");
    const { setLangfuseTracerProvider } = require("@langfuse/tracing");

    _spanProcessor = new LangfuseSpanProcessor({
      publicKey, secretKey, baseUrl,
      exportMode: "immediate",
    });
    const provider = new BasicTracerProvider({ spanProcessors: [_spanProcessor] });
    setLangfuseTracerProvider(provider);
    _langfuseReady = true;
    console.log("  ✓ Langfuse OTEL tracing initialised");
    return true;
  } catch (e) {
    console.warn("  ⚠ Langfuse init failed (non-fatal):", e.message);
    return false;
  }
}

async function withLangfuseTrace(traceMeta, prompt, fn, getOutput) {
  if (!initLangfuse()) return fn(null); // no-op if keys not set
  try {
    const { propagateAttributes, startActiveObservation } = require("@langfuse/tracing");
    const gateName = traceMeta.gate != null
      ? `gate-${traceMeta.gate}`
      : traceMeta.mode || "run";
    const traceName = `docops-${traceMeta.agent}`;
    await propagateAttributes(
      {
        traceName,
        // Set trace-level input so {{input}} is populated for LLM-as-a-Judge evaluators
        input: [{ role: "user", content: prompt }],
        metadata: {
          agent: traceMeta.agent,
          gate: String(traceMeta.gate ?? ""),
          mode: traceMeta.mode ?? "",
          hasFeedback: traceMeta.hasFeedback ? "true" : "false",
        },
        tags: [traceMeta.agent, gateName],
      },
      async () => {
        await startActiveObservation(gateName, async (span) => {
          if (span && typeof span.update === "function") {
            try {
              span.update({
                model: DOCOPS_MODEL,
                modelParameters: { max_tokens: 4096, temperature: 0.25 },
                input: [{ role: "user", content: prompt }],
              });
            } catch { }
          }
          await fn(span);
          // Set trace-level output via setTraceIO so {{output}} is populated for evaluators
          if (span && typeof span.setTraceIO === "function") {
            try { span.setTraceIO({ output: getOutput() }); } catch { }
          }
        });
      },
    );
  } catch (e) {
    console.error("[Langfuse] Trace failed (non-fatal):", e.message);
    await fn(null);
  } finally {
    if (_spanProcessor) {
      try { await _spanProcessor.forceFlush(); } catch { }
    }
  }
}

// ── Import the serverless handler dynamically ───────────────────────────────
// We dynamically import the .ts files using a simple approach:
// Since these are simple enough, we inline the handler logic.

// Build the mstp-chat handler inline (reads env vars set above)
async function mstpChatHandler(body) {
  const { message, messages } = body;

  let userMessage = "";
  if (messages && Array.isArray(messages) && messages.length > 0) {
    userMessage = messages[messages.length - 1]?.content || "";
  } else if (message) {
    userMessage = message;
  }

  if (!userMessage.trim()) {
    return { status: 400, body: { error: "message required" } };
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return { status: 500, body: { error: "HF_TOKEN not set in .env" } };

  // ── Extract previous history for Gradio ────────────────────────────────────
  const history = messages && Array.isArray(messages) && messages.length > 1
    ? messages.slice(0, -1)
    : [];

  const hfSpaceUrl = "https://siddhartha03-mstp-finetune-bot.hf.space/gradio_api/call/chat";

  console.log(`[HF Space API] Sending request to ${hfSpaceUrl}...`);

  try {
    // 1. Submit job to Gradio Space
    const submitRes = await fetch(hfSpaceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hfToken}`
      },
      body: JSON.stringify({
        data: [userMessage, history]
      })
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      return {
        status: submitRes.status,
        body: { error: `Hugging Face Space submit failed: ${submitRes.statusText || submitRes.status}`, details: errText }
      };
    }

    const { event_id } = await submitRes.json();
    if (!event_id) {
      return { status: 502, body: { error: "No event_id returned from Hugging Face Space" } };
    }

    // 2. Fetch the stream / result using GET
    const sseUrl = `${hfSpaceUrl}/${event_id}`;
    const streamRes = await fetch(sseUrl, {
      headers: {
        "Authorization": `Bearer ${hfToken}`
      }
    });

    if (!streamRes.ok) {
      const errText = await streamRes.text();
      return {
        status: streamRes.status,
        body: { error: `Hugging Face Space stream failed: ${streamRes.statusText || streamRes.status}`, details: errText }
      };
    }

    const text = await streamRes.text();
    const blocks = text.split("\n\n");
    let answer = "";
    let errorMsg = "";

    for (const block of blocks) {
      const lines = block.split("\n");
      let eventType = "";
      let dataText = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataText = line.slice(5).trim();
        }
      }

      if (eventType === "complete" && dataText) {
        try {
          const parsed = JSON.parse(dataText);
          answer = Array.isArray(parsed) ? parsed[0] : String(parsed);
        } catch (e) {
          console.error("Failed to parse event completion data:", e);
        }
      } else if (eventType === "error") {
        errorMsg = dataText || "Unknown Hugging Face Space error";
      }
    }

    if (errorMsg && !answer) {
      return { status: 502, body: { error: `Hugging Face Space error: ${errorMsg}` } };
    }

    if (!answer) {
      return { status: 502, body: { error: "Empty or invalid response received from Hugging Face Space" } };
    }

    return { status: 200, body: { answer } };
  } catch (err) {
    console.error("MSTP chat handler error:", err);
    return { status: 500, body: { error: "Internal server error: " + (err.message || String(err)) } };
  }
}

// Build the chat handler (Groq — existing portfolio chatbot)
async function chatHandler(body) {
  const { message, messages } = body;
  let history = [];
  let latestMessage = "";

  if (messages && Array.isArray(messages)) {
    history = messages;
    latestMessage = messages[messages.length - 1]?.content || "";
  } else if (message) {
    history = [{ role: "user", content: message }];
    latestMessage = message;
  }

  if (!latestMessage.trim()) {
    return { status: 400, body: { error: "message required" } };
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return { status: 500, body: { error: "GROQ_API_KEY not set in .env" } };

  // Simple RAG — load knowledge.txt
  let context = "";
  const knowledgePath = path.join(__dirname, "public", "knowledge.txt");
  if (fs.existsSync(knowledgePath)) {
    const raw = fs.readFileSync(knowledgePath, "utf-8");
    const chunks = raw.split(/\n\n+/).map(c => c.trim()).filter(c => c.length > 40);
    const qTokens = latestMessage.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = chunks.map(chunk => {
      const cTokens = new Set(chunk.toLowerCase().split(/\s+/).filter(t => t.length > 2));
      const hits = qTokens.filter(t => cTokens.has(t)).length;
      return { chunk, score: hits };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    context = scored.map(s => s.chunk).join("\n\n");
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 512,
      messages: [
        { role: "system", content: `You are Siddhartha Mani's personal AI assistant on their portfolio website. Answer questions using ONLY the context below. Be friendly, concise, and professional. If you cannot answer from the context say: "I don't have that detail, but you can reach Siddhartha at mani.siddhartha@gmail.com"\n\nCONTEXT:\n${context}` },
        ...history,
      ],
    }),
  });

  const data = await groqRes.json();
  if (data.error) {
    return { status: 502, body: { error: "Groq error: " + (data.error.message || JSON.stringify(data.error)) } };
  }

  return { status: 200, body: { answer: data.choices?.[0]?.message?.content ?? "No response." } };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCOPS AGENT SUITE — SSE streaming handlers
// ─────────────────────────────────────────────────────────────────────────────

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DOCOPS_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

// ── Context-window guard ──────────────────────────────────────────────────────
// Nemotron-3 free tier: ~8k token context. 1 token ≈ 4 chars.
const INPUT_LIMIT  = 8_000;
const OUTPUT_LIMIT = 8_000;
const SHARED_LIMIT = 6_000;

function trunc(text, limit) {
  if (!text || text.length <= limit) return text;
  return text.slice(0, limit) + `\n\n[...truncated — ${text.length - limit} chars omitted to fit context window...]`;
}

// ── All gate prompts ──────────────────────────────────────────────────────────

// PIPELINE agent prompts
function pipelineGate1Prompt(input, feedback) {
  return `You are Gate 1 of a Documentation Pipeline Agent for technical writers.
TASK: Validate the provided API source material and produce a structured validation report.
Analyse for: Endpoints/API paths, Request parameters (types, required/optional), Response schemas, Authentication scheme, Error codes, Integration flow, Code examples.
${feedback ? `WRITER CORRECTION: ${feedback} — Re-run validation taking this correction into account.` : ""}
OUTPUT FORMAT: ## ✅ Validation Report — Gate 1 with verdict PASS/PASS WITH GAPS/FAIL, Components Found table with ✅/⚠️/❌ status, Summary, Info Gaps Detected.
SOURCE MATERIAL:
${trunc(input, INPUT_LIMIT)}`;
}

function pipelineGate2Prompt(input, gate1Output, feedback) {
  return `You are Gate 2 of a Documentation Pipeline Agent.
The source material has been validated. Map it to three mandatory documentation page types.
RULES: NEVER collapse Overview, Integration, and Reference into a single page type. Overview = conceptual, no parameter tables. Integration = procedural, step-by-step. Reference = factual and complete.
${feedback ? `WRITER CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📐 Page Structure Plan — Gate 2 with Page Inventory, then detailed sections for each page.

GATE 1 VALIDATION OUTPUT:
${trunc(gate1Output, SHARED_LIMIT)}

ORIGINAL SOURCE MATERIAL:
${trunc(input, SHARED_LIMIT)}`;
}

function pipelineGate3Prompt(input, gate2Output, feedback) {
  return `You are Gate 3 of a Documentation Pipeline Agent.
Generate complete documentation pages per the approved structure plan.
RULES: Use ⚠️ Info Gap markers for anything not in source. Overview pages: NO parameter tables. Integration pages: Step cards with 'What you need' and checkpoints. Reference pages: Markdown pipe tables, ALL parameters, mandatory first in bold. cURL examples use YOUR_API_KEY etc.
${feedback ? `WRITER CORRECTION: ${feedback}` : ""}

PAGE STRUCTURE PLAN (Gate 2):
${trunc(gate2Output, SHARED_LIMIT)}

ORIGINAL SOURCE MATERIAL:
${trunc(input, SHARED_LIMIT)}`;
}

function pipelineGate4Prompt(gate3Output, feedback) {
  return `You are Gate 4. Review generated docs and produce a generation summary.
OUTPUT: ## 📊 Generation Summary — Gate 4 with Stats table (pages, endpoints, info gaps), Info Gaps list, Quality Observations, Preview of first page.
${feedback ? `ADDITIONAL NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${trunc(gate3Output, OUTPUT_LIMIT)}`;
}

function pipelineGate5Prompt(gate3Output, feedback) {
  return `You are Gate 5 — final quality gate.
Score each page against rubric (0–5): Completeness, Parameter accuracy, Code examples, Structure, Clarity, Error handling.
THRESHOLDS: 28-30 ✅ Publish-ready, 22-27 ⚠️ Minor revision, Below 22 ❌ Needs Revision.
OUTPUT: ## 🎯 Quality Scorecard — Gate 5 with per-page scoring table.
${feedback ? `SCORING NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${trunc(gate3Output, OUTPUT_LIMIT)}`;
}

// MCP agent prompts
function mcpGate1Prompt(input, feedback) {
  return `You are Gate 1 of an MCP Documentation Agent.
MCP standardises how LLMs call external APIs. Map each endpoint to:
- Tool — Actions LLM invokes (POST/PUT/PATCH/DELETE/GET that aren't stable data)
- Resource — Stable read-only data with URI template (GET /config, GET /schema)
- Prompt — Templated LLM instruction for common workflows
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 🔍 MCP Primitive Audit — Gate 1 with API Name, endpoint count, Primitive Mapping table, Tools/Resources/Prompts lists, Naming Conflict Risk, Info Gaps.
INPUT API SPEC:
${trunc(input, INPUT_LIMIT)}`;
}

function mcpGate2Prompt(input, gate1Output, feedback) {
  return `You are Gate 2 of an MCP Documentation Agent. MCP tools require a single flat JSON Schema combining ALL parameter locations.
RULES: Merge path+query+body into one inputSchema per tool. If param names conflict, prefix (body_id vs path_id). Use exact JSON Schema types. For Resources, define URI template. Don't include auth headers in inputSchema.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📐 MCP Tool Schema Design — Gate 2 with per-tool blocks showing snake_case name, method+path, LLM description, inputSchema JSON, naming conflicts, info gaps. Plus Resource blocks with URI template + MIME type.

GATE 1 AUDIT:
${trunc(gate1Output, SHARED_LIMIT)}

API SPEC:
${trunc(input, SHARED_LIMIT)}`;
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
${trunc(gate2Output, SHARED_LIMIT)}

API SPEC:
${trunc(input, SHARED_LIMIT)}`;
}

function mcpGate4Prompt(gate3Output, feedback) {
  return `You are Gate 4 of an MCP Documentation Agent. Generate realistic AI prompt examples showing how LLMs use each tool.
For each tool show: User message (natural language), which tool Claude selects, tool call JSON, Claude's response to user, disambiguation note.
Plus: Ambiguity Report listing tools with overlapping descriptions.
${feedback ? `CORRECTION: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${trunc(gate3Output, OUTPUT_LIMIT)}`;
}

function mcpGate5Prompt(gate3Output, feedback) {
  return `You are Gate 5 — final quality gate for MCP.
Score per tool (0-5): Tool naming, Description quality, Schema completeness, Self-contained schemas, Error coverage, Claude Desktop compatibility.
THRESHOLDS: 27-30 ✅, 20-26 ⚠️, Below 20 ❌.
Plus: MCP Client Compatibility table (Claude Desktop, ChatGPT, Generic MCP Client).
${feedback ? `SCORING NOTE: ${feedback}` : ""}

GATE 3 GENERATED DOCS:
${trunc(gate3Output, OUTPUT_LIMIT)}`;
}

// NORMALIZER prompts
function normalizeAuditPrompt(content, feedback) {
  return `You are an API Reference Normalizer agent.
TASK: Audit API reference pages for structural compliance.
Standard template sections (in order): Environment URLs, Request Headers, Request Parameters, Sample Request (cURL), Sample Response (JSON), Response Parameters, Error Codes, Related APIs.
CHECK FOR: Missing sections, wrong ordering, verbose HTML tables instead of markdown, duplicate metadata, inconsistent parameter tables, hardcoded values in examples.
${feedback ? `CORRECTION NOTE: ${feedback}` : ""}
OUTPUT: ## 🔍 Audit Report with Compliance Summary table (severity 🔴/🟡/🟢), Issues Found count, Sections Analysis, Recommended Fix Order.

CONTENT TO AUDIT:
${trunc(content, INPUT_LIMIT)}`;
}

function normalizeFixPrompt(content, auditReport, feedback) {
  return `You are an API Reference Normalizer agent. Apply ALL fixes from the audit report. Produce fully normalised API reference.
RULES: Convert HTML/JSX tables to markdown. Enforce section order. Parameter tables: Parameter|Type|Required|Description. Mandatory params first (bold). Placeholder variables in code. Remove duplicate metadata. Add ⚠️ Info Gap for unknowns.
${feedback ? `ADDITIONAL CORRECTION: ${feedback}` : ""}
OUTPUT: Clean normalized page ready to copy. No commentary.

AUDIT REPORT:
${trunc(auditReport, SHARED_LIMIT)}

ORIGINAL CONTENT:
${trunc(content, SHARED_LIMIT)}`;
}

// GLOSSARY prompts
function glossaryExtractPrompt(content, feedback) {
  return `You are a Glossary Builder agent.
TASK: Scan docs for API terms, technical terms, domain vocabulary.
Prioritise by Tier: Tier 1 = support-ticket terms (auth, identifiers, callbacks), Tier 2 = domain-specific, Tier 3 = general web/API terms.
Flag inconsistencies (webhook vs web hook, callback_url vs callbackUrl).
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📚 Term Extraction Report with Summary, Inconsistency Flags table, Tier 1/2/3 term tables (Term|Used In|Context Snippet|Defined?).

CONTENT:
${trunc(content, INPUT_LIMIT)}`;
}

function glossaryDefinePrompt(content, extractReport, feedback) {
  return `You are a Glossary Builder agent. Generate canonical glossary definitions.
RULES: One sentence max per definition. Never use the term in its own definition. For params: state type, purpose, context. For auth terms: what it represents, when to use. Mark uncertain definitions with ⚠️ Confirm with API team.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📖 Proposed Glossary with Canonical Term Decisions, then Tier 1/2/3 definitions with Type and Context tags.

TERM EXTRACTION REPORT:
${trunc(extractReport, SHARED_LIMIT)}

ORIGINAL CONTENT:
${trunc(content, SHARED_LIMIT)}`;
}

// ── SSE proxy to OpenRouter ──────────────────────────────────────────────────

async function streamToSSE(res, prompt, traceMeta) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "OPENROUTER_API_KEY not set in .env" }));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Hoist fullOutput so withLangfuseTrace can read it after streaming completes
  let fullOutput = "";
  const llmStartMs = Date.now();

  const runLLM = async (span) => {
    try {
      const orRes = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
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
        const errMsg = `OpenRouter error ${orRes.status}: ${errText.slice(0, 200)}`;
        if (span) { try { span.end({ level: "ERROR", statusMessage: errMsg }); } catch { } }
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        res.end();
        return;
      }

      const reader = orRes.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let usageData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        // Two-pass: parse all content/usage chunks first, then handle [DONE].
        // OpenRouter sends the usage chunk and [DONE] in the same read() batch —
        // processing [DONE] first caused an early return before usageData was set.
        let sawDone = false;
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") { sawDone = true; continue; }
          try {
            const chunk = JSON.parse(raw);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              fullOutput += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
            if (chunk.usage) {
              usageData = {
                input: chunk.usage.prompt_tokens,
                output: chunk.usage.completion_tokens,
                total: chunk.usage.total_tokens,
              };
            }
          } catch { /* skip malformed chunks */ }
        }

        if (sawDone) {
          const latencyMs = Date.now() - llmStartMs;
          if (span) {
            try {
              span.update({ output: fullOutput });
              if (typeof span.setTraceIO === "function") {
                span.setTraceIO({ input: [{ role: "user", content: prompt }], output: fullOutput });
              }
              span.end({ output: fullOutput, ...(usageData ? { usage: usageData } : {}) });
            } catch { }
          }
          res.write(`data: ${JSON.stringify({ done: true, latencyMs, tokens: usageData?.total ?? null })}\n\n`);
          res.end();
          return;
        }
      }

      const latencyMs = Date.now() - llmStartMs;
      if (span) {
        try { span.end({ output: fullOutput, ...(usageData ? { usage: usageData } : {}) }); } catch { }
      }
      res.write(`data: ${JSON.stringify({ done: true, latencyMs, tokens: usageData?.total ?? null })}\n\n`);
      res.end();
    } catch (err) {
      console.error("[DocOps SSE] Error:", err.message);
      if (span) { try { span.end({ level: "ERROR", statusMessage: err.message }); } catch { } }
      res.write(`data: ${JSON.stringify({ error: err.message || "Internal error" })}\n\n`);
      res.end();
    }
  };

  if (traceMeta) {
    await withLangfuseTrace(traceMeta, prompt, runLLM, () => fullOutput);
  } else {
    await runLLM(null);
  }
}

// ── DocOps route handler ─────────────────────────────────────────────────────

async function docsAgentHandler(url, body, res) {
  const route = url.replace("/api/docs-agent/", "");

  if (route === "pipeline") {
    const { gate, input, gate1Output, gate2Output, gate3Output, feedback } = body;
    let prompt;
    if (gate === 1) { if (!input) return { status: 400, body: { error: "input required" } }; prompt = pipelineGate1Prompt(input, feedback); }
    else if (gate === 2) { if (!input || !gate1Output) return { status: 400, body: { error: "input and gate1Output required" } }; prompt = pipelineGate2Prompt(input, gate1Output, feedback); }
    else if (gate === 3) { if (!input || !gate2Output) return { status: 400, body: { error: "input and gate2Output required" } }; prompt = pipelineGate3Prompt(input, gate2Output, feedback); }
    else if (gate === 4) { if (!gate3Output) return { status: 400, body: { error: "gate3Output required" } }; prompt = pipelineGate4Prompt(gate3Output, feedback); }
    else if (gate === 5) { if (!gate3Output) return { status: 400, body: { error: "gate3Output required" } }; prompt = pipelineGate5Prompt(gate3Output, feedback); }
    else return { status: 400, body: { error: "Invalid gate number" } };
    await streamToSSE(res, prompt, { agent: "pipeline", gate, hasFeedback: !!feedback });
    return null; // already handled

  } else if (route === "mcp") {
    const { gate, input, gate1Output, gate2Output, gate3Output, feedback } = body;
    let prompt;
    if (gate === 1) { if (!input) return { status: 400, body: { error: "input required" } }; prompt = mcpGate1Prompt(input, feedback); }
    else if (gate === 2) { if (!input || !gate1Output) return { status: 400, body: { error: "input and gate1Output required" } }; prompt = mcpGate2Prompt(input, gate1Output, feedback); }
    else if (gate === 3) { if (!input || !gate2Output) return { status: 400, body: { error: "input and gate2Output required" } }; prompt = mcpGate3Prompt(input, gate2Output, feedback); }
    else if (gate === 4) { if (!gate3Output) return { status: 400, body: { error: "gate3Output required" } }; prompt = mcpGate4Prompt(gate3Output, feedback); }
    else if (gate === 5) { if (!gate3Output) return { status: 400, body: { error: "gate3Output required" } }; prompt = mcpGate5Prompt(gate3Output, feedback); }
    else return { status: 400, body: { error: "Invalid gate number" } };
    await streamToSSE(res, prompt, { agent: "mcp", gate, hasFeedback: !!feedback });
    return null;

  } else if (route === "normalize") {
    const { mode, content, auditReport, feedback } = body;
    if (!content) return { status: 400, body: { error: "content required" } };
    let prompt;
    if (mode === "audit") prompt = normalizeAuditPrompt(content, feedback);
    else if (mode === "fix") { if (!auditReport) return { status: 400, body: { error: "auditReport required for fix mode" } }; prompt = normalizeFixPrompt(content, auditReport, feedback); }
    else return { status: 400, body: { error: "mode must be 'audit' or 'fix'" } };
    await streamToSSE(res, prompt, { agent: "normalize", mode, hasFeedback: !!feedback });
    return null;

  } else if (route === "glossary") {
    const { mode, content, extractReport, feedback } = body;
    if (!content) return { status: 400, body: { error: "content required" } };
    let prompt;
    if (mode === "extract") prompt = glossaryExtractPrompt(content, feedback);
    else if (mode === "define") { if (!extractReport) return { status: 400, body: { error: "extractReport required for define mode" } }; prompt = glossaryDefinePrompt(content, extractReport, feedback); }
    else return { status: 400, body: { error: "mode must be 'extract' or 'define'" } };
    await streamToSSE(res, prompt, { agent: "glossary", mode, hasFeedback: !!feedback });
    return null;

  } else {
    return { status: 404, body: { error: `Unknown docs-agent route: ${route}` } };
  }
}

// ── HTTP Server ─────────────────────────────────────────────────────────────
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Read body
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;
  let body = {};
  try { body = JSON.parse(rawBody); } catch { /* empty */ }

  // DocOps SSE routes — handle before standard JSON routes
  if (req.url.startsWith("/api/docs-agent/")) {
    try {
      const result = await docsAgentHandler(req.url, body, res);
      // result === null means streamToSSE already responded
      if (result !== null) {
        res.writeHead(result.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result.body));
      }
    } catch (err) {
      console.error("[DocOps] Handler error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Internal error" }));
      }
    }
    return;
  }

  let result;
  try {
    if (req.url === "/api/mstp-chat") {
      result = await mstpChatHandler(body);
    } else if (req.url === "/api/chat") {
      result = await chatHandler(body);
    } else {
      result = { status: 404, body: { error: `Unknown route: ${req.url}` } };
    }
  } catch (err) {
    console.error("Handler error:", err);
    result = { status: 500, body: { error: err.message || String(err) } };
  }

  res.writeHead(result.status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result.body));
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  ✗ Port ${PORT} is already in use. Kill the old process first:\n    kill $(lsof -ti:${PORT})\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log("");
  console.log("  ┌──────────────────────────────────────────────────────────┐");
  console.log("  │  🚀 Local API server running on port " + PORT + "               │");
  console.log("  │                                                          │");
  console.log("  │  Routes:                                                 │");
  console.log("  │    POST /api/chat                → Groq (portfolio)      │");
  console.log("  │    POST /api/mstp-chat           → HF (MSTP bot)         │");
  console.log("  │    POST /api/docs-agent/pipeline → DocOps Pipeline       │");
  console.log("  │    POST /api/docs-agent/mcp      → DocOps MCP Agent      │");
  console.log("  │    POST /api/docs-agent/normalize→ DocOps Normalizer     │");
  console.log("  │    POST /api/docs-agent/glossary → DocOps Glossary       │");
  console.log("  │                                                          │");
  console.log("  │  Env vars loaded:                                        │");
  console.log("  │    HF_TOKEN:          " + (process.env.HF_TOKEN ? "✓ set" : "✗ MISSING") + "                          │");
  console.log("  │    GROQ_API_KEY:      " + (process.env.GROQ_API_KEY ? "✓ set" : "✗ MISSING") + "                          │");
  console.log("  │    OPENROUTER_API_KEY:" + (process.env.OPENROUTER_API_KEY ? "✓ set" : "✗ MISSING") + "                          │");
  console.log("  │    LANGFUSE_PUBLIC_KEY:" + (process.env.LANGFUSE_PUBLIC_KEY ? "✓ set (tracing on)" : "✗ not set (tracing off)") + "       │");
  console.log("  └──────────────────────────────────────────────────────────┘");
  console.log("");
});
