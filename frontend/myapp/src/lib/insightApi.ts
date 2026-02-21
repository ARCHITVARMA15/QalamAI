// ─── Types matching your backend's exact output format ───────────────────────

export interface KGNode {
  id: string;
  type: string;
  mentions: string[];
}

export interface KGLink {
  source: string;
  target: string;
  relation: string;
  scene_id: string;
  sentence: string;
}

export interface KnowledgeGraphData {
  directed: boolean;
  multigraph: boolean;
  graph: Record<string, unknown>;
  nodes: KGNode[];
  links: KGLink[];
}

export interface PersonaTrait {
  attribute: string;
  evidence: string;
}

export interface PersonaNode {
  id: string;
  mentions: number;
  traits: PersonaTrait[];
}

export interface PersonaData {
  story: string;
  nodes: PersonaNode[];
}

// ─── Positioned node for force simulation ────────────────────────────────────
export interface PositionedNode extends KGNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ─── Knowledge Graph API ─────────────────────────────────────────────────────
/**
 * POST /api/knowledge-graph
 * Sends story content → backend runs NLP → returns nx.node_link_data() format
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

// ─── Persona API ─────────────────────────────────────────────────────────────
/**
 * POST /api/personas
 * Sends story content → backend extracts character personas → returns PersonaData[]
 * Backend returns exactly the JSON format shown in requirements (id, mentions, traits[])
 */
export async function fetchPersonas(
  content: string,
  projectId: string
): Promise<PersonaData[]> {
  const res = await fetch(`http://localhost:8000/api/scripts/${projectId}/personas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}