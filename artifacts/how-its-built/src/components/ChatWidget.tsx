import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  text: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  text: "👋 Hi! I'm Siddhartha's AI assistant. Ask me anything about his experience, skills, or how to get in touch!",
};

const SUGGESTED_QUESTIONS = [
  "What is Siddhartha's current role?",
  "What are his key achievements?",
  "What skills does he have?",
];

// ── API helper ─────────────────────────────────────────────────────────────────
async function fetchAnswer(messages: Message[]): Promise<string> {
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: formattedMessages }),
  });
  
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(`Failed to parse response. HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  
  return data.answer ?? "No response.";
}

// ── ChatWidget ─────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth < 640;

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", text: msg }];
    setMessages(newMessages);
    setLoading(true);
    
    try {
      // Send the history (excluding the welcome message)
      const answer = await fetchAnswer(newMessages.slice(1));
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err: any) {
      console.error("Chat fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Sorry, I couldn't reach the AI service (${err.message || "Unknown error"}). Please try again or email mani.siddhartha@gmail.com`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── Panel dimensions ──────────────────────────────────────────────────────
  const panelW = isMobile() ? "calc(100vw - 32px)" : "340px";
  const panelH = isMobile() ? "72vh" : "500px";

  return (
    <>
      {/* ── Floating toggle button ──────────────────────────────────────────── */}
      <button
        id="chat-widget-toggle"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10010,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: open
            ? "hsl(100,40%,32%)"
            : "linear-gradient(135deg, hsl(100,40%,44%), hsl(100,40%,36%))",
          color: "white",
          fontSize: open ? 20 : 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: open
            ? "0 4px 20px hsl(100,40%,30%,0.4)"
            : "0 4px 24px hsl(100,40%,44%,0.45)",
          transition: "background 0.22s ease, box-shadow 0.22s ease, transform 0.18s ease",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      <div
        id="chat-widget-panel"
        role="dialog"
        aria-label="AI Chat Assistant"
        style={{
          position: "fixed",
          bottom: 88,
          right: isMobile() ? 16 : 24,
          zIndex: 10009,
          width: panelW,
          height: panelH,
          background: "white",
          borderRadius: "1.25rem",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.16), 0 2px 12px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, hsl(100,40%,40%), hsl(100,40%,32%))",
            padding: "0.9rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                lineHeight: 1.3,
              }}
            >
              Siddhartha's Assistant
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 10,
                fontWeight: 500,
                marginTop: 1,
              }}
            >

            </div>
          </div>
          <button
            id="chat-widget-close"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "white",
              width: 28,
              height: 28,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.28)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.15)";
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Message list ─────────────────────────────────────────────────── */}
        <div
          id="chat-widget-messages"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "9px 13px",
                  borderRadius:
                    m.role === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                  background:
                    m.role === "user"
                      ? "hsl(100,40%,40%)"
                      : "hsl(45,30%,95%)",
                  color: m.role === "user" ? "white" : "hsl(40,10%,20%)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                  boxShadow:
                    m.role === "user"
                      ? "0 2px 8px hsl(100,40%,40%,0.25)"
                      : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p style={{ margin: "0 0 0.5em 0" }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ margin: "0.5em 0", paddingLeft: "1.5em" }} {...props} />,
                      li: ({ node, ...props }) => <li style={{ marginBottom: "0.25em" }} {...props} />
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}

          {/* Suggested questions — only when only the welcome message is shown */}
          {messages.length === 1 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginTop: 4,
              }}
            >
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  id={`chat-suggest-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
                  onClick={() => send(q)}
                  style={{
                    background: "hsl(100,40%,44%,0.08)",
                    border: "1.5px solid hsl(100,40%,44%,0.25)",
                    borderRadius: 9999,
                    padding: "6px 14px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "hsl(100,40%,34%)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "hsl(100,40%,44%,0.16)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "hsl(100,40%,44%,0.45)";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "hsl(100,40%,44%,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "hsl(100,40%,44%,0.25)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  background: "hsl(45,30%,95%)",
                  borderRadius: "14px 14px 14px 4px",
                  padding: "10px 16px",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "hsl(100,40%,44%)",
                      animation: `chatPulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input row ────────────────────────────────────────────────────── */}
        <div
          style={{
            borderTop: "1px solid hsl(40,14%,88%)",
            padding: "0.65rem 0.75rem",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
            background: "hsl(45,22%,98%)",
          }}
        >
          <input
            id="chat-widget-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything…"
            disabled={loading}
            style={{
              flex: 1,
              border: "1.5px solid hsl(40,14%,82%)",
              borderRadius: 9999,
              padding: "8px 14px",
              fontSize: 13,
              outline: "none",
              background: "white",
              color: "hsl(40,10%,18%)",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "hsl(100,40%,44%)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "hsl(40,14%,82%)";
            }}
          />
          <button
            id="chat-widget-send"
            aria-label="Send message"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background:
                !input.trim() || loading
                  ? "hsl(40,14%,88%)"
                  : "hsl(100,40%,40%)",
              color: !input.trim() || loading ? "hsl(40,8%,60%)" : "white",
              fontSize: 16,
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.18s, color 0.18s",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
