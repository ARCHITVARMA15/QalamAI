import React from "react";

interface GraphCanvasProps {
    data: any;
    highlightedNodeId: string | null;
    onNodeClick: (node: any) => void;
}

export default function GraphCanvas({ data, highlightedNodeId, onNodeClick }: GraphCanvasProps) {
    return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", borderRadius: "12px", border: "1px solid #e8e2d9" }}>
            <p style={{ color: "#9e9589" }}>Graph Visualization Placeholder</p>
        </div>
    );
}