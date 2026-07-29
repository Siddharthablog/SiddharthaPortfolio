// @ts-nocheck
/**
 * Vercel serverless function — DocOps Glossary Builder Agent (SSE)
 * Route: POST /api/docs-agent-glossary
 *
 * vercel.json rewrites /api/docs-agent/glossary → this file.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DOCOPS_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

function extractPrompt(content, feedback) {
  return `You are a Glossary Builder agent.
TASK: Scan docs for API terms, technical terms, domain vocabulary.
Prioritise by Tier: Tier 1 = support-ticket terms (auth, identifiers, callbacks), Tier 2 = domain-specific, Tier 3 = general web/API terms.
Flag inconsistencies (webhook vs web hook, callback_url vs callbackUrl).
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📚 Term Extraction Report with Summary, Inconsistency Flags table, Tier 1/2/3 term tables (Term|Used In|Context Snippet|Defined?).

CONTENT:
${content}`;
}

function definePrompt(content, extractReport, feedback) {
  return `You are a Glossary Builder agent. Generate canonical glossary definitions.
RULES: One sentence max per definition. Never use the term in its own definition. For params: state type, purpose, context. For auth terms: what it represents, when to use. Mark uncertain definitions with ⚠️ Confirm with API team.
${feedback ? `CORRECTION: ${feedback}` : ""}
OUTPUT: ## 📖 Proposed Glossary with Canonical Term Decisions, then Tier 1/2/3 definitions with Type and Context tags.

TERM EXTRACTION REPORT:
${extractReport}

ORIGINAL CONTENT:
${content}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const { mode, content, extractReport, feedback } = req.body ?? {};

  if (!content) { res.status(400).json({ error: "content required" }); return; }

  let prompt: string;
  if      (mode === "extract") prompt = extractPrompt(content, feedback);
  else if (mode === "define")  { if (!extractReport) { res.status(400).json({ error: "extractReport required for define mode" }); return; } prompt = definePrompt(content, extractReport, feedback); }
  else { res.status(400).json({ error: "mode must be 'extract' or 'define'" }); return; }

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
