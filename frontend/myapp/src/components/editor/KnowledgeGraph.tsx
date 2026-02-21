"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { KnowledgeGraphData, KGNode, KGLink, PositionedNode, fetchKnowledgeGraph } from "@/lib/knowledgeGraph";

// ─── Node type colors ─────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  PERSON:  { bg: "#fde8d8", border: "#c96a3b", text: "#7a3a18", glow: "rgba(201,106,59,0.3)" },
  GPE:     { bg: "#dceeff", border: "#3b82c9", text: "#18407a", glow: "rgba(59,130,201,0.3)" },
  ORG:     { bg: "#e8f5e9", border: "#3bc96a", text: "#187a3a", glow: "rgba(59,201,106,0.3)" },
  EVENT:   { bg: "#f3e8ff", border: "#9c3bc9", text: "#5a187a", glow: "rgba(156,59,201,0.3)" },
  DEFAULT: { bg: "#f5f1eb", border: "#9e9589", text: "#4a4540", glow: "rgba(158,149,137,0.3)" },
};

const getColor = (type: string) => NODE_COLORS[type] || NODE_COLORS.DEFAULT;

// ─── Simple force simulation (no D3 dependency) ───────────────────────────────
function useForceSimulation(nodes: KGNode[], links: KGLink[], width: number, height: number) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const frameRef = useRef<number>(0);
  const stateRef = useRef<Map<string, PositionedNode>>(new Map());

  useEffect(() => {
    if (!nodes.length || !width || !height) return;
    cancelAnimationFrame(frameRef.current);

    // Initialize positions in a circle
    const state = new Map<string, PositionedNode>();
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) * 0.32;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      const jitter = (Math.random() - 0.5) * 40;
      state.set(node.id, {
        ...node,
        x: cx + (radius + jitter) * Math.cos(angle),
        y: cy + (radius + jitter) * Math.sin(angle),
        vx: 0, vy: 0,
      });
    });
    stateRef.current = state;

    let tick = 0;
    const MAX_TICKS = 200;
    const REPULSION = 4000;
    const ATTRACTION = 0.04;
    const CENTER_FORCE = 0.008;
    const DAMPING = 0.82;
    const MIN_DIST = 80;

    const simulate = () => {
      if (tick++ > MAX_TICKS) return;
      const nodes = [...stateRef.current.values()];

      // Repulsion between all pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      // Attraction along links
      links.forEach(link => {
        const a = stateRef.current.get(typeof link.source === "string" ? link.source : (link.source as KGNode).id);
        const b = stateRef.current.get(typeof link.target === "string" ? link.target : (link.target as KGNode).id);
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const target = MIN_DIST + 60;
        const diff = (dist - target) * ATTRACTION;
        const fx = (dx / dist) * diff, fy = (dy / dist) * diff;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });

      // Center gravity
      nodes.forEach(n => {
        n.vx += (cx - n.x) * CENTER_FORCE;
        n.vy += (cy - n.y) * CENTER_FORCE;
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x = Math.max(60, Math.min(width - 60, n.x + n.vx));
        n.y = Math.max(40, Math.min(height - 40, n.y + n.vy));
      });

      // Push to React state every 4 ticks for smooth animation
      if (tick % 4 === 0) {
        const snap = new Map<string, { x: number; y: number }>();
        nodes.forEach(n => snap.set(n.id, { x: n.x, y: n.y }));
        setPositions(new Map(snap));
      }

      frameRef.current = requestAnimationFrame(simulate);
    };

    frameRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nodes, links, width, height]);

  return positions;
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  projectId: string;
  editorContent: string;
}

 function KnowledgeGraph({ projectId, editorContent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 460 });
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<KGLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: isExpanded ? 600 : 460 });
    });
    ro.observe(el);
    setDimensions({ width: el.clientWidth, height: isExpanded ? 600 : 460 });
    return () => ro.disconnect();
  }, [isExpanded]);

  // Filter nodes/links by type
  const filteredData = graphData ? {
    ...graphData,
    nodes: filterType === "ALL" ? graphData.nodes : graphData.nodes.filter(n => n.type === filterType),
    links: filterType === "ALL" ? graphData.links : graphData.links.filter(l => {
      const validIds = new Set((filterType === "ALL" ? graphData.nodes : graphData.nodes.filter(n => n.type === filterType)).map(n => n.id));
      return validIds.has(l.source as string) && validIds.has(l.target as string);
    }),
  } : null;

  const positions = useForceSimulation(
    filteredData?.nodes || [],
    filteredData?.links || [],
    dimensions.width,
    dimensions.height
  );

  // Analyze story content
  const analyzeContent = useCallback(async () => {
    const trimmed = editorContent.trim();
    if (!trimmed || trimmed === lastAnalyzed) return;
    if (trimmed.split(/\s+/).length < 10) {
      setError("Write at least 10 words to generate a knowledge graph.");
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setSelectedLink(null);
    try {
      const data = await fetchKnowledgeGraph(trimmed, projectId);
      setGraphData(data);
      setLastAnalyzed(trimmed);
    } catch (e) {
      setError("Failed to analyze content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [editorContent, projectId, lastAnalyzed]);

  // Get related links for a node
  const getNodeLinks = (nodeId: string) =>
    graphData?.links.filter(l => l.source === nodeId || l.target === nodeId) || [];

  // Get unique entity types for filter
  const entityTypes = graphData ? ["ALL", ...new Set(graphData.nodes.map(n => n.type))] : ["ALL"];

  // Highlighted nodes (connected to selected)
  const highlightedNodes = selectedNode
    ? new Set([selectedNode.id, ...getNodeLinks(selectedNode.id).map(l => l.source as string), ...getNodeLinks(selectedNode.id).map(l => l.target as string)])
    : null;

  return (
    <div style={{ marginTop: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Section header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem",
      }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1a1510", marginBottom: "0.2rem" }}>
            🕸️ Knowledge Graph
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#9e9589" }}>
            Visual map of entities and relationships extracted from your story
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={outlineBtn}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "⤡ Collapse" : "⤢ Expand"}
          </button>

          {/* Analyze button */}
          <button
            onClick={analyzeContent}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.1rem", borderRadius: "9px",
              border: "none", background: loading ? "#d4cdc5" : "#1a1510",
              color: "#fff", fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.82rem", fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#c96a3b"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1a1510"; }}
          >
            {loading ? (
              <><div style={spinner} /> Analyzing…</>
            ) : (
              <><span>⚡</span> {graphData ? "Re-analyze" : "Analyze Story"}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter pills ── */}
      {graphData && (
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          {entityTypes.map(type => {
            const col = type === "ALL" ? null : getColor(type);
            const count = type === "ALL" ? graphData.nodes.length : graphData.nodes.filter(n => n.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: "0.25rem 0.75rem", borderRadius: "20px",
                  border: filterType === type
                    ? `1.5px solid ${col?.border || "#1a1510"}`
                    : "1.5px solid #e8e2d9",
                  background: filterType === type
                    ? col?.bg || "#f0ebe3"
                    : "#fff",
                  color: filterType === type
                    ? col?.text || "#1a1510"
                    : "#9e9589",
                  fontSize: "0.73rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {type} <span style={{ opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Graph container ── */}
      <div
        ref={containerRef}
        style={{
          width: "100%", height: `${dimensions.height}px`,
          background: "#0f0e0c",
          borderRadius: "16px", overflow: "hidden",
          border: "1px solid #2a2520",
          position: "relative",
          transition: "height 0.3s ease",
        }}
      >
        {/* Empty state */}
        {!graphData && !loading && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#4a4540", textAlign: "center", padding: "2rem",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>🕸️</div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#6a6560", marginBottom: "0.4rem" }}>
              No graph yet
            </p>
            <p style={{ fontSize: "0.8rem", color: "#3a3530", maxWidth: "280px", lineHeight: 1.6 }}>
              Write your story above, then click <strong style={{ color: "#c96a3b" }}>Analyze Story</strong> to extract characters, locations, and their relationships.
            </p>
            {error && <p style={{ color: "#c96a3b", fontSize: "0.8rem", marginTop: "0.75rem" }}>{error}</p>}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1rem",
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#c96a3b",
                  animation: `kgBounce 1s ease ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
            <p style={{ color: "#6a6560", fontSize: "0.82rem" }}>Extracting entities and relationships…</p>
          </div>
        )}

        {/* SVG Graph */}
        {filteredData && !loading && positions.size > 0 && (
          <svg
            width={dimensions.width}
            height={dimensions.height}
            style={{ position: "absolute", inset: 0 }}
            onClick={() => { setSelectedNode(null); setSelectedLink(null); }}
          >
            <defs>
              {/* Arrow markers per type */}
              {Object.entries(NODE_COLORS).map(([type, col]) => (
                <marker
                  key={type}
                  id={`arrow-${type}`}
                  markerWidth="8" markerHeight="8"
                  refX="16" refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill={col.border} opacity="0.7" />
                </marker>
              ))}

              {/* Glow filters */}
              {Object.entries(NODE_COLORS).map(([type, col]) => (
                <filter key={`glow-${type}`} id={`glow-${type}`}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor={col.border} floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
            </defs>

            {/* Grid dots background */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#2a2520" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Links */}
            {filteredData.links.map((link, i) => {
              const srcId = typeof link.source === "string" ? link.source : (link.source as KGNode).id;
              const tgtId = typeof link.target === "string" ? link.target : (link.target as KGNode).id;
              const src = positions.get(srcId);
              const tgt = positions.get(tgtId);
              if (!src || !tgt) return null;

              const tgtNode = filteredData.nodes.find(n => n.id === tgtId);
              const col = getColor(tgtNode?.type || "DEFAULT");
              const isSelected = selectedLink === link;
              const isHighlighted = highlightedNodes ? (highlightedNodes.has(srcId) && highlightedNodes.has(tgtId)) : false;
              const isDimmed = highlightedNodes && !isHighlighted;

              // Curved path
              const mx = (src.x + tgt.x) / 2 + (tgt.y - src.y) * 0.18;
              const my = (src.y + tgt.y) / 2 - (tgt.x - src.x) * 0.18;

              return (
                <g key={i} onClick={e => { e.stopPropagation(); setSelectedLink(isSelected ? null : link); setSelectedNode(null); }} style={{ cursor: "pointer" }}>
                  <path
                    d={`M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`}
                    fill="none"
                    stroke={col.border}
                    strokeWidth={isSelected || isHighlighted ? 2.5 : 1.2}
                    strokeOpacity={isDimmed ? 0.08 : isSelected || isHighlighted ? 0.9 : 0.35}
                    strokeDasharray={isSelected ? "none" : "none"}
                    markerEnd={`url(#arrow-${tgtNode?.type || "DEFAULT"})`}
                    style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
                  />
                  {/* Invisible wider hit area */}
                  <path
                    d={`M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`}
                    fill="none" stroke="transparent" strokeWidth={12}
                  />
                  {/* Relation label */}
                  {(isSelected || isHighlighted) && (
                    <text
                      x={mx} y={my - 6}
                      textAnchor="middle"
                      fill={col.border}
                      fontSize="10"
                      fontFamily="'DM Sans', sans-serif"
                      fontWeight="600"
                      style={{ pointerEvents: "none" }}
                    >
                      {link.relation}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredData.nodes.map(node => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const col = getColor(node.type);
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const isDimmed = highlightedNodes && !highlightedNodes.has(node.id);
              const r = isSelected ? 28 : isHovered ? 26 : 22;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={e => { e.stopPropagation(); setSelectedNode(isSelected ? null : node); setSelectedLink(null); }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                  opacity={isDimmed ? 0.2 : 1}
                >
                  {/* Glow ring */}
                  {(isSelected || isHovered) && (
                    <circle r={r + 8} fill={col.glow} style={{ animation: "kgPulse 1.5s ease infinite" }} />
                  )}
                  {/* Main circle */}
                  <circle
                    r={r}
                    fill={col.bg}
                    stroke={col.border}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter={isSelected || isHovered ? `url(#glow-${node.type})` : undefined}
                    style={{ transition: "r 0.2s" }}
                  />
                  {/* Type badge */}
                  <text
                    y={-r - 6}
                    textAnchor="middle"
                    fill={col.border}
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="'DM Sans', sans-serif"
                    style={{ pointerEvents: "none", letterSpacing: "0.05em" }}
                  >
                    {node.type}
                  </text>
                  {/* Node label */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={col.text}
                    fontSize={node.id.length > 8 ? "9" : "11"}
                    fontWeight="600"
                    fontFamily="'DM Sans', sans-serif"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.id.length > 10 ? node.id.slice(0, 9) + "…" : node.id}
                  </text>
                  {/* Mentions count */}
                  <text
                    y={r + 13}
                    textAnchor="middle"
                    fill="#4a4540"
                    fontSize="8"
                    fontFamily="'DM Sans', sans-serif"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.mentions.length} scene{node.mentions.length !== 1 ? "s" : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div style={{
            position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
            background: "#3a1510", color: "#fde8d8", padding: "0.5rem 1rem",
            borderRadius: "8px", fontSize: "0.78rem",
          }}>
            {error}
          </div>
        )}

        {/* Stats bar */}
        {graphData && !loading && (
          <div style={{
            position: "absolute", top: "0.75rem", left: "0.75rem",
            display: "flex", gap: "0.5rem",
          }}>
            {[
              { label: "Entities", val: filteredData?.nodes.length || 0 },
              { label: "Relations", val: filteredData?.links.length || 0 },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(15,14,12,0.8)", backdropFilter: "blur(4px)",
                border: "1px solid #2a2520", borderRadius: "8px",
                padding: "0.3rem 0.7rem", fontSize: "0.72rem", color: "#6a6560",
              }}>
                <span style={{ color: "#c96a3b", fontWeight: 700, marginRight: "0.3rem" }}>{s.val}</span>
                {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {(selectedNode || selectedLink) && (
        <div style={{
          marginTop: "0.75rem",
          background: "#fff", border: "1px solid #e8e2d9",
          borderRadius: "12px", padding: "1rem 1.25rem",
          animation: "fadeUp 0.2s ease both",
        }}>
          {selectedNode && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: getColor(selectedNode.type).bg,
                  border: `2px solid ${getColor(selectedNode.type).border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: getColor(selectedNode.type).text,
                }}>
                  {selectedNode.type.slice(0, 3)}
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", color: "#1a1510" }}>{selectedNode.id}</p>
                  <p style={{ fontSize: "0.73rem", color: "#9e9589" }}>{selectedNode.type} · appears in {selectedNode.mentions.length} scene{selectedNode.mentions.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Relationships
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {getNodeLinks(selectedNode.id).map((link, i) => {
                  const isSource = link.source === selectedNode.id;
                  const other = isSource ? link.target : link.source;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.4rem 0.6rem", borderRadius: "8px", background: "#faf7f4",
                      fontSize: "0.8rem", color: "#4a4540",
                    }}>
                      <span style={{ color: isSource ? "#c96a3b" : "#3b82c9", fontWeight: 600 }}>
                        {isSource ? `→` : `←`}
                      </span>
                      <span style={{ fontWeight: 500, color: "#1a1510" }}>{other as string}</span>
                      <span style={{ color: "#9e9589" }}>{link.relation}</span>
                      <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#b8b0a4" }}>
                        {link.scene_id}
                      </span>
                    </div>
                  );
                })}
                {getNodeLinks(selectedNode.id).length === 0 && (
                  <p style={{ fontSize: "0.78rem", color: "#9e9589" }}>No relationships found.</p>
                )}
              </div>
            </>
          )}

          {selectedLink && !selectedNode && (
            <>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                Relationship Detail
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510" }}>
                  {selectedLink.source as string}
                </span>
                <span style={{
                  padding: "0.2rem 0.6rem", borderRadius: "20px",
                  background: "#fde8d8", color: "#c96a3b",
                  fontSize: "0.75rem", fontWeight: 600,
                }}>
                  {selectedLink.relation}
                </span>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510" }}>
                  {selectedLink.target as string}
                </span>
              </div>
              <div style={{ background: "#faf7f4", borderRadius: "8px", padding: "0.6rem 0.8rem", borderLeft: "3px solid #c96a3b" }}>
                <p style={{ fontSize: "0.78rem", color: "#4a4540", fontStyle: "italic", lineHeight: 1.6 }}>
                  "{selectedLink.sentence}"
                </p>
                <p style={{ fontSize: "0.7rem", color: "#9e9589", marginTop: "0.3rem" }}>{selectedLink.scene_id}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      {graphData && (
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          {Object.entries(NODE_COLORS).filter(([k]) => k !== "DEFAULT").map(([type, col]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "#6a6560" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: col.bg, border: `1.5px solid ${col.border}` }} />
              {type}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes kgBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes kgPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Small style helpers ───────────────────────────────────────────────────────
const outlineBtn: React.CSSProperties = {
  padding: "0.4rem 0.8rem", borderRadius: "8px",
  border: "1.5px solid #e8e2d9", background: "#fff",
  fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem",
  color: "#4a4540", cursor: "pointer",
};

const spinner: React.CSSProperties = {
  width: "13px", height: "13px", borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff",
  animation: "spin 0.8s linear infinite",
  display: "inline-block",
};

export default KnowledgeGraph;