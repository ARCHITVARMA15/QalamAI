"use client";

import { useState } from "react";
import { PersonaNode } from "@/lib/insightApi";

const CHAR_COLORS = [
  { bg: "#fde8d8", border: "#c96a3b", text: "#7a3a18", accent: "#c96a3b", avatar: "#f5c9a8" },
  { bg: "#dceeff", border: "#3b82c9", text: "#18407a", accent: "#3b82c9", avatar: "#a8cef5" },
  { bg: "#e8f5e9", border: "#3bc96a", text: "#187a3a", accent: "#3bc96a", avatar: "#a8f5c0" },
  { bg: "#f3e8ff", border: "#9c3bc9", text: "#5a187a", accent: "#9c3bc9", avatar: "#d4a8f5" },
  { bg: "#fff3cd", border: "#c9a83b", text: "#7a5a18", accent: "#c9a83b", avatar: "#f5dfa8" },
  { bg: "#fce4ec", border: "#c93b6a", text: "#7a1840", accent: "#c93b6a", avatar: "#f5a8c0" },
];

const ROLE_ICONS: Record<string, string> = {
  "Primary protagonist": "🌟",
  "Antagonist": "⚔️",
  "Supporting": "🤝",
  "Default": "👤",
};

function getRoleIcon(evidence: string): string {
  const key = Object.keys(ROLE_ICONS).find((k) => evidence.includes(k));
  return key ? ROLE_ICONS[key] : ROLE_ICONS.Default;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

interface Props {
  personas: PersonaNode[];
  highlightedId?: string | null;
  onCardClick?: (id: string) => void;
}

export default function PersonaCards({ personas, highlightedId, onCardClick }: Props) {
  const [expandedPersona, setExpandedPersona] = useState<PersonaNode | null>(null);
  const [expandedColorIdx, setExpandedColorIdx] = useState(0);

  const handleExpand = (persona: PersonaNode, idx: number) => {
    setExpandedPersona(persona);
    setExpandedColorIdx(idx % CHAR_COLORS.length);
  };

  const handleClose = () => setExpandedPersona(null);

  return (
    <>
      {/* Cards grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {personas.map((persona, idx) => {
          const col = CHAR_COLORS[idx % CHAR_COLORS.length];
          const isHighlighted = highlightedId === persona.id;
          const roleTrait = persona.traits.find((t) => t.attribute === "Role");
          const roleIcon = roleTrait ? getRoleIcon(roleTrait.evidence) : "👤";

          return (
            <div
              key={persona.id}
              onClick={() => { onCardClick?.(persona.id); }}
              style={{
                background: "#fff",
                border: isHighlighted ? `2px solid ${col.border}` : "1.5px solid #e8e2d9",
                borderRadius: "14px",
                padding: "1rem 1.1rem",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34,1.2,0.64,1)",
                transform: isHighlighted ? "translateX(4px)" : "translateX(0)",
                boxShadow: isHighlighted ? `0 4px 20px ${col.border}25` : "0 1px 6px rgba(0,0,0,0.06)",
                animation: `fadeUp 0.35s ease ${idx * 0.07}s both`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Accent bar */}
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "4px", background: col.border, borderRadius: "14px 0 0 14px" }} />

              <div style={{ paddingLeft: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Avatar */}
                <div style={{
                  width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${col.avatar}, ${col.bg})`,
                  border: `2px solid ${col.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 700, color: col.text,
                  fontFamily: "'DM Serif Display', serif",
                }}>
                  {getInitials(persona.id)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510", fontWeight: 400 }}>
                      {persona.id}
                    </span>
                    <span style={{ fontSize: "0.85rem" }}>{roleIcon}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: "20px", background: col.bg, color: col.text, fontWeight: 600 }}>
                      {persona.mentions} mentions
                    </span>
                    {roleTrait && (
                      <span style={{ fontSize: "0.7rem", color: "#9e9589", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {roleTrait.evidence.split(".")[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpand(persona, idx); }}
                  style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    border: `1.5px solid ${col.border}`, background: col.bg,
                    color: col.text, cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", transition: "all 0.15s",
                  }}
                  title="Expand character"
                >
                  ⤢
                </button>
              </div>

              {/* Traits preview */}
              <div style={{ paddingLeft: "0.5rem", marginTop: "0.6rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {persona.traits.slice(0, 3).map((trait, ti) => (
                  <span key={ti} style={{
                    fontSize: "0.65rem", padding: "0.15rem 0.5rem",
                    borderRadius: "20px", background: "#faf7f4",
                    color: "#6a6560", border: "1px solid #e8e2d9",
                  }}>
                    {trait.attribute}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {personas.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9e9589" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>👥</div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#4a4540", marginBottom: "0.3rem" }}>No personas yet</p>
            <p style={{ fontSize: "0.78rem" }}>Click "Analyze" to extract characters from your story.</p>
          </div>
        )}
      </div>

      {/* ── Expanded Modal ── */}
      {expandedPersona && (() => {
        const col = CHAR_COLORS[expandedColorIdx];
        const roleTrait = expandedPersona.traits.find((t) => t.attribute === "Role");
        const roleIcon = roleTrait ? getRoleIcon(roleTrait.evidence) : "👤";
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(10,9,8,0.75)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1.5rem",
              animation: "fadeIn 0.2s ease both",
            }}
            onClick={handleClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#faf7f4",
                borderRadius: "20px",
                width: "100%", maxWidth: "520px",
                boxShadow: `0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px ${col.border}30`,
                overflow: "hidden",
                animation: "modalIn 0.25s cubic-bezier(0.34,1.4,0.64,1) both",
              }}
            >
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${col.bg}, #faf7f4)`, padding: "1.75rem 1.75rem 1.25rem", position: "relative", borderBottom: `1px solid ${col.border}20` }}>
                <button
                  onClick={handleClose}
                  style={{
                    position: "absolute", top: "1rem", right: "1rem",
                    width: "30px", height: "30px", borderRadius: "8px",
                    border: "1.5px solid #e8e2d9", background: "#fff",
                    cursor: "pointer", color: "#9e9589", fontSize: "0.85rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ✕
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: `linear-gradient(135deg, ${col.avatar}, ${col.bg})`,
                    border: `3px solid ${col.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.4rem", fontWeight: 700, color: col.text,
                    fontFamily: "'DM Serif Display', serif",
                    // boxShadow: `0 4px 20px ${col.glow || col.border}40`,
                  }}>
                    {getInitials(expandedPersona.id)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.6rem", color: "#1a1510", letterSpacing: "-0.02em" }}>
                        {expandedPersona.id}
                      </h2>
                      <span style={{ fontSize: "1.2rem" }}>{roleIcon}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                      <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.65rem", borderRadius: "20px", background: col.border, color: "#fff", fontWeight: 600 }}>
                        {expandedPersona.mentions} mentions
                      </span>
                      <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.65rem", borderRadius: "20px", background: "#fff", color: "#9e9589", border: "1px solid #e8e2d9" }}>
                        Character
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traits */}
              <div style={{ padding: "1.25rem 1.75rem 1.75rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.85rem" }}>
                  Character Analysis
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {expandedPersona.traits.map((trait, i) => (
                    <div key={i} style={{
                      display: "flex", gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      background: "#fff", borderRadius: "10px",
                      border: "1px solid #e8e2d9",
                      animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
                    }}>
                      <div style={{
                        width: "80px", flexShrink: 0,
                        fontSize: "0.68rem", fontWeight: 700,
                        color: col.text, textTransform: "uppercase",
                        letterSpacing: "0.04em", paddingTop: "1px",
                      }}>
                        {trait.attribute}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#4a4540", lineHeight: 1.55 }}>
                        {trait.evidence}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleClose}
                  style={{
                    marginTop: "1.25rem", width: "100%",
                    padding: "0.65rem", borderRadius: "10px",
                    border: "none", background: "#1a1510",
                    color: "#fff", fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem", fontWeight: 500,
                    cursor: "pointer", transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = col.border)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1510")}
                >
                  ← Back to Characters
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.92) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}

// Add glow to color map
declare module "./PersonaCards" {}
