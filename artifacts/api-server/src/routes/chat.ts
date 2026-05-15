import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

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

function getChunks(filePath: string): string[] {
  if (_chunks) return _chunks;
  const raw = readFileSync(filePath, "utf-8");
  _chunks = raw
    .split(/\n\n+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 40);
  return _chunks;
}

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

router.post("/chat", async (req, res) => {
  // Handle both single message (legacy) and messages array
  const { message, messages } = req.body as { message?: string, messages?: any[] };

  let history: any[] = [];
  let latestMessage = "";

  if (messages && Array.isArray(messages)) {
    history = messages;
    latestMessage = messages[messages.length - 1]?.content || "";
  } else if (message) {
    history = [{ role: "user", content: message }];
    latestMessage = message;
  }

  if (!latestMessage?.trim()) {
    res.status(400).json({ error: "message(s) required" });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured" });
    return;
  }

  // Path from api-server's working directory to the frontend's public folder
  const knowledgePath =
    process.env.KNOWLEDGE_FILE_PATH ??
    join(process.cwd(), "..", "how-its-built", "public", "knowledge.txt");

  try {
    // Combine the last 3 messages into a single query to give RAG better context (e.g. resolving "there" to "Kreatio")
    const queryForRag = history.slice(-3).map(m => m.content).join(" ");
    const context = retrieveChunks(queryForRag, getChunks(knowledgePath));

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
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
      res.status(502).json({ error: "AI service error" });
      return;
    }

    res.json({
      answer: data.choices?.[0]?.message?.content ?? "No response.",
    });
  } catch (err) {
    console.error("Chat route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
