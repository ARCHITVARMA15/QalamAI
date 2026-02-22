"use client";

import { useState, useEffect } from "react";
import { PersonaNode, KnowledgeGraphData } from "@/lib/insightApi";

const CHAR_COLORS = [
  { bg: "#fde8d8", border: "#c96a3b", text: "#7a3a18", accent: "#c96a3b", avatar: "#f5c9a8", glow: "rgba(201,106,59,0.2)" },
  { bg: "#dceeff", border: "#3b82c9", text: "#18407a", accent: "#3b82c9", avatar: "#a8cef5", glow: "rgba(59,130,201,0.2)" },
  { bg: "#e8f5e9", border: "#3bc96a", text: "#187a3a", accent: "#3bc96a", avatar: "#a8f5c0", glow: "rgba(59,201,106,0.2)" },
  { bg: "#f3e8ff", border: "#9c3bc9", text: "#5a187a", accent: "#9c3bc9", avatar: "#d4a8f5", glow: "rgba(156,59,201,0.2)" },
  { bg: "#fff3cd", border: "#c9a83b", text: "#7a5a18", accent: "#c9a83b", avatar: "#f5dfa8", glow: "rgba(201,168,59,0.2)" },
  { bg: "#fce4ec", border: "#c93b6a", text: "#7a1840", accent: "#c93b6a", avatar: "#f5a8c0", glow: "rgba(201,59,106,0.2)" },
  { bg: "#e0f2f1", border: "#26a69a", text: "#004d40", accent: "#26a69a", avatar: "#80cbc4", glow: "rgba(38,166,154,0.2)" },
  { bg: "#e8eaf6", border: "#5c6bc0", text: "#1a237e", accent: "#5c6bc0", avatar: "#9fa8da", glow: "rgba(92,107,192,0.2)" },
];

// Character avatars based on mention count and position
const CHARACTER_EMOJIS = [
  "👑", "⚔️", "💃", "🎭", "🌹", "🦁", "🌟", "🗡️",
  "📖", "💎", "🏰", "🎪", "🌙", "🔮", "🦅", "🎵",
  "🌸", "🕯️", "🎩", "💫", "🪶", "🏹", "🌿", "🔥",
];

function getCharEmoji(idx: number, mentions: number): string {
  if (mentions > 100) return "👑";
  if (mentions > 50) return "⭐";
  return CHARACTER_EMOJIS[idx % CHARACTER_EMOJIS.length];
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

// Get relationships for a character from graph data
function getRelationships(personaId: string, graphData: KnowledgeGraphData | null): { target: string; relation: string }[] {
  if (!graphData) return [];
  const rels: { target: string; relation: string }[] = [];
  const seen = new Set<string>();

  for (const link of graphData.links) {
    const source = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
    const target = typeof link.target === 'string' ? link.target : (link.target as any)?.id;

    if (source === personaId && !seen.has(target)) {
      seen.add(target);
      rels.push({ target, relation: link.relation || "connected to" });
    } else if (target === personaId && !seen.has(source)) {
      seen.add(source);
      rels.push({ target: source, relation: link.relation || "connected to" });
    }
  }

  return rels.slice(0, 6);
}

interface Props {
  personas: PersonaNode[];
  graphData?: KnowledgeGraphData | null;
  highlightedId?: string | null;
  onCardClick?: (id: string) => void;
}

export default function PersonaCards({ personas, graphData, highlightedId, onCardClick }: Props) {
  const [expandedPersona, setExpandedPersona] = useState<PersonaNode | null>(null);
  const [expandedColorIdx, setExpandedColorIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleExpand = (persona: PersonaNode, idx: number) => {
    setExpandedPersona(persona);
    setExpandedColorIdx(idx % CHAR_COLORS.length);
  };

  const handleClose = () => setExpandedPersona(null);

  // Sort: most mentioned first
  const sortedPersonas = [...personas].sort((a, b) => b.mentions - a.mentions);

  // Auto-scroll to highlighted card when a graph node is clicked
  useEffect(() => {
    if (highlightedId) {
      const el = document.getElementById(`persona-card-${highlightedId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [highlightedId]);

  return (
    <>
      {/* Cards list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {sortedPersonas.map((persona, idx) => {
          const col = CHAR_COLORS[idx % CHAR_COLORS.length];
          const isHighlighted = highlightedId === persona.id;
          const isHovered = hoveredIdx === idx;
          const emoji = getCharEmoji(idx, persona.mentions);
          const rels = getRelationships(persona.id, graphData || null);

          return (
            <div
              id={`persona-card-${persona.id}`}
              key={persona.id}
              onClick={() => { onCardClick?.(persona.id); }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: isHighlighted ? `linear-gradient(135deg, ${col.bg}, #fff)` : "#fff",
                border: isHighlighted ? `2px solid ${col.border}` : "1.5px solid #e8e2d9",
                borderRadius: "16px",
                padding: "1rem 1.1rem",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.34,1.2,0.64,1)",
                transform: isHighlighted ? "translateX(4px) scale(1.01)" : isHovered ? "translateX(2px)" : "translateX(0)",
                boxShadow: isHighlighted
                  ? `0 6px 24px ${col.glow}, 0 0 0 1px ${col.border}40`
                  : isHovered ? `0 4px 16px rgba(0,0,0,0.08)` : "0 1px 6px rgba(0,0,0,0.04)",
                animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, bottom: 0, width: "4px",
                background: `linear-gradient(180deg, ${col.border}, ${col.avatar})`,
                borderRadius: "16px 0 0 16px",
              }} />

              <div style={{ paddingLeft: "0.6rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Avatar with emoji */}
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${col.avatar}, ${col.bg})`,
                  border: `2.5px solid ${col.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem",
                  boxShadow: isHighlighted ? `0 0 16px ${col.glow}` : "none",
                  transition: "all 0.2s",
                }}>
                  {emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510", fontWeight: 400 }}>
                      {persona.id}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.68rem", padding: "0.12rem 0.5rem",
                      borderRadius: "20px", background: col.border, color: "#fff",
                      fontWeight: 600,
                    }}>
                      {persona.mentions} mention{persona.mentions !== 1 ? "s" : ""}
                    </span>
                    {persona.traits.length > 0 && (
                      <span style={{
                        fontSize: "0.68rem", padding: "0.12rem 0.5rem",
                        borderRadius: "20px", background: col.bg, color: col.text,
                        fontWeight: 500,
                      }}>
                        {persona.traits.length} trait{persona.traits.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {rels.length > 0 && (
                      <span style={{
                        fontSize: "0.68rem", padding: "0.12rem 0.5rem",
                        borderRadius: "20px", background: "#f0ebe3", color: "#6a6560",
                        fontWeight: 500,
                      }}>
                        🔗 {rels.length} link{rels.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpand(persona, idx); }}
                  style={{
                    width: "32px", height: "32px", borderRadius: "10px",
                    border: `1.5px solid ${col.border}`, background: col.bg,
                    color: col.text, cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.85rem", transition: "all 0.15s",
                  }}
                  title="Expand character"
                >
                  ⤢
                </button>
              </div>

              {/* Traits preview */}
              {persona.traits.length > 0 && (
                <div style={{ paddingLeft: "0.6rem", marginTop: "0.55rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {persona.traits.slice(0, 4).map((trait, ti) => (
                    <span key={ti} style={{
                      fontSize: "0.63rem", padding: "0.12rem 0.45rem",
                      borderRadius: "20px", background: "#faf7f4",
                      color: "#6a6560", border: "1px solid #e8e2d9",
                      letterSpacing: "0.01em",
                    }}>
                      {trait.attribute}
                    </span>
                  ))}
                  {persona.traits.length > 4 && (
                    <span style={{
                      fontSize: "0.63rem", padding: "0.12rem 0.45rem",
                      color: "#9e9589",
                    }}>
                      +{persona.traits.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Relationships preview */}
              {rels.length > 0 && (
                <div style={{ paddingLeft: "0.6rem", marginTop: "0.45rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {rels.slice(0, 3).map((rel, ri) => (
                    <span key={ri} style={{
                      fontSize: "0.6rem", padding: "0.1rem 0.4rem",
                      borderRadius: "20px",
                      background: `linear-gradient(135deg, ${col.bg}80, #faf7f4)`,
                      color: col.text,
                      border: `1px solid ${col.border}30`,
                    }}>
                      → {rel.target}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {personas.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9e9589" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>👥</div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#4a4540", marginBottom: "0.3rem" }}>No personas yet</p>
            <p style={{ fontSize: "0.78rem" }}>Click &quot;Analyze&quot; to extract characters from your story.</p>
          </div>
        )}
      </div>

      {/* ── Expanded Modal ── */}
      {expandedPersona && (() => {
        const col = CHAR_COLORS[expandedColorIdx];
        const emoji = getCharEmoji(expandedColorIdx, expandedPersona.mentions);
        const rels = getRelationships(expandedPersona.id, graphData || null);

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
                borderRadius: "24px",
                width: "100%", maxWidth: "560px",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: `0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px ${col.border}30`,
                animation: "modalIn 0.25s cubic-bezier(0.34,1.4,0.64,1) both",
              }}
            >
              {/* Header */}
              <div style={{
                background: `linear-gradient(135deg, ${col.bg}, #faf7f4)`,
                padding: "2rem 2rem 1.5rem",
                position: "relative",
                borderBottom: `1px solid ${col.border}20`,
                borderRadius: "24px 24px 0 0",
              }}>
                <button
                  onClick={handleClose}
                  style={{
                    position: "absolute", top: "1rem", right: "1rem",
                    width: "32px", height: "32px", borderRadius: "10px",
                    border: "1.5px solid #e8e2d9", background: "#fff",
                    cursor: "pointer", color: "#9e9589", fontSize: "0.85rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  ✕
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  {/* Large avatar */}
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    background: `linear-gradient(135deg, ${col.avatar}, ${col.bg})`,
                    border: `3px solid ${col.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2rem",
                    boxShadow: `0 6px 24px ${col.glow}`,
                  }}>
                    {emoji}
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: "1.7rem", color: "#1a1510",
                      letterSpacing: "-0.02em", marginBottom: "0.3rem",
                    }}>
                      {expandedPersona.id}
                    </h2>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.72rem", padding: "0.2rem 0.65rem",
                        borderRadius: "20px", background: col.border, color: "#fff", fontWeight: 600,
                      }}>
                        📊 {expandedPersona.mentions} mentions
                      </span>
                      <span style={{
                        fontSize: "0.72rem", padding: "0.2rem 0.65rem",
                        borderRadius: "20px", background: "#fff",
                        color: col.text, border: `1px solid ${col.border}40`,
                        fontWeight: 500,
                      }}>
                        🎭 {expandedPersona.traits.length} traits
                      </span>
                      {rels.length > 0 && (
                        <span style={{
                          fontSize: "0.72rem", padding: "0.2rem 0.65rem",
                          borderRadius: "20px", background: "#fff",
                          color: "#6a6560", border: "1px solid #e8e2d9",
                          fontWeight: 500,
                        }}>
                          🔗 {rels.length} relationships
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "1.5rem 2rem 2rem" }}>
                {/* Traits Section */}
                {expandedPersona.traits.length > 0 && (
                  <>
                    <p style={{
                      fontSize: "0.7rem", fontWeight: 700, color: "#9e9589",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      marginBottom: "0.75rem",
                    }}>
                      🎭 Character Traits
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {expandedPersona.traits.map((trait, i) => (
                        <div key={i} style={{
                          display: "flex", gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          background: "#fff", borderRadius: "12px",
                          border: "1px solid #e8e2d9",
                          animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                          transition: "all 0.15s",
                        }}>
                          <div style={{
                            width: "72px", flexShrink: 0,
                            fontSize: "0.7rem", fontWeight: 700,
                            color: col.text, textTransform: "uppercase",
                            letterSpacing: "0.04em", paddingTop: "2px",
                          }}>
                            {trait.attribute}
                          </div>
                          <div style={{
                            fontSize: "0.8rem", color: "#4a4540",
                            lineHeight: 1.6, flex: 1,
                          }}>
                            {trait.evidence.length > 150 ? trait.evidence.slice(0, 150) + "…" : trait.evidence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Relationships Section */}
                {rels.length > 0 && (
                  <>
                    <p style={{
                      fontSize: "0.7rem", fontWeight: 700, color: "#9e9589",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      marginBottom: "0.75rem",
                    }}>
                      🔗 Relationships
                    </p>
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: "0.4rem", marginBottom: "1.5rem",
                    }}>
                      {rels.map((rel, ri) => (
                        <div key={ri} style={{
                          padding: "0.6rem 0.75rem",
                          background: `linear-gradient(135deg, ${col.bg}60, #fff)`,
                          borderRadius: "10px",
                          border: `1px solid ${col.border}20`,
                          animation: `fadeUp 0.3s ease ${ri * 0.05}s both`,
                        }}>
                          <div style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "0.85rem", color: "#1a1510",
                            marginBottom: "0.15rem",
                          }}>
                            {rel.target}
                          </div>
                          <div style={{
                            fontSize: "0.65rem", color: col.accent,
                            fontWeight: 500, textTransform: "lowercase",
                          }}>
                            {rel.relation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Prominence meter */}
                <p style={{
                  fontSize: "0.7rem", fontWeight: 700, color: "#9e9589",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  marginBottom: "0.5rem",
                }}>
                  📊 Story Prominence
                </p>
                <div style={{
                  background: "#f0ebe3", borderRadius: "8px",
                  height: "8px", overflow: "hidden", marginBottom: "0.3rem",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, (expandedPersona.mentions / (sortedPersonas[0]?.mentions || 1)) * 100)}%`,
                    background: `linear-gradient(90deg, ${col.border}, ${col.accent})`,
                    borderRadius: "8px",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <p style={{ fontSize: "0.68rem", color: "#9e9589", marginBottom: "1.25rem" }}>
                  Mentioned {expandedPersona.mentions} time{expandedPersona.mentions !== 1 ? "s" : ""} in the story
                </p>

                <button
                  onClick={handleClose}
                  style={{
                    width: "100%",
                    padding: "0.7rem", borderRadius: "12px",
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
