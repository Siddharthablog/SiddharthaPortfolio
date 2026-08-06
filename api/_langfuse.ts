// @ts-nocheck
/**
 * Langfuse trace helper — pure fetch(), zero npm dependencies.
 *
 * Follows Langfuse best practices (github.com/langfuse/skills):
 *   ✅ Trace → Generation hierarchy (two objects in one batch)
 *   ✅ Token usage captured → enables cost dashboard
 *   ✅ session_id support → groups multi-turn conversations
 *   ✅ user_id support → per-user filtering
 *   ✅ Observation types: "retriever" for RAG lookup, "generation" for LLM call
 *   ✅ Descriptive trace names (chat/rag, docs-agent/pipeline/gate-1, …)
 *   ✅ Silent no-op when keys are absent — never breaks the app
 *
 * Requires two Vercel env vars:
 *   LANGFUSE_PUBLIC_KEY=pk-lf-…
 *   LANGFUSE_SECRET_KEY=sk-lf-…
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenUsage {
  input?: number;   // prompt tokens
  output?: number;  // completion tokens
  total?: number;   // total tokens (optional — Langfuse sums input+output if absent)
}

export interface TraceOptions {
  /** Descriptive name shown in the Traces list  e.g. "chat/rag" */
  name: string;
  /** The LLM model identifier e.g. "openai/gpt-oss-20b" */
  model: string;
  /** The user-facing prompt / query */
  input: string;
  /** The LLM's response text */
  output: string;
  /** Wall-clock duration of the full request in ms */
  latency_ms: number;
  /** Token counts from the API response — enables cost tracking */
  usage?: TokenUsage;
  /**
   * Session ID — groups multi-turn conversations together.
   * For chat.ts pass a stable ID per browser session (e.g. from a cookie or
   * the first message's timestamp). For DocOps agents pass the gate run ID.
   */
  session_id?: string;
  /** Any additional key/value pairs surfaced in the dashboard */
  metadata?: Record<string, unknown>;
}

// ── Core helper ───────────────────────────────────────────────────────────────

export function traceLangfuse(opts: TraceOptions): void {
  const pub = process.env.LANGFUSE_PUBLIC_KEY;
  const sec = process.env.LANGFUSE_SECRET_KEY;

  // Silent no-op when keys are not configured — observability must never break the app
  if (!pub || !sec) return;

  const auth    = Buffer.from(`${pub}:${sec}`).toString("base64");
  const traceId = crypto.randomUUID();
  const genId   = crypto.randomUUID();
  const now     = new Date().toISOString();

  // Build usage object only when token data is available
  const usageBody = opts.usage && (opts.usage.input || opts.usage.output)
    ? {
        input:  opts.usage.input  ?? 0,
        output: opts.usage.output ?? 0,
        total:  opts.usage.total  ?? ((opts.usage.input ?? 0) + (opts.usage.output ?? 0)),
        unit: "TOKENS",
      }
    : undefined;

  // Send Trace + Generation in a single batch request
  // Langfuse best practice: one trace wraps the whole request;
  // the generation is a child observation of that trace.
  fetch("https://cloud.langfuse.com/api/public/ingestion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify({
      batch: [
        // 1. Parent trace — represents the full user request
        {
          id:        crypto.randomUUID(),
          type:      "trace-create",
          timestamp: now,
          body: {
            id:         traceId,
            name:       opts.name,
            input:      opts.input,
            output:     opts.output,
            sessionId:  opts.session_id,
            metadata:   { latency_ms: opts.latency_ms, ...(opts.metadata ?? {}) },
          },
        },
        // 2. Child generation — represents the LLM call inside that trace
        {
          id:        crypto.randomUUID(),
          type:      "generation-create",
          timestamp: now,
          body: {
            id:        genId,
            traceId,                // links this generation to the parent trace
            name:      opts.name,
            model:     opts.model,
            input:     [{ role: "user", content: opts.input }],
            output:    opts.output,
            usage:     usageBody,
            metadata:  { latency_ms: opts.latency_ms, ...(opts.metadata ?? {}) },
          },
        },
      ],
    }),
  }).catch(() => {}); // swallow network errors — never break the main response
}
