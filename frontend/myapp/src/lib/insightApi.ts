// ─── Types matching your backend's exact output format ───────────────────────

export interface KGNode {
  id: string;
  type: string;
  mentions: string[];
  count?: number;
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
 * 1. POST /api/scripts/{scriptId}/analyze  — runs NLP to build/update story bible
 * 2. GET  /api/scripts/{scriptId}/story_bible — fetches the computed graph
 */
export async function fetchKnowledgeGraph(
  content: string,
  scriptId: string
): Promise<KnowledgeGraphData> {
  // Step 1: Run the analyze endpoint to process the text and update the story bible
  const analyzeRes = await fetch(`http://localhost:8000/api/scripts/${scriptId}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: content }),
  });
  if (!analyzeRes.ok) throw new Error(await analyzeRes.text());

  // Step 2: Fetch the updated knowledge graph
  const res = await fetch(`http://localhost:8000/api/scripts/${scriptId}/story_bible`);
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
 * POST /api/scripts/{scriptId}/personas
 * Sends story content → backend extracts character personas → returns PersonaData[]
 */
export async function fetchPersonas(
  content: string,
  scriptId: string
): Promise<PersonaData[]> {
  const res = await fetch(`http://localhost:8000/api/scripts/${scriptId}/personas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}