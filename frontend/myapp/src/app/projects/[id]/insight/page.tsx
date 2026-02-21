"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchKnowledgeGraph, fetchPersonas, KnowledgeGraphData, PersonaNode } from "@/lib/insightApi";
import GraphCanvas from "@/components/insight/GraphCanvas";
import PersonaCards from "@/components/insight/PersonaCards";

interface Project {
  id: string;
  title: string;
  emoji: string;
  content: string;
  genre: string;
}

export default function InsightPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [personas, setPersonas] = useState<PersonaNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "personas">("graph");

  // Load project from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("writeai_projects");
    if (!stored) return;
    const projects: Project[] = JSON.parse(stored);
    const found = projects.find((p) => p.id === projectId);
    if (found) setProject(found);
  }, [projectId]);

  const handleAnalyze = async () => {
    if (!project) return;
    const content = project.content || "Once upon a time in a forgotten kingdom, Elena and Marcus journeyed to Delhi seeking the Council's blessing. Amir betrayed them all.";
    setLoading(true);
    try {
      const [graph, personaData] = await Promise.all([
        fetchKnowledgeGraph(content, projectId),
        fetchPersonas(content, projectId),
      ]);
      setGraphData(graph);
      setPersonas(personaData[0]?.nodes || []);
      setAnalyzed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const notFound = !project;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf7f4; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Ambient background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 40% at 15% 15%, rgba(201,106,59,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 85% 85%, rgba(124,92,191,0.06) 0%, transparent 60%)",
      }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0 1.75rem", height: "56px",
        background: "rgba(250,247,244,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8e2d9",
      }}>
        {/* Back to editor */}
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            background: "none", border: "none", cursor: "pointer",
            color: "#9e9589", fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif",
            padding: "0.35rem 0.65rem", borderRadius: "8px", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f0ebe3"; e.currentTarget.style.color = "#1a1510"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9e9589"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Editor
        </button>

        <div style={{ width: "1px", height: "18px", background: "#e8e2d9" }} />

        {/* Project info */}
        {project && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1rem" }}>{project.emoji}</span>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a1510" }}>{project.title}</span>
            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "20px", background: "#f0ebe3", color: "#9e9589", marginLeft: "0.25rem" }}>Insight</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Mobile tabs */}
        <div style={{ display: "flex", gap: "0.25rem", background: "#f0ebe3", borderRadius: "9px", padding: "0.2rem" }}>
          {(["graph", "personas"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.3rem 0.75rem", borderRadius: "7px",
                border: "none", background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#1a1510" : "#9e9589",
                fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem", fontWeight: 500,
                cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab === "graph" ? "🕸️ Graph" : "👥 Personas"}
            </button>
          ))}
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: "0.45rem",
            padding: "0.5rem 1.1rem", borderRadius: "9px",
            border: "none", background: loading ? "#d4cdc5" : "#1a1510",
            color: "#fff", fontFamily: "'DM Sans',sans-serif",
            fontSize: "0.82rem", fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#c96a3b"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#1a1510"; }}
        >
          {loading
            ? <><div style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />Analyzing…</>
            : <><span>⚡</span>{analyzed ? "Re-analyze" : "Analyze Story"}</>
          }
        </button>
      </nav>

      {/* ── Body ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* ── LEFT: Knowledge Graph ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderRight: "1px solid #e8e2d9", overflow: "hidden",
          // Mobile: hide if personas tab active
        }}>
          {/* Panel header */}
          <div style={{ padding: "1rem 1.5rem 0.75rem", borderBottom: "1px solid #e8e2d9", background: "#faf7f4", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.15rem", color: "#1a1510" }}>🕸️ Knowledge Graph</h2>
                <p style={{ fontSize: "0.73rem", color: "#9e9589", marginTop: "0.15rem" }}>Entity relationships extracted from your story</p>
              </div>
              {graphData && (
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {Object.entries({ PERSON: "#c96a3b", GPE: "#3b82c9", ORG: "#3bc96a", EVENT: "#9c3bc9" }).map(([t, c]) => (
                    <span key={t} style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "20px", background: "#fff", border: `1px solid ${c}`, color: c, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Graph canvas area */}
          <div style={{ flex: 1, padding: "1rem 1.25rem", overflow: "hidden" }}>
            {!analyzed && !loading && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9e9589", textAlign: "center" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f0ebe3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "1.25rem" }}>🕸️</div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.2rem", color: "#4a4540", marginBottom: "0.4rem" }}>No graph yet</p>
                <p style={{ fontSize: "0.82rem", maxWidth: "280px", lineHeight: 1.6 }}>
                  Click <strong style={{ color: "#c96a3b" }}>Analyze Story</strong> to extract entities and relationships from your writing.
                </p>
              </div>
            )}

            {loading && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#c96a3b", animation: `kgBounce 1s ease ${i * 0.15}s infinite` }} />
                  ))}
                </div>
                <p style={{ color: "#9e9589", fontSize: "0.82rem" }}>Mapping your story's world…</p>
                <style>{`@keyframes kgBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
              </div>
            )}

            {graphData && !loading && (
              <div style={{ height: "100%", animation: "fadeUp 0.4s ease both" }}>
                <GraphCanvas
                  data={graphData}
                  highlightedNodeId={highlightedId}
                  onNodeClick={(node) => setHighlightedId(highlightedId === node.id ? null : node.id)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Persona Cards ── */}
        <div style={{ width: "360px", flexShrink: 0, display: "flex", flexDirection: "column", background: "#faf7f4", overflow: "hidden" }}>
          {/* Panel header */}
          <div style={{ padding: "1rem 1.25rem 0.75rem", borderBottom: "1px solid #e8e2d9", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.15rem", color: "#1a1510" }}>👥 Personas</h2>
                <p style={{ fontSize: "0.73rem", color: "#9e9589", marginTop: "0.15rem" }}>
                  {personas.length > 0 ? `${personas.length} character${personas.length !== 1 ? "s" : ""} identified` : "Characters from your story"}
                </p>
              </div>
              {personas.length > 0 && (
                <div style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "20px", background: "#f0ebe3", color: "#9e9589" }}>
                  Click to expand
                </div>
              )}
            </div>
          </div>

          {/* Cards scroll area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.1rem" }}>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    height: "88px", borderRadius: "14px",
                    background: "linear-gradient(90deg, #f0ebe3 25%, #faf7f4 50%, #f0ebe3 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    border: "1px solid #e8e2d9",
                  }} />
                ))}
                <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
              </div>
            )}

            {!loading && (
              <PersonaCards
                personas={personas}
                highlightedId={highlightedId}
                onCardClick={(id) => setHighlightedId(highlightedId === id ? null : id)}
              />
            )}
          </div>

          {/* Footer hint */}
          {analyzed && personas.length > 0 && (
            <div style={{ padding: "0.6rem 1.1rem", borderTop: "1px solid #e8e2d9", fontSize: "0.7rem", color: "#b8b0a4", textAlign: "center" }}>
              Click a persona card to highlight on graph · Click ⤢ to expand
            </div>
          )}
        </div>
      </div>
    </>
  );
}