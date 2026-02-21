"use client";

import { useState } from "react";

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  active?: boolean;
}

interface Props {
  projectTitle: string;
  projectEmoji: string;
  onBack: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const defaultChapters: Chapter[] = [
  { id: "c1", title: "Untitled Document", wordCount: 0, active: true },
];

 function LeftSidebar({ projectTitle, projectEmoji, onBack, collapsed, onToggleCollapse }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>(defaultChapters);
  const [activeChapter, setActiveChapter] = useState("c1");
  const [storyBible, setStoryBible] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");

  const addChapter = () => {
    const title = newChapterName.trim() || `Chapter ${chapters.length + 1}`;
    const newChapter: Chapter = { id: `c${Date.now()}`, title, wordCount: 0 };
    setChapters([...chapters, newChapter]);
    setActiveChapter(newChapter.id);
    setAddingChapter(false);
    setNewChapterName("");
  };

  if (collapsed) {
    return (
      <aside style={{
        width: "48px", background: "#faf7f4",
        borderRight: "1px solid #e8e2d9",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1rem 0", gap: "1rem", flexShrink: 0,
      }}>
        <button onClick={onToggleCollapse} style={iconBtnStyle} title="Expand sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </aside>
    );
  }

  return (
    <aside style={{
      width: "260px", background: "#faf7f4",
      borderRight: "1px solid #e8e2d9",
      display: "flex", flexDirection: "column",
      flexShrink: 0, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "1rem", borderBottom: "1px solid #e8e2d9" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            background: "none", border: "none", cursor: "pointer",
            color: "#9e9589", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif",
            padding: "0.3rem 0", marginBottom: "0.75rem",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#1a1510")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9e9589")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
            <span style={{ fontSize: "1.2rem" }}>{projectEmoji}</span>
            <span style={{
              fontFamily: "'DM Serif Display', serif", fontSize: "1rem",
              color: "#1a1510", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {projectTitle}
            </span>
          </div>
          <button onClick={onToggleCollapse} style={iconBtnStyle} title="Collapse">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.5rem", borderBottom: "1px solid #e8e2d9" }}>
        <button
          onClick={() => setAddingChapter(true)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            padding: "0.45rem 0", borderRadius: "8px",
            background: "#1a1510", color: "#fff", border: "none",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: 500,
            cursor: "pointer", transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#c96a3b")}
          onMouseLeave={e => (e.currentTarget.style.background = "#1a1510")}
        >
          <span style={{ fontSize: "1rem" }}>+</span> New
        </button>
        <button style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
          padding: "0.45rem 0", borderRadius: "8px",
          background: "transparent", color: "#9e9589",
          border: "1px solid #e8e2d9",
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem",
          cursor: "pointer",
        }}>
          ↑ Import
        </button>
      </div>

      {/* Chapter list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {addingChapter && (
          <div style={{ padding: "0.5rem", marginBottom: "0.25rem" }}>
            <input
              autoFocus
              value={newChapterName}
              onChange={e => setNewChapterName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addChapter(); if (e.key === "Escape") setAddingChapter(false); }}
              onBlur={addChapter}
              placeholder="Chapter name…"
              style={{
                width: "100%", padding: "0.4rem 0.6rem",
                border: "1.5px solid #c96a3b", borderRadius: "6px",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
                background: "#fff", color: "#1a1510", outline: "none",
              }}
            />
          </div>
        )}
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChapter(ch.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 0.75rem", borderRadius: "8px", border: "none",
              background: activeChapter === ch.id ? "rgba(201,106,59,0.08)" : "transparent",
              color: activeChapter === ch.id ? "#c96a3b" : "#4a4540",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (activeChapter !== ch.id) e.currentTarget.style.background = "#f5f1eb"; }}
            onMouseLeave={e => { if (activeChapter !== ch.id) e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</span>
          </button>
        ))}
      </div>

      {/* Story Bible toggle */}
      <div style={{
        padding: "0.75rem 1rem", borderTop: "1px solid #e8e2d9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#4a4540" }}>
          <span>📚</span> Story Bible
        </div>
        <button
          onClick={() => setStoryBible(!storyBible)}
          style={{
            width: "38px", height: "22px", borderRadius: "11px", border: "none",
            background: storyBible ? "#c96a3b" : "#d4cdc5",
            cursor: "pointer", position: "relative", transition: "background 0.25s",
          }}
        >
          <span style={{
            position: "absolute", top: "2px",
            left: storyBible ? "18px" : "2px",
            width: "18px", height: "18px", borderRadius: "50%",
            background: "#fff", transition: "left 0.25s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      {/* Trash */}
      <button style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.75rem 1rem", borderTop: "1px solid #e8e2d9",
        background: "none", border: "none", cursor: "pointer",
        color: "#9e9589", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
        transition: "color 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#c0392b")}
        onMouseLeave={e => (e.currentTarget.style.color = "#9e9589")}
      >
        🗑️ Trash
      </button>
    </aside>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: "28px", height: "28px", borderRadius: "7px",
  border: "none", background: "transparent",
  cursor: "pointer", color: "#9e9589",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.15s",
  flexShrink: 0,
};

export default LeftSidebar;