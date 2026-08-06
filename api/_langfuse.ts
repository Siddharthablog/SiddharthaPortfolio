// @ts-nocheck
/**
 * Langfuse trace helper — pure fetch(), zero npm dependencies.
 *
 * Usage:
 *   import { traceLangfuse } from "./_langfuse";
 *   traceLangfuse({ name, model, input, output, latency_ms, metadata });
 *
 * Requires two Vercel env vars (silent no-op if missing):
 *   LANGFUSE_PUBLIC_KEY=pk-lf-…
 *   LANGFUSE_SECRET_KEY=sk-lf-…
 */

export function traceLangfuse(opts: {
  name: string;                          // e.g. "chat/rag" | "docs-agent/pipeline/gate-1"
  model: string;                         // e.g. "openai/gpt-oss-20b"
  input: string;                         // full prompt or user message sent to LLM
  output: string;                        // full LLM response text
  latency_ms: number;                    // wall-clock duration of the LLM call
  metadata?: Record<string, unknown>;    // any extra fields to surface in the dashboard
}): void {
  const pub = process.env.LANGFUSE_PUBLIC_KEY;
  const sec = process.env.LANGFUSE_SECRET_KEY;

  // Silently skip when keys are not configured — never break the main response
  if (!pub || !sec) return;

  const auth = Buffer.from(`${pub}:${sec}`).toString("base64");

  // Fire-and-forget: intentionally NOT awaited
  // Vercel will keep the lambda warm long enough for this tiny HTTP POST
  fetch("https://cloud.langfuse.com/api/public/ingestion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify({
      batch: [
        {
          id: crypto.randomUUID(),
          type: "generation-create",
          timestamp: new Date().toISOString(),
          body: {
            name:     opts.name,
            model:    opts.model,
            input:    [{ role: "user", content: opts.input }],
            output:   opts.output,
            metadata: { latency_ms: opts.latency_ms, ...(opts.metadata ?? {}) },
          },
        },
      ],
    }),
  }).catch(() => {}); // swallow network errors — observability must never break the app
}
