// @ts-nocheck
// ── MSTP Finetune Chat — Hugging Face Space API ──────────────────────────────
//
// This Vercel Serverless Function forwards user messages to a fine-tuned
// Hugging Face model hosted on a Hugging Face Space.

export default async function handler(req: any, res: any) {
  // ── CORS ────────────────────────────────────────────────────────────────────
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

  try {
    // ── Extract message ─────────────────────────────────────────────────────────
    const { message, messages } = req.body ?? {};

    let userMessage = "";
    if (messages && Array.isArray(messages) && messages.length > 0) {
      userMessage = messages[messages.length - 1]?.content || "";
    } else if (message) {
      userMessage = message;
    }

    if (!userMessage.trim()) {
      res.status(400).json({ error: "message required" });
      return;
    }

    // ── Extract previous history for Gradio ────────────────────────────────────
    const history = messages && Array.isArray(messages) && messages.length > 1
      ? messages.slice(0, -1)
      : [];

    const hfToken = process.env.HF_TOKEN;
    const hfSpaceUrl = "https://siddhartha03-mstp-finetune-bot.hf.space/gradio_api/call/chat";

    console.log(`[HF Space API] Sending request to ${hfSpaceUrl}...`);

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
      res.status(submitRes.status).json({
        error: `Hugging Face Space submit failed: ${submitRes.statusText || submitRes.status}`,
        details: errText
      });
      return;
    }

    const { event_id } = await submitRes.json();
    if (!event_id) {
      res.status(502).json({ error: "No event_id returned from Hugging Face Space" });
      return;
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
      res.status(streamRes.status).json({
        error: `Hugging Face Space stream failed: ${streamRes.statusText || streamRes.status}`,
        details: errText
      });
      return;
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
      res.status(502).json({ error: `Hugging Face Space error: ${errorMsg}` });
      return;
    }

    if (!answer) {
      res.status(502).json({ error: "Empty or invalid response received from Hugging Face Space" });
      return;
    }

    res.status(200).json({ answer });
  } catch (err: any) {
    console.error("MSTP chat handler error:", err);
    res.status(500).json({
      error: "Internal server error: " + (err.message || String(err)),
    });
  }
}
