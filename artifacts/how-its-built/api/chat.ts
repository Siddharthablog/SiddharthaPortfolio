// @ts-nocheck
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ── RAG Utilities ─────────────────────────────────────────────────────────────

/** Tokenize text to lowercase words (length > 2, alphanumeric only) */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Cosine similarity via set intersection (no vectors needed) */
function scoreChunk(queryTokens: string[], chunkTokens: string[]): number {
  const qSet = new Set(queryTokens);
  const cSet = new Set(chunkTokens);
  const intersection = [...qSet].filter((t) => cSet.has(t)).length;
  if (intersection === 0) return 0;
  return intersection / Math.sqrt(qSet.size * cSet.size);
}

/** Split knowledge.txt into chunks, score each, return top K joined as string */
function retrieveChunks(query: string, chunks: string[], topK = 5): string {
  const qTokens = tokenize(query);
  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(qTokens, tokenize(chunk)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((c) => c.chunk)
    .join("\n\n");
}

/** Load and chunk knowledge.txt (cached after first load) */
let _chunks: string[] | null = null;

function getChunks(): string[] {
  if (_chunks) return _chunks;
  
  // Try multiple possible locations depending on Vercel Root Directory config
  const possiblePaths = [
    join(process.cwd(), "public", "knowledge.txt"),
    join(process.cwd(), "artifacts", "how-its-built", "public", "knowledge.txt"),
    join(__dirname, "..", "public", "knowledge.txt"),
    join(__dirname, "..", "artifacts", "how-its-built", "public", "knowledge.txt")
  ];

  let raw = "";
  for (const p of possiblePaths) {
    try {
      raw = readFileSync(p, "utf-8");
      break;
    } catch (e) {
      // continue checking
    }
  }

  if (!raw) {
    throw new Error("Could not find knowledge.txt in any deployed location.");
  }

  _chunks = raw
    .split(/\n\n+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 40);
  return _chunks;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
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

  // Handle both single message (legacy) and messages array
  const { message, messages } = req.body ?? {};
  
  let history: any[] = [];
  let latestMessage = "";

  if (messages && Array.isArray(messages)) {
    history = messages;
    latestMessage = messages[messages.length - 1]?.content || "";
  } else if (message) {
    history = [{ role: "user", content: message }];
    latestMessage = message;
  }

  if (!latestMessage.trim()) {
    res.status(400).json({ error: "message(s) required" });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured in Vercel Environment Variables" });
    return;
  }

  try {
    // Combine the last 3 messages into a single query to give RAG better context (e.g. resolving "there" to "Kreatio")
    const queryForRag = history.slice(-3).map(m => m.content).join(" ");
    const context = retrieveChunks(queryForRag, getChunks());

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          temperature: 0.3,
          max_tokens: 512,
          messages: [
            {
              role: "system",
              content: `You are Siddhartha Mani's personal AI assistant on their portfolio website. Answer questions using ONLY the context below. Be friendly, concise, and professional. If you cannot answer from the context say: "I don't have that detail, but you can reach Siddhartha at mani.siddhartha@gmail.com"\n\nCONTEXT:\n${context}`,
            },
            ...history
          ],
        }),
      },
    );

    const data: any = await groqRes.json();

    if (data.error) {
      res.status(502).json({ error: "Groq AI service error: " + (data.error.message || JSON.stringify(data.error)) });
      return;
    }

    res.status(200).json({ answer: data.choices?.[0]?.message?.content ?? "No response." });
  } catch (err: any) {
    console.error("Chat handler error:", err);
    res.status(500).json({ error: "Internal server error: " + (err.message || String(err)) });
  }
}
