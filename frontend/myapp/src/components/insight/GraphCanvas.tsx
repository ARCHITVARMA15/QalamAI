import React, { useState, useEffect, useRef } from "react";
import { KGNode, KGLink } from "@/lib/insightApi";

interface GraphCanvasProps {
    data: any;
    highlightedNodeId: string | null;
    onNodeClick: (node: any) => void;
}

// ─── Node type colors ─────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    PERSON: { bg: "#fde8d8", border: "#c96a3b", text: "#7a3a18", glow: "rgba(201,106,59,0.3)" },
    GPE: { bg: "#dceeff", border: "#3b82c9", text: "#18407a", glow: "rgba(59,130,201,0.3)" },
    ORG: { bg: "#e8f5e9", border: "#3bc96a", text: "#187a3a", glow: "rgba(59,201,106,0.3)" },
    EVENT: { bg: "#f3e8ff", border: "#9c3bc9", text: "#5a187a", glow: "rgba(156,59,201,0.3)" },
    DEFAULT: { bg: "#f5f1eb", border: "#9e9589", text: "#4a4540", glow: "rgba(158,149,137,0.3)" },
};

const getColor = (type: string) => NODE_COLORS[type] || NODE_COLORS.DEFAULT;

// ─── Simple force simulation (no D3 dependency) ───────────────────────────────
function useForceSimulation(nodes: KGNode[], links: KGLink[], width: number, height: number) {
    const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
    const frameRef = useRef<number>(0);
    const stateRef = useRef<Map<string, any>>(new Map());

    useEffect(() => {
        if (!nodes?.length || !width || !height) return;
        cancelAnimationFrame(frameRef.current);

        const state = new Map<string, any>();
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
            const nodesArr = [...stateRef.current.values()];

            for (let i = 0; i < nodesArr.length; i++) {
                for (let j = i + 1; j < nodesArr.length; j++) {
                    const a = nodesArr[i], b = nodesArr[j];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
                    const force = REPULSION / (dist * dist);
                    const fx = (dx / dist) * force, fy = (dy / dist) * force;
                    a.vx -= fx; a.vy -= fy;
                    b.vx += fx; b.vy += fy;
                }
            }

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

            nodesArr.forEach(n => {
                n.vx += (cx - n.x) * CENTER_FORCE;
                n.vy += (cy - n.y) * CENTER_FORCE;
                n.vx *= DAMPING; n.vy *= DAMPING;
                n.x = Math.max(60, Math.min(width - 60, n.x + n.vx));
                n.y = Math.max(40, Math.min(height - 40, n.y + n.vy));
            });

            if (tick % 4 === 0) {
                const snap = new Map<string, { x: number; y: number }>();
                nodesArr.forEach(n => snap.set(n.id, { x: n.x, y: n.y }));
                setPositions(new Map(snap));
            }

            frameRef.current = requestAnimationFrame(simulate);
        };

        frameRef.current = requestAnimationFrame(simulate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [nodes, links, width, height]);

    return positions;
}

export default function GraphCanvas({ data, highlightedNodeId, onNodeClick }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        ro.observe(el);
        setDimensions({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    const positions = useForceSimulation(
        data?.nodes || [],
        data?.links || [],
        dimensions.width,
        dimensions.height
    );

    const highlightedNodes = highlightedNodeId
        ? new Set([
            highlightedNodeId,
            ...(data?.links || []).filter((l: any) => l.source === highlightedNodeId || typeof l.source !== "string" && l.source.id === highlightedNodeId).map((l: any) => typeof l.target === "string" ? l.target : l.target.id),
            ...(data?.links || []).filter((l: any) => l.target === highlightedNodeId || typeof l.target !== "string" && l.target.id === highlightedNodeId).map((l: any) => typeof l.source === "string" ? l.source : l.source.id)
        ])
        : null;

    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e8e2d9", position: "relative", overflow: "hidden" }}>
            {/* Grid background */}
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.8" fill="#e8e2d9" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {data && positions.size > 0 && (
                <svg width={dimensions.width} height={dimensions.height} style={{ position: "absolute", inset: 0 }} onClick={() => onNodeClick({ id: null })}>
                    <defs>
                        {Object.entries(NODE_COLORS).map(([type, col]) => (
                            <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="16" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L8,3 z" fill={col.border} opacity="0.7" />
                            </marker>
                        ))}
                    </defs>

                    {/* Links */}
                    {data.links.map((link: any, i: number) => {
                        const srcId = typeof link.source === "string" ? link.source : link.source.id;
                        const tgtId = typeof link.target === "string" ? link.target : link.target.id;
                        const src = positions.get(srcId);
                        const tgt = positions.get(tgtId);
                        if (!src || !tgt) return null;

                        const tgtNode = data.nodes.find((n: any) => n.id === tgtId);
                        const col = getColor(tgtNode?.type || "DEFAULT");
                        const isHighlighted = highlightedNodes ? (highlightedNodes.has(srcId) && highlightedNodes.has(tgtId)) : false;
                        const isDimmed = highlightedNodes && !isHighlighted;

                        const mx = (src.x + tgt.x) / 2 + (tgt.y - src.y) * 0.18;
                        const my = (src.y + tgt.y) / 2 - (tgt.x - src.x) * 0.18;

                        return (
                            <g key={i}>
                                <path
                                    d={`M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`}
                                    fill="none"
                                    stroke={col.border}
                                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                                    strokeOpacity={isDimmed ? 0.08 : isHighlighted ? 0.9 : 0.35}
                                    markerEnd={`url(#arrow-${tgtNode?.type || "DEFAULT"})`}
                                    style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
                                />
                                {isHighlighted && (
                                    <text x={mx} y={my - 6} textAnchor="middle" fill={col.border} fontSize="10" fontFamily="'DM Sans', sans-serif" fontWeight="600" style={{ pointerEvents: "none" }}>
                                        {link.relation}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {data.nodes.map((node: any) => {
                        const pos = positions.get(node.id);
                        if (!pos) return null;
                        const col = getColor(node.type);
                        const isSelected = highlightedNodeId === node.id;
                        const isHovered = hoveredNode === node.id;
                        const isDimmed = highlightedNodes && !highlightedNodes.has(node.id);
                        const r = isSelected ? 28 : isHovered ? 26 : 22;

                        return (
                            <g
                                key={node.id}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                onClick={e => { e.stopPropagation(); onNodeClick(node); }}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                                opacity={isDimmed ? 0.2 : 1}
                            >
                                {(isSelected || isHovered) && (
                                    <circle r={r + 8} fill={col.glow} style={{ animation: "kgPulse 1.5s ease infinite" }} />
                                )}
                                <circle
                                    r={r}
                                    fill={col.bg}
                                    stroke={col.border}
                                    strokeWidth={isSelected ? 2.5 : 1.5}
                                    style={{ transition: "r 0.2s" }}
                                />
                                <text y={-r - 6} textAnchor="middle" fill={col.border} fontSize="8" fontWeight="700" fontFamily="'DM Sans', sans-serif" style={{ pointerEvents: "none" }}>
                                    {node.type}
                                </text>
                                <text textAnchor="middle" dominantBaseline="middle" fill={col.text} fontSize={node.id.length > 8 ? "9" : "11"} fontWeight="600" fontFamily="'DM Sans', sans-serif" style={{ pointerEvents: "none" }}>
                                    {node.id.length > 10 ? node.id.slice(0, 9) + "…" : node.id}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            )}
            <style>{`
                @keyframes kgPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
}