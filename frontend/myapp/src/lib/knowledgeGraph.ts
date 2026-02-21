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
  // TODO: Uncomment when backend is ready
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-graph`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ content, projectId }),
  // });
  // if (!res.ok) throw new Error(await res.text());
  // return res.json();

  // ─── Mock response matching your backend's nx.node_link_data() format ───
  await new Promise(r => setTimeout(r, 1400));

  // Dynamically extract some "names" from content for realistic mock
  const words = content.split(/\s+/).filter(w => w.length > 3 && /^[A-Z]/.test(w));
  const uniqueNames = [...new Set(words)].slice(0, 6);
  const names = uniqueNames.length >= 2 ? uniqueNames : ["Elena", "Marcus", "Delhi", "Council", "Amir", "Priya"];

  const nodeTypes: Record<string, string> = {
    0: "PERSON", 1: "PERSON", 2: "GPE", 3: "ORG", 4: "PERSON", 5: "GPE",
  };

  const nodes: KGNode[] = names.map((name, i) => ({
    id: name.replace(/[^a-zA-Z]/g, ""),
    type: nodeTypes[i % 6] || "PERSON",
    mentions: [`scene_${Math.ceil((i + 1) / 2)}`, `scene_${Math.ceil((i + 2) / 2)}`],
  }));

  const relations = ["visited", "met", "confronted", "allied with", "betrayed", "discovered", "fled from", "leads"];
  const links: KGLink[] = [];
  nodes.forEach((n, i) => {
    if (i < nodes.length - 1) {
      links.push({
        source: n.id,
        target: nodes[(i + 1) % nodes.length].id,
        relation: relations[i % relations.length],
        scene_id: `scene_${i + 1}`,
        sentence: `${n.id} ${relations[i % relations.length]} ${nodes[(i + 1) % nodes.length].id}.`,
      });
    }
    if (i % 2 === 0 && i + 2 < nodes.length) {
      links.push({
        source: n.id,
        target: nodes[i + 2].id,
        relation: relations[(i + 3) % relations.length],
        scene_id: `scene_${i + 2}`,
        sentence: `${n.id} ${relations[(i + 3) % relations.length]} ${nodes[i + 2].id}.`,
      });
    }
  });

  return { directed: true, multigraph: true, graph: {}, nodes, links };
}