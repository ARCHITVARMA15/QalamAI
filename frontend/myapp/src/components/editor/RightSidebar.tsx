"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage, ChatMessage, Contradiction } from "@/lib/api";

// ─── localStorage Chat History Types ────────────────────────────────────────
interface ChatSession {
  id: string;
  projectId: string;
  firstMessage: string;   // Preview of the first user message
  messageCount: number;
  timestamp: number;       // When the session was last active
  messages: ChatMessage[];
}

const HISTORY_KEY_PREFIX = "kalam-chat-history-";

function getChatHistory(projectId: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY_PREFIX + projectId);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveChatHistory(projectId: string, sessions: ChatSession[]) {
  // Keep only the last 50 sessions to avoid localStorage bloat
  const capped = sessions.slice(0, 50);
  localStorage.setItem(HISTORY_KEY_PREFIX + projectId, JSON.stringify(capped));
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  scriptId: string | null;
  editorContent: string;
  // AI result from the action bar (rewrite, describe, etc.)
  aiResult: { text: string; changes?: { type: string; description: string }[] } | null;
  onClearResult: () => void;
  // Contradictions (continuity issues) — from orchestration pipeline
  contradictions: Contradiction[];
  onResolveContradiction: (contraId: string) => Promise<void>;
  onRefreshContradictions: () => Promise<void>;
  // Suggestions from auto-suggest pipeline
  suggestions: string[];
  onClearSuggestions: () => void;
  // Insert AI/chat text into the editor
  onInsertIntoEditor?: (text: string) => void;
  // Alert counts — driven by orchestration results from the parent
  newIssueCount: number;
  newSuggestionCount: number;
  onDismissAlerts: () => void;
  // Called after every user chat message — parent uses this to trigger orchestration
  // message: the raw text the user typed (so contradiction check runs against their idea)
  onAfterSend?: (message: string) => void;
  // Controlled width from parent resize handle
  width?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

function RightSidebar({
  projectId, scriptId, editorContent,
  aiResult, onClearResult,
  contradictions, onResolveContradiction, onRefreshContradictions,
  suggestions, onClearSuggestions,
  onInsertIntoEditor,
  newIssueCount, newSuggestionCount, onDismissAlerts,
  onAfterSend,
  width = 420,
}: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "history" | "issues" | "suggestions">("chat");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("Standard");
  const bottomRef = useRef<HTMLDivElement>(null);

  // History from localStorage
  const [history, setHistory] = useState<ChatSession[]>([]);

  // Load history on mount and when projectId changes
  useEffect(() => {
    setHistory(getChatHistory(projectId));
  }, [projectId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Save current conversation to localStorage ─────────────────────────────
  const saveCurrentChat = useCallback(() => {
    if (messages.length === 0) return;

    const firstUserMsg = messages.find(m => m.role === "user")?.content || "New conversation";
    const session: ChatSession = {
      id: activeChatId || `chat-${Date.now()}`,
      projectId,
      firstMessage: firstUserMsg.slice(0, 80),
      messageCount: messages.length,
      timestamp: Date.now(),
      messages,
    };

    const existing = getChatHistory(projectId);
    // Replace if same ID, otherwise prepend
    const idx = existing.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      existing[idx] = session;
    } else {
      existing.unshift(session);
    }
    saveChatHistory(projectId, existing);
    setHistory(existing);
    setActiveChatId(session.id);
  }, [messages, activeChatId, projectId]);

  // Auto-save chat after each new message
  useEffect(() => {
    if (messages.length > 0) saveCurrentChat();
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send chat message ─────────────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    // Notify parent with the raw message — triggers orchestration on first message
    onAfterSend?.(input.trim());
    try {
      const reply = await sendChatMessage(updated, projectId, scriptId || "", editorContent, model);
      setMessages([...updated, reply]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Sorry, something went wrong. Please try again.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  // ── New chat — save current and start fresh ───────────────────────────────
  const startNewChat = () => {
    saveCurrentChat();
    setMessages([]);
    setActiveChatId(null);
    setActiveTab("chat");
  };

  // ── Restore a historical conversation ─────────────────────────────────────
  const restoreChat = (session: ChatSession) => {
    // Save current first if there are messages
    if (messages.length > 0) saveCurrentChat();
    setMessages(session.messages);
    setActiveChatId(session.id);
    setActiveTab("chat");
  };

  // ── Delete a history entry ────────────────────────────────────────────────
  const deleteHistoryEntry = (sessionId: string) => {
    const updated = history.filter(s => s.id !== sessionId);
    saveChatHistory(projectId, updated);
    setHistory(updated);
    // If the deleted session was the active one, clear it
    if (activeChatId === sessionId) {
      setMessages([]);
      setActiveChatId(null);
    }
  };

  // ── Tab switching — dismiss alert when user opens the relevant tab ────────
  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === "issues" || tab === "suggestions") {
      onDismissAlerts();
    }
  };

  // ── Tab definitions with badge counts ─────────────────────────────────────
  const tabs = [
    { id: "chat" as const, label: "Chat", badge: 0 },
    { id: "history" as const, label: "History", badge: history.length },
    { id: "issues" as const, label: "Issues", badge: contradictions.length },
    { id: "suggestions" as const, label: "Suggest", badge: suggestions.length },
  ];

  return (
    <aside style={{
      width: `${width}px`, flexShrink: 0,
      background: "#fef6ee", borderLeft: "1px solid #e8e2d9",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* ── Tab Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "stretch", flexWrap: "nowrap",
        padding: "0 0.5rem", minHeight: "52px",
        borderBottom: "1px solid #e8e2d9", flexShrink: 0,
        gap: "0.25rem",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.1rem",
          flex: "1 1 0", minWidth: 0, overflow: "hidden",
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                padding: "0.38rem 0.45rem", borderRadius: "6px",
                border: "none", background: activeTab === tab.id ? "#047857" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#9e9589",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
                whiteSpace: "nowrap", flexShrink: 0,
                display: "flex", alignItems: "center", gap: "0.3rem",
                position: "relative",
              }}
            >
              {tab.label}
              {/* Badge for non-zero counts */}
              {tab.badge > 0 && activeTab !== tab.id && (
                <span style={{
                  fontSize: "0.6rem", fontWeight: 700,
                  background: tab.id === "issues" ? "#dc3545" : tab.id === "suggestions" ? "#047857" : "#9e9589",
                  color: "#fff",
                  borderRadius: "10px", padding: "0.05rem 0.35rem",
                  minWidth: "16px", textAlign: "center",
                  lineHeight: "1.3",
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* New chat button */}
        <button style={tabIconBtn} title="New chat" onClick={startNewChat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── Alert Banner — appears when orchestration found new issues/suggestions ── */}
      {(newIssueCount > 0 || newSuggestionCount > 0) && activeTab === "chat" && (
        <div style={{
          margin: "0.5rem 0.75rem 0", padding: "0.55rem 0.75rem",
          background: newIssueCount > 0 ? "#fff3cd" : "#e8f5e9",
          border: `1px solid ${newIssueCount > 0 ? "#ffc107" : "#81c784"}`,
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          animation: "fadeUp 0.3s ease both",
          cursor: "pointer",
        }}
        onClick={() => handleTabClick(newIssueCount > 0 ? "issues" : "suggestions")}
        >
          <span style={{ fontSize: "0.78rem", color: newIssueCount > 0 ? "#856404" : "#2e7d32", fontWeight: 600 }}>
            {newIssueCount > 0 && `⚠️ ${newIssueCount} issue${newIssueCount > 1 ? "s" : ""} found`}
            {newIssueCount > 0 && newSuggestionCount > 0 && " · "}
            {newSuggestionCount > 0 && `💡 ${newSuggestionCount} suggestion${newSuggestionCount > 1 ? "s" : ""}`}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#9e9589" }}>Tap to view →</span>
        </div>
      )}

      {/* ── AI Result Panel — visible regardless of tab ─────────────────────── */}
      {aiResult && (
        <div style={{
          margin: "0.75rem", padding: "1rem",
          background: "#fff", borderRadius: "12px",
          border: "1px solid #e8e2d9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          animation: "fadeUp 0.3s ease both",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Result
            </span>
            <button onClick={onClearResult} style={{ ...tabIconBtn, color: "#9e9589" }}>✕</button>
          </div>

          {aiResult.text && (
            <>
              <p style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "#1a1510", marginBottom: aiResult.changes ? "0.75rem" : 0 }}>
                {aiResult.text}
              </p>
              {onInsertIntoEditor && (
                <button
                  type="button"
                  onClick={() => onInsertIntoEditor(aiResult.text)}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#047857",
                    background: "transparent",
                    border: "1px solid #047857",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  title="Insert this result into the script at cursor (or at end)"
                >
                  Insert into script
                </button>
              )}
            </>
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

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 1: CHAT
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "chat" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
            {messages.length === 0 && !aiResult && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#9e9589" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💬</div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510", marginBottom: "0.4rem" }}>Start a conversation</p>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>Ask questions about your project, or paste text to <strong>Fact Check</strong> against the story.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                marginBottom: "0.75rem",
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: "0.5rem",
                animation: "fadeUp 0.2s ease both",
                flexWrap: "wrap",
              }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "0.7rem 1rem",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? "#047857" : "#fff",
                  color: msg.role === "user" ? "#fff" : "#1a1510",
                  border: msg.role === "assistant" ? "1px solid #e8e2d9" : "none",
                  boxShadow: msg.role === "user" ? "0 3px 12px rgba(4,120,87,0.25)" : "0 1px 4px rgba(0,0,0,0.04)",
                  fontSize: "0.82rem", lineHeight: 1.6,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {msg.content}
                </div>
                {msg.role === "assistant" && onInsertIntoEditor && msg.content.trim() && (
                  <button
                    type="button"
                    onClick={() => onInsertIntoEditor(msg.content)}
                    style={{
                      alignSelf: "flex-end",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "#047857",
                      background: "transparent",
                      border: "1px solid #047857",
                      borderRadius: "6px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                    title="Insert this reply into the script at cursor (or at end)"
                  >
                    Insert into script
                  </button>
                )}
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
                        width: "7px", height: "7px", borderRadius: "50%", background: "#047857",
                        animation: `typingWave 1.4s ease-in-out ${i * 0.2}s infinite`,
                        opacity: 0.6,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
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
                placeholder="Ask about your project or paste text to Fact Check…"
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
                  <option>Fact Check</option>
                </select>
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    border: "none", background: input.trim() ? "#047857" : "#e8e2d9",
                    color: "#fff", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 2: HISTORY (localStorage)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#9e9589" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🕐</div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510", marginBottom: "0.4rem" }}>No conversations yet</p>
              <p style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>Your past chats will appear here so you can revisit them anytime.</p>
            </div>
          ) : (
            history.map(session => (
              <div
                key={session.id}
                onClick={() => restoreChat(session)}
                style={{
                  padding: "0.75rem",
                  background: activeChatId === session.id ? "rgba(4,120,87,0.06)" : "#fff",
                  borderRadius: "10px",
                  border: activeChatId === session.id ? "1px solid rgba(4,120,87,0.3)" : "1px solid #e8e2d9",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => { if (activeChatId !== session.id) e.currentTarget.style.borderColor = "#047857"; }}
                onMouseLeave={e => { if (activeChatId !== session.id) e.currentTarget.style.borderColor = "#e8e2d9"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#1a1510", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session.firstMessage}
                  </span>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteHistoryEntry(session.id); }}
                    style={{ ...tabIconBtn, width: "20px", height: "20px", fontSize: "0.7rem", color: "#b8b0a4", flexShrink: 0 }}
                    title="Delete conversation"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.7rem", color: "#9e9589" }}>
                  <span>{session.messageCount} messages</span>
                  <span>{new Date(session.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 3: ISSUES (Contradictions)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "issues" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              All issues
            </span>
            <button
              onClick={() => onRefreshContradictions()}
              style={{ ...tabIconBtn, fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
              title="Refresh list"
            >
              Refresh
            </button>
          </div>
          {!scriptId ? (
            <p style={{ fontSize: "0.8rem", color: "#9e9589", fontStyle: "italic" }}>Open a document to see issues.</p>
          ) : contradictions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#9e9589" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
              <p style={{ fontSize: "0.83rem", fontWeight: 500, color: "#1a1510", marginBottom: "0.3rem" }}>No issues found</p>
              <p style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>Your story is consistent. Issues will appear here when the analysis detects contradictions.</p>
            </div>
          ) : (
            contradictions.map((c) => (
              <div
                key={c._id}
                style={{
                  padding: "0.75rem",
                  background: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #e8e2d9",
                  borderLeft: "3px solid #c9a227",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "0.65rem", fontWeight: 700,
                    padding: "0.2rem 0.5rem", borderRadius: "4px",
                    background: "#fff3cd", color: "#856404",
                    textTransform: "uppercase", letterSpacing: "0.03em",
                  }}>
                    Contradiction
                  </span>
                </div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9e9589", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Flagged
                </p>
                <p style={{ fontSize: "0.8rem", color: "#1a1510", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                  {c.sentence || "—"}
                </p>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9e9589", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Why
                </p>
                <div style={{
                  padding: "0.5rem 0.6rem",
                  background: "#fef9f0", borderRadius: "8px",
                  border: "1px solid #f0ebe3", marginBottom: "0.5rem",
                }}>
                  {c.reason_tag && (
                    <p style={{ fontSize: "0.78rem", color: "#856404", fontWeight: 600, marginBottom: "0.25rem" }}>
                      {c.reason_tag}
                    </p>
                  )}
                  {c.conflict_with && (
                    <p style={{ fontSize: "0.78rem", color: "#1a1510", lineHeight: 1.5 }}>
                      Conflicts with: {c.conflict_with}
                    </p>
                  )}
                  {!c.reason_tag && !c.conflict_with && (
                    <p style={{ fontSize: "0.78rem", color: "#9e9589", fontStyle: "italic" }}>No detail provided.</p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    setResolvingId(c._id);
                    try { await onResolveContradiction(c._id); } finally { setResolvingId(null); }
                  }}
                  disabled={resolvingId === c._id}
                  style={{
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.75rem", fontWeight: 600,
                    border: "none", borderRadius: "6px",
                    background: resolvingId === c._id ? "#e8e2d9" : "#047857",
                    color: "#fff",
                    cursor: resolvingId === c._id ? "default" : "pointer",
                  }}
                >
                  {resolvingId === c._id ? "Resolving…" : "Resolve"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB 4: SUGGESTIONS (auto-suggest from KG)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "suggestions" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Continuity suggestions
            </span>
            {suggestions.length > 0 && (
              <button
                onClick={onClearSuggestions}
                style={{ ...tabIconBtn, fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                title="Clear suggestions"
              >
                Clear
              </button>
            )}
          </div>

          {suggestions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#9e9589" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💡</div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510", marginBottom: "0.3rem" }}>No suggestions yet</p>
              <p style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>Suggestions will appear after your first AI interaction — the system scans your writing against the Story Bible for continuity opportunities.</p>
            </div>
          ) : (
            suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "0.75rem",
                  background: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #e8e2d9",
                  borderLeft: "3px solid #047857",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  cursor: onInsertIntoEditor ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
                onClick={() => onInsertIntoEditor?.(s)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#047857"; e.currentTarget.style.background = "#f0fdf4"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.background = "#fff"; }}
              >
                <p style={{ fontSize: "0.82rem", color: "#1a1510", lineHeight: 1.55 }}>{s}</p>
                {onInsertIntoEditor && (
                  <span style={{ fontSize: "0.68rem", color: "#047857", marginTop: "0.3rem", display: "inline-block" }}>
                    ↗ Tap to insert into script
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes typingWave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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