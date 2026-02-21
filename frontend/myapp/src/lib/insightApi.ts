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
  // TODO: Uncomment when backend is ready
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-graph`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ content, projectId }),
  // });
  // if (!res.ok) throw new Error(await res.text());
  // return res.json();

  await new Promise((r) => setTimeout(r, 1400));

  const words = content.split(/\s+/).filter((w) => w.length > 3 && /^[A-Z]/.test(w));
  const uniqueNames = [...new Set(words)].slice(0, 7);
  const names =
    uniqueNames.length >= 2
      ? uniqueNames
      : ["Elena", "Marcus", "Delhi", "Council", "Amir", "Priya", "Shadows"];

  const typeMap: Record<number, string> = { 0: "PERSON", 1: "PERSON", 2: "GPE", 3: "ORG", 4: "PERSON", 5: "GPE", 6: "EVENT" };

  const nodes: KGNode[] = names.map((name, i) => ({
    id: name.replace(/[^a-zA-Z]/g, ""),
    type: typeMap[i % 7] || "PERSON",
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
  // TODO: Uncomment when backend is ready
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personas`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ content, projectId }),
  // });
  // if (!res.ok) throw new Error(await res.text());
  // return res.json();

  await new Promise((r) => setTimeout(r, 1600));

  const words = content.split(/\s+/).filter((w) => w.length > 3 && /^[A-Z]/.test(w));
  const chars = [...new Set(words)].slice(0, 5);
  const names = chars.length >= 2 ? chars : ["Elena", "Marcus", "Amir", "Priya", "Council"];

  return [
    {
      story: "Current Project",
      nodes: names.map((name, i) => ({
        id: name.replace(/[^a-zA-Z]/g, ""),
        mentions: Math.floor(Math.random() * 25) + 5,
        traits: [
          { attribute: "Frequency", evidence: `Found ${Math.floor(Math.random() * 25) + 5} times in the narrative.` },
          { attribute: "Type", evidence: "Dynamically identified entity." },
          { attribute: "Role", evidence: i === 0 ? "Primary protagonist driving the main conflict." : i === 1 ? "Antagonist or opposing force in the story." : "Supporting character with significant narrative presence." },
          { attribute: "First Appearance", evidence: `Introduced in scene ${i + 1} of the story.` },
          { attribute: "Connections", evidence: `Connected to ${Math.floor(Math.random() * 4) + 1} other characters.` },
        ],
      })),
    },
  ];
}