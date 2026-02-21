"use client";

import { useState } from "react";

interface Props {
  onAction: (action: string, options?: { tone?: string; instructions?: string }) => void;
  loading: boolean;
  hasSelection: boolean;
}

const TONES = ["Dramatic", "Casual", "Formal", "Poetic", "Terse", "Whimsical"];
function AIActionBar({ onAction, loading, hasSelection }: Props) {
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryActions = [
    { id: "rewrite", label: "Rewrite", icon: "🔄", desc: "Rewrite selection", requiresSelection: true },
    { id: "describe", label: "Describe", icon: "🎨", desc: "Add description", requiresSelection: false },
    { id: "brainstorm", label: "Brainstorm", icon: "💡", desc: "Generate ideas", requiresSelection: false },
    { id: "comic", label: "Comic", icon: "🖼️", desc: "Generate comic from selection", requiresSelection: true },
  ];

  const moreActions = [
    { id: "enhance", label: "Enhance", icon: "✨" },
    { id: "shorten", label: "Shorten", icon: "✂️" },
    { id: "expand", label: "Expand", icon: "📖" },
    { id: "summarize", label: "Summarize", icon: "📋" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      padding: "0.6rem 1rem",
      margin: "0.75rem 1rem 0",
      background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(232,226,217,0.6)",
      borderRadius: "14px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      flexWrap: "wrap",
    }}>
      {primaryActions.map(action => (
        <ActionButton
          key={action.id}
          label={action.label}
          icon={action.icon}
          onClick={() => onAction(action.id)}
          disabled={loading || (action.requiresSelection && !hasSelection)}
          loading={loading}
          tooltip={action.requiresSelection && !hasSelection ? "Select text first" : action.desc}
        />
      ))}

      <div style={{ width: "1px", height: "24px", background: "#e8e2d9", margin: "0 0.25rem" }} />

      {/* Tone button */}
      <div style={{ position: "relative" }}>
        <ActionButton
          label="Tone"
          icon="🎭"
          onClick={() => { setShowToneMenu(!showToneMenu); setShowMoreMenu(false); }}
          disabled={loading}
          loading={false}
          active={showToneMenu}
          tooltip="Change tone"
        />
        {showToneMenu && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0,
            background: "#fff", border: "1px solid #e8e2d9",
            borderRadius: "12px", padding: "0.4rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20,
            minWidth: "150px", animation: "fadeUp 0.15s ease both",
          }}>
            <p style={{ fontSize: "0.68rem", color: "#9e9589", fontWeight: 600, padding: "0.25rem 0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select tone
            </p>
            {TONES.map(tone => (
              <button
                key={tone}
                onClick={() => { onAction("tone", { tone: tone.toLowerCase() }); setShowToneMenu(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "0.45rem 0.6rem", borderRadius: "8px",
                  border: "none", background: "transparent",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
                  color: "#1a1510", cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f1eb")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {tone}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* More Tools button */}
      <div style={{ position: "relative" }}>
        <ActionButton
          label="More Tools"
          icon="⚡"
          onClick={() => { setShowMoreMenu(!showMoreMenu); setShowToneMenu(false); }}
          disabled={loading}
          loading={false}
          active={showMoreMenu}
          tooltip="More AI tools"
        />
        {showMoreMenu && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0,
            background: "#fff", border: "1px solid #e8e2d9",
            borderRadius: "12px", padding: "0.4rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20,
            minWidth: "160px", animation: "fadeUp 0.15s ease both",
          }}>
            {moreActions.map(a => (
              <button
                key={a.id}
                onClick={() => { onAction(a.id); setShowMoreMenu(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  width: "100%", padding: "0.45rem 0.6rem", borderRadius: "8px",
                  border: "none", background: "transparent",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
                  color: "#1a1510", cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f1eb")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showToneMenu || showMoreMenu) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10 }}
          onClick={() => { setShowToneMenu(false); setShowMoreMenu(false); }}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ActionButton({
  label, icon, onClick, disabled, loading, active, tooltip,
}: {
  label: string; icon: string; onClick: () => void;
  disabled?: boolean; loading?: boolean; active?: boolean; tooltip?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.45rem 0.9rem", borderRadius: "8px",
          border: active ? "1.5px solid #047857" : "1.5px solid #e8e2d9",
          background: active ? "rgba(4,120,87,0.06)" : hovered && !disabled ? "#f5f1eb" : "#fff",
          color: disabled ? "#b8b0a4" : active ? "#047857" : "#1a1510",
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s", opacity: loading ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>{icon}</span>
        {label}
        {label === "Tone" || label === "More Tools" ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points={active ? "18,15 12,9 6,15" : "6,9 12,15 18,9"} />
          </svg>
        ) : null}
      </button>
      {tooltip && hovered && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1510", color: "#fff",
          padding: "0.25rem 0.6rem", borderRadius: "6px",
          fontSize: "0.7rem", whiteSpace: "nowrap", pointerEvents: "none",
          zIndex: 30,
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default AIActionBar;