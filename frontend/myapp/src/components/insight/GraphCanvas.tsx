"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
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
    PERSON: "#c96a3b",
    GPE: "#3b82c9",
    ORG: "#3bc96a",
    EVENT: "#9c3bc9",
    DEFAULT: "#9e9589",
};

export default function GraphCanvas({ data, highlightedNodeId, onNodeClick }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [nodeLimit, setNodeLimit] = useState<number>(25); // 0 means all

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-80); // bring nodes closer
            fgRef.current.d3Force('link').distance(40);
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
        const filteredLinks = data.links
            .filter((l: any) => {
                const s = typeof l.source === 'string' ? l.source : l.source?.id;
                const t = typeof l.target === 'string' ? l.target : l.target?.id;
                return nodeIds.has(s) && nodeIds.has(t);
            })
            .map((l: any) => ({ ...l, name: l.relation }));

        return {
            nodes: filteredNodes.map((n: any) => ({ ...n })),
            links: filteredLinks
        };
    }, [data, nodeLimit]);

    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e8e2d9", position: "relative", overflow: "hidden" }}>
            {/* Top right dropdown */}
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e8e2d9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#4a4540', fontWeight: 500 }}>Show top:</span>
                <select
                    value={nodeLimit}
                    onChange={e => setNodeLimit(Number(e.target.value))}
                    style={{ border: '1px solid #d4cdc5', borderRadius: '4px', padding: '2px 4px', fontSize: '0.8rem', color: '#1a1510', background: '#fff', cursor: 'pointer', outline: 'none' }}
                >
                    <option value={10}>10 nodes</option>
                    <option value={15}>15 nodes</option>
                    <option value={25}>25 nodes</option>
                    <option value={50}>50 nodes</option>
                    <option value={0}>All nodes</option>
                </select>
            </div>
            {data && (
                <ForceGraph3D
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel={(node: any) => `${node.id} (${node.type}) - ${node.count || 1} mentions`}
                    nodeColor={(node: any) => node.id === highlightedNodeId ? "#ff0000" : (NODE_COLORS[node.type] || NODE_COLORS.DEFAULT)}
                    nodeVal={(node: any) => {
                        const count = node.count || 1;
                        const baseVal = Math.max(5, count * 3); // Scale volume by mentions
                        return node.id === highlightedNodeId ? baseVal * 2 : baseVal;
                    }}
                    onNodeClick={(node: any) => onNodeClick(node)}
                    linkWidth={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? 3 : 1.5; // Thickness of the 3D tube
                    }}
                    linkColor={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? "#ff0000" : "#d92b2b"; // Red connections
                    }}
                    linkResolution={6} // CRITICAL: This forces ForceGraph to render tubes instead of 1D WebGL lines
                    linkOpacity={0.9} // Highly visible
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={(link: any) => {
                        const isHighlighted = highlightedNodeId && ((link.source.id || link.source) === highlightedNodeId || (link.target.id || link.target) === highlightedNodeId);
                        return isHighlighted ? 3 : 1; // Default particles for all paths
                    }}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    backgroundColor="#ffffff"
                    showNavInfo={true}
                    ref={fgRef}
                />
            )}
        </div>
    );
}