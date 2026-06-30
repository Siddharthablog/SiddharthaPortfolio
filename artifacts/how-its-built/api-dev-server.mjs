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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env manually (no extra dependencies) ─────────────────────────────
function loadEnv() {
  // Try local .env first, then root .env
  const envPaths = [
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", "..", ".env"),
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
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
      console.log(`  ✓ Loaded env from ${envPath}`);
    }
  }
}

loadEnv();

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
  console.log("  ┌─────────────────────────────────────────────┐");
  console.log("  │  🚀 Local API server running on port " + PORT + "    │");
  console.log("  │                                             │");
  console.log("  │  Routes:                                    │");
  console.log("  │    POST /api/chat       → Groq (portfolio)  │");
  console.log("  │    POST /api/mstp-chat  → HF (MSTP bot)     │");
  console.log("  │                                             │");
  console.log("  │  Env vars loaded:                           │");
  console.log("  │    HF_TOKEN:      " + (process.env.HF_TOKEN ? "✓ set" : "✗ MISSING") + "                    │");
  console.log("  │    HF_MODEL_NAME: " + (process.env.HF_MODEL_NAME ? "✓ set" : "✗ MISSING") + "                    │");
  console.log("  │    GROQ_API_KEY:  " + (process.env.GROQ_API_KEY ? "✓ set" : "✗ MISSING") + "                    │");
  console.log("  └─────────────────────────────────────────────┘");
  console.log("");
});
