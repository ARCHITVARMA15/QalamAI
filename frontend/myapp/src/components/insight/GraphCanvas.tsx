"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { KGNode, KGLink } from "@/lib/insightApi";
import * as THREE from "three";

// Dynamically import ForceGraph3D since it uses the window object
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
    ssr: false,
    loading: () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9e9589' }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #e8e2d9", borderTopColor: "#c96a3b", animation: "spin 0.8s linear infinite", marginRight: "10px" }} />
            Loading 3D Graph...
        </div>
    )
});

interface GraphCanvasProps {
    data: any;
    highlightedNodeId: string | null;
    onNodeClick: (node: any) => void;
}

const NODE_COLORS: Record<string, string> = {
    PERSON: "#e8723a",
    GPE: "#3b82f6",
    ORG: "#22c55e",
    EVENT: "#a855f7",
    LOC: "#06b6d4",
    FAC: "#f59e0b",
    DATE: "#ec4899",
    DEFAULT: "#9e9589",
};

// Glow colors (lighter versions for emission)
const NODE_GLOW: Record<string, string> = {
    PERSON: "#ffb088",
    GPE: "#93c5fd",
    ORG: "#86efac",
    EVENT: "#d8b4fe",
    LOC: "#67e8f9",
    FAC: "#fde68a",
    DATE: "#f9a8d4",
    DEFAULT: "#d4cdc5",
};

export default function GraphCanvas({ data, highlightedNodeId, onNodeClick }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [nodeLimit, setNodeLimit] = useState<number>(25);

    // Configure forces for good spacing
    useEffect(() => {
        if (fgRef.current) {
            // Strong repulsion to space nodes apart
            fgRef.current.d3Force('charge').strength(-250).distanceMax(400);
            // Longer link distance so connections are clearly visible
            fgRef.current.d3Force('link').distance(120);
            // Center force to keep graph centered
            if (fgRef.current.d3Force('center')) {
                fgRef.current.d3Force('center').strength(0.05);
            }
        }
    }, [data, dimensions]);

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

    const graphData = useMemo(() => {
        if (!data || !data.nodes) return { nodes: [], links: [] };

        // Sort nodes by mention count descending
        let filteredNodes = [...data.nodes].sort((a: any, b: any) =>
            (b.count || 1) - (a.count || 1)
        );

        if (nodeLimit > 0) {
            filteredNodes = filteredNodes.slice(0, nodeLimit);
        }

        const nodeIds = new Set(filteredNodes.map((n: any) => n.id));

        // Filter links where both source and target are in the filtered nodes
        // Also deduplicate links by source-target pair
        const seenLinks = new Set<string>();
        const filteredLinks = data.links
            .filter((l: any) => {
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                if (!nodeIds.has(s) || !nodeIds.has(t)) return false;
                const key = `${s}->${t}`;
                if (seenLinks.has(key)) return false;
                seenLinks.add(key);
                return true;
            })
            .map((l: any) => ({ ...l, name: l.relation }));

        return {
            nodes: filteredNodes.map((n: any) => ({ ...n })),
            links: filteredLinks
        };
    }, [data, nodeLimit]);

    // Custom 3D node object — smooth spheres with glow
    const nodeThreeObject = useCallback((node: any) => {
        const isHighlighted = node.id === highlightedNodeId;
        const count = node.count || 1;

        // Sphere size based on mentions (clamped)
        const radius = Math.min(Math.max(3, Math.sqrt(count) * 2), 12);
        const finalRadius = isHighlighted ? radius * 1.4 : radius;

        const color = NODE_COLORS[node.type] || NODE_COLORS.DEFAULT;
        const glowColor = NODE_GLOW[node.type] || NODE_GLOW.DEFAULT;

        // Create a group to hold sphere + label
        const group = new THREE.Group();

        // Main sphere — smooth with high segments
        const geometry = new THREE.SphereGeometry(finalRadius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(isHighlighted ? color : glowColor),
            emissiveIntensity: isHighlighted ? 0.6 : 0.15,
            shininess: 80,
            transparent: true,
            opacity: isHighlighted ? 1.0 : 0.92,
        });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);

        // Outer glow ring for highlighted nodes
        if (isHighlighted) {
            const glowGeo = new THREE.SphereGeometry(finalRadius * 1.3, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.15,
            });
            group.add(new THREE.Mesh(glowGeo, glowMat));
        }

        // Text label — using sprite for always-facing camera
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const label = node.id;
        const fontSize = isHighlighted ? 28 : 22;

        canvas.width = 256;
        canvas.height = 64;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background pill
        ctx.font = `600 ${fontSize}px 'DM Sans', sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const pillWidth = textWidth + 20;
        const pillHeight = fontSize + 10;
        const x = (canvas.width - pillWidth) / 2;
        const y = (canvas.height - pillHeight) / 2;

        ctx.fillStyle = 'rgba(26, 21, 16, 0.75)';
        ctx.beginPath();
        ctx.roundRect(x, y, pillWidth, pillHeight, 8);
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(24, 6, 1);
        sprite.position.set(0, finalRadius + 6, 0);
        group.add(sprite);

        return group;
    }, [highlightedNodeId]);

    return (
        <div ref={containerRef} style={{
            width: "100%", height: "100%",
            background: "linear-gradient(145deg, #1a1510 0%, #2a2520 50%, #1a1510 100%)",
            borderRadius: "12px", border: "1px solid #3a3530",
            position: "relative", overflow: "hidden",
        }}>
            {/* Top right dropdown */}
            <div style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                background: 'rgba(26,21,16,0.85)', backdropFilter: 'blur(8px)',
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid #3a3530',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <span style={{ fontSize: '0.78rem', color: '#b8b0a4', fontWeight: 500 }}>Show top:</span>
                <select
                    value={nodeLimit}
                    onChange={e => setNodeLimit(Number(e.target.value))}
                    style={{
                        border: '1px solid #4a4540', borderRadius: '6px',
                        padding: '3px 6px', fontSize: '0.78rem',
                        color: '#faf7f4', background: '#2a2520',
                        cursor: 'pointer', outline: 'none',
                    }}
                >
                    <option value={10}>10 nodes</option>
                    <option value={15}>15 nodes</option>
                    <option value={25}>25 nodes</option>
                    <option value={50}>50 nodes</option>
                    <option value={0}>All nodes</option>
                </select>
            </div>

            {/* Stats badge */}
            {graphData.nodes.length > 0 && (
                <div style={{
                    position: 'absolute', top: 16, left: 16, zIndex: 10,
                    background: 'rgba(26,21,16,0.85)', backdropFilter: 'blur(8px)',
                    padding: '6px 12px', borderRadius: '8px',
                    border: '1px solid #3a3530',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '0.72rem', color: '#b8b0a4',
                }}>
                    <span>🔵 <strong style={{ color: '#faf7f4' }}>{graphData.nodes.length}</strong> entities</span>
                    <span style={{ color: '#4a4540' }}>|</span>
                    <span>🔗 <strong style={{ color: '#faf7f4' }}>{graphData.links.length}</strong> connections</span>
                </div>
            )}

            {data && (
                <ForceGraph3D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeThreeObject={nodeThreeObject}
                    nodeThreeObjectExtend={false}
                    onNodeClick={(node: any) => onNodeClick(node)}
                    linkWidth={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? 3 : 1.5;
                    }}
                    linkColor={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? "#fbbf24" : "rgba(232, 114, 58, 0.5)";
                    }}
                    linkResolution={8}
                    linkOpacity={0.8}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? 3.5 : 1.5;
                    }}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleColor={() => "#fbbf24"}
                    linkDirectionalArrowLength={5}
                    linkDirectionalArrowRelPos={1}
                    linkDirectionalArrowColor={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? "#fbbf24" : "rgba(232, 114, 58, 0.6)";
                    }}
                    linkLabel={(link: any) => `<span style="color:#faf7f4;background:rgba(26,21,16,0.85);padding:3px 8px;border-radius:6px;font-size:11px;font-family:DM Sans,sans-serif">${link.relation || 'related'}</span>`}
                    backgroundColor="rgba(0,0,0,0)"
                    showNavInfo={true}
                />
            )}
        </div>
    );
}