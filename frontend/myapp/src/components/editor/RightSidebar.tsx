"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage, ChatMessage } from "@/lib/api";

interface Props {
  projectId: string;
  editorContent: string;
  aiResult: { text: string; changes?: { type: string; description: string }[] } | null;
  onClearResult: () => void;
}

 function RightSidebar({ projectId, editorContent, aiResult, onClearResult }: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("Standard");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendChatMessage(updated, projectId, editorContent);
      setMessages([...updated, reply]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Sorry, something went wrong. Please try again.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside style={{
      width: "320px", flexShrink: 0,
      background: "#faf7f4", borderLeft: "1px solid #e8e2d9",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1rem", height: "52px",
        borderBottom: "1px solid #e8e2d9",
      }}>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {(["chat", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.35rem 0.85rem", borderRadius: "8px",
                border: "none", background: activeTab === tab ? "#1a1510" : "transparent",
                color: activeTab === tab ? "#fff" : "#9e9589",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500,
                cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button style={tabIconBtn} title="New chat" onClick={() => setMessages([])}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* AI Result Panel */}
      {aiResult && (
        <div style={{
          margin: "0.75rem", padding: "1rem",
          background: "#fff", borderRadius: "12px",
          border: "1px solid #e8e2d9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          animation: "fadeUp 0.3s ease both",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#c96a3b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Result
            </span>
            <button onClick={onClearResult} style={{ ...tabIconBtn, color: "#9e9589" }}>✕</button>
          </div>

          {aiResult.text && (
            <p style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "#1a1510", marginBottom: aiResult.changes ? "0.75rem" : 0 }}>
              {aiResult.text}
            </p>
          )}

          {aiResult.changes && aiResult.changes.length > 0 && (
            <div style={{ borderTop: "1px solid #f0ebe3", paddingTop: "0.75rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                What changed & why
              </p>
              {aiResult.changes.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 600, padding: "0.1rem 0.45rem",
                    borderRadius: "20px", background: tagColors[c.type] || "#f5f1eb",
                    color: "#1a1510", whiteSpace: "nowrap", height: "fit-content", marginTop: "1px",
                  }}>
                    {c.type}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#4a4540", lineHeight: 1.5 }}>{c.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      {activeTab === "chat" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
            {messages.length === 0 && !aiResult && (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9e9589" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💬</div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510", marginBottom: "0.4rem" }}>Start a conversation</p>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>Ask questions about your project, get writing suggestions, or paste text for analysis.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: "0.75rem",
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: "0.5rem",
                animation: "fadeUp 0.2s ease both",
              }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user" ? "#1a1510" : "#fff",
                  color: msg.role === "user" ? "#fff" : "#1a1510",
                  border: msg.role === "assistant" ? "1px solid #e8e2d9" : "none",
                  fontSize: "0.82rem", lineHeight: 1.6,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{
                  padding: "0.6rem 0.85rem", borderRadius: "14px 14px 14px 4px",
                  background: "#fff", border: "1px solid #e8e2d9",
                }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: "6px", height: "6px", borderRadius: "50%", background: "#c96a3b",
                        animation: `bounce 1s ease ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid #e8e2d9" }}>
            <div style={{
              background: "#fff", border: "1px solid #e8e2d9",
              borderRadius: "12px", overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a question about your project…"
                rows={2}
                style={{
                  width: "100%", padding: "0.75rem",
                  border: "none", outline: "none", resize: "none",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem",
                  color: "#1a1510", background: "transparent", lineHeight: 1.5,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.75rem", borderTop: "1px solid #f0ebe3" }}>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  style={{
                    border: "none", background: "transparent",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem",
                    color: "#9e9589", cursor: "pointer", outline: "none",
                  }}
                >
                  <option>Standard</option>
                  <option>Advanced</option>
                </select>
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    border: "none", background: input.trim() ? "#c96a3b" : "#e8e2d9",
                    color: "#fff", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", color: "#9e9589", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🕐</div>
            <p style={{ fontSize: "0.83rem" }}>Your AI action history will appear here.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </aside>
  );
}

const tabIconBtn: React.CSSProperties = {
  width: "26px", height: "26px", borderRadius: "6px",
  border: "none", background: "transparent",
  cursor: "pointer", color: "#9e9589",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s",
};

const tagColors: Record<string, string> = {
  structure: "#fde8d8",
  clarity: "#dceeff",
  flow: "#e8f5e9",
  tone: "#f3e8ff",
  consistency: "#fff3cd",
};
export default RightSidebar;