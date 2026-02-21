// ─── Knowledge Graph Types ────────────────────────────────────────────────────
// Matches exactly what your backend's nx.node_link_data() returns

export interface KGNode {
  id: string;           // entity text e.g. "Arjun"
  type: string;         // NER label: PERSON | GPE | ORG | EVENT | etc.
  mentions: string[];   // scene IDs where entity appears
}

export interface KGLink {
  source: string;       // subject entity id
  target: string;       // object entity id
  relation: string;     // verb connecting them e.g. "visited"
  scene_id: string;
  sentence: string;     // original text snippet
}

export interface KnowledgeGraphData {
  directed: boolean;
  multigraph: boolean;
  graph: Record<string, unknown>;
  nodes: KGNode[];
  links: KGLink[];
}

// ─── Positioned node for rendering ───────────────────────────────────────────
export interface PositionedNode extends KGNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ─── API call ─────────────────────────────────────────────────────────────────

/**
 * POST /api/knowledge-graph
 * Sends story content to backend, gets back graph data.
 * Backend runs NLP (spaCy NER + relation extraction) and returns NetworkX node_link_data().
 */
export async function fetchKnowledgeGraph(
  content: string,
  projectId: string
): Promise<KnowledgeGraphData> {
  const res = await fetch(`http://localhost:8000/api/scripts/${projectId}/story_bible`);
  if (!res.ok) throw new Error(await res.text());
  
  const data = await res.json();
  
  return {
    directed: true,
    multigraph: true,
    graph: {},
    nodes: data.nodes || [],
    links: data.links || [],
  };
}