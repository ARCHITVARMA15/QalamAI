"use client";

import { useState } from "react";

interface Props {
  wordCount: number;
  isSaved: boolean;
  onFormat: (command: string, value?: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSearch: () => void;
}

function EditorToolbar({ wordCount, isSaved, onFormat, onUndo, onRedo, onSearch }: Props) {
  const [fontSize, setFontSize] = useState("16");
  const [showFontMenu, setShowFontMenu] = useState(false);

  const formatBtn = (command: string, value?: string) => () => onFormat(command, value);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1rem", height: "44px",
      background: "#fef6ee", borderTop: "1px solid #e8e2d9",
      gap: "0.25rem", flexShrink: 0,
    }}>
      {/* Left: formatting tools */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.1rem" }}>
        {/* Undo/Redo */}
        <ToolBtn onClick={onUndo} title="Undo (⌘Z)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" /></svg>
        </ToolBtn>
        <ToolBtn onClick={onRedo} title="Redo (⌘⇧Z)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" /></svg>
        </ToolBtn>

        <Divider />

        {/* Text formatting */}
        <ToolBtn onClick={formatBtn("bold")} title="Bold (⌘B)"><b style={{ fontSize: "0.85rem" }}>B</b></ToolBtn>
        <ToolBtn onClick={formatBtn("italic")} title="Italic (⌘I)"><i style={{ fontSize: "0.85rem" }}>I</i></ToolBtn>
        <ToolBtn onClick={formatBtn("underline")} title="Underline (⌘U)"><u style={{ fontSize: "0.85rem" }}>U</u></ToolBtn>
        <ToolBtn onClick={formatBtn("strikeThrough")} title="Strikethrough">
          <span style={{ textDecoration: "line-through", fontSize: "0.82rem" }}>S</span>
        </ToolBtn>

        <Divider />

        {/* Highlight */}
        <ToolBtn onClick={formatBtn("hiliteColor", "#fff3cd")} title="Highlight">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </ToolBtn>

        <Divider />

        {/* Font size */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            style={{
              display: "flex", alignItems: "center", gap: "0.3rem",
              padding: "0.25rem 0.5rem", borderRadius: "6px",
              border: "none", background: "transparent",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem",
              color: "#4a4540", cursor: "pointer",
            }}
          >
            Aa
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
          </button>
          {showFontMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 20,
              background: "#fff", border: "1px solid #e8e2d9", borderRadius: "10px",
              padding: "0.35rem", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: "100px",
            }}>
              {["12", "14", "16", "18", "20", "24"].map(size => (
                <button key={size} onClick={() => { onFormat("fontSize", size === "12" ? "1" : size === "14" ? "2" : size === "16" ? "3" : size === "18" ? "4" : size === "20" ? "5" : "6"); setFontSize(size); setShowFontMenu(false); }}
                  style={{
                    display: "block", width: "100%", padding: "0.35rem 0.6rem",
                    borderRadius: "6px", border: "none",
                    background: fontSize === size ? "#f5f1eb" : "transparent",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
                    color: "#1a1510", cursor: "pointer", textAlign: "left",
                  }}
                >
                  {size}px
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Headings */}
        <ToolBtn onClick={formatBtn("formatBlock", "h1")} title="Heading 1">H1</ToolBtn>
        <ToolBtn onClick={formatBtn("formatBlock", "h2")} title="Heading 2">H2</ToolBtn>
        <ToolBtn onClick={formatBtn("formatBlock", "h3")} title="Heading 3">H3</ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={formatBtn("insertUnorderedList")} title="Bullet List">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" />
          </svg>
        </ToolBtn>
        <ToolBtn onClick={formatBtn("insertOrderedList")} title="Numbered List">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <text x="1" y="8" style={{ fontSize: "8px" }} fill="currentColor" stroke="none">1.</text>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Clear format */}
        <ToolBtn onClick={formatBtn("removeFormat")} title="Clear Formatting">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /><circle cx="18" cy="18" r="3" />
          </svg>
        </ToolBtn>

        <Divider />

        {/* Search */}
        <ToolBtn onClick={onSearch} title="Search in Document (⌘F)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </ToolBtn>
      </div>

      {/* Right: word count + save status */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
        <span style={{ fontSize: "0.78rem", color: "#9e9589" }}>
          Words: {wordCount.toLocaleString()}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: isSaved ? "#27ae60" : "#9e9589" }}>
          {isSaved ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>
              Saved
            </>
          ) : (
            <>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "2px solid #9e9589", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              Saving…
            </>
          )}
        </div>
      </div>

      {/* Close font menu on outside click */}
      {showFontMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowFontMenu(false)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "32px", height: "32px", borderRadius: "50%",
        border: "none", background: h ? "rgba(4,120,87,0.1)" : "transparent",
        cursor: "pointer", color: h ? "#047857" : "#4a4540",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s ease", flexShrink: 0,
        transform: h ? "scale(1.1)" : "scale(1)",
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: "1px", height: "18px", background: "#e8e2d9", margin: "0 0.15rem", flexShrink: 0 }} />;
}

export default EditorToolbar;