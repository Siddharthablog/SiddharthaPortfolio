// @ts-nocheck
/**
 * Vercel serverless function — DocOps Normalizer Agent (SSE)
 * Route: POST /api/docs-agent-normalize
 *
 * vercel.json rewrites /api/docs-agent/normalize → this file.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DOCOPS_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

function auditPrompt(content, feedback) {
  return `You are an API Reference Normalizer agent.
TASK: Audit API reference pages for structural compliance.
Standard template sections (in order): Environment URLs, Request Headers, Request Parameters, Sample Request (cURL), Sample Response (JSON), Response Parameters, Error Codes, Related APIs.
CHECK FOR: Missing sections, wrong ordering, verbose HTML tables instead of markdown, duplicate metadata, inconsistent parameter tables, hardcoded values in examples.
${feedback ? `CORRECTION NOTE: ${feedback}` : ""}
OUTPUT: ## 🔍 Audit Report with Compliance Summary table (severity 🔴/🟡/🟢), Issues Found count, Sections Analysis, Recommended Fix Order.

CONTENT TO AUDIT:
${content}`;
}

function fixPrompt(content, auditReport, feedback) {
  return `You are an API Reference Normalizer agent. Apply ALL fixes from the audit report. Produce fully normalised API reference.
RULES: Convert HTML/JSX tables to markdown. Enforce section order. Parameter tables: Parameter|Type|Required|Description. Mandatory params first (bold). Placeholder variables in code. Remove duplicate metadata. Add ⚠️ Info Gap for unknowns.
${feedback ? `ADDITIONAL CORRECTION: ${feedback}` : ""}
OUTPUT: Clean normalized page ready to copy. No commentary.

AUDIT REPORT:
${auditReport}

ORIGINAL CONTENT:
${content}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const { mode, content, auditReport, feedback } = req.body ?? {};

  if (!content) { res.status(400).json({ error: "content required" }); return; }

  let prompt: string;
  if      (mode === "audit") prompt = auditPrompt(content, feedback);
  else if (mode === "fix")   { if (!auditReport) { res.status(400).json({ error: "auditReport required for fix mode" }); return; } prompt = fixPrompt(content, auditReport, feedback); }
  else { res.status(400).json({ error: "mode must be 'audit' or 'fix'" }); return; }

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
