/**
 * API Service Layer
 * All backend calls go through here. When your backend is ready,
 * replace the mock implementations with real fetch() calls.
 *
 * Backend team: expected endpoints are documented on each function.
 */

export interface AIRequest {
  action: "write" | "rewrite" | "describe" | "brainstorm" | "chat" | "enhance" | "tone";
  content: string;
  projectId: string;
  context?: string;       // surrounding text for consistency
  tone?: string;          // e.g. "formal", "casual", "dramatic"
  genre?: string;
  instructions?: string;  // user-provided instructions
}

export interface AIResponse {
  result: string;
  changes?: ChangeExplanation[];
  suggestions?: string[];
  tokensUsed?: number;
}

export interface ChangeExplanation {
  type: "structure" | "clarity" | "flow" | "tone" | "consistency";
  description: string;
  before?: string;
  after?: string;
}

export interface UploadResponse {
  fileId: string;
  fileName: string;
  extractedText: string;
  fileType: string;
  url?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ─── Mock delay helper ───────────────────────────────────────────────────────
const mockDelay = (ms = 1200) => new Promise((res) => setTimeout(res, ms));

// ─── AI Actions ──────────────────────────────────────────────────────────────

/**
 * POST /api/ai/action
 * Performs AI writing actions (write, rewrite, describe, brainstorm, enhance, tone)
 */
export async function callAIAction(req: AIRequest): Promise<AIResponse> {
  if (req.action === "enhance") {
    const res = await fetch(`http://localhost:8000/api/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: req.content }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  if (req.action === "tone") {
    const res = await fetch(`http://localhost:8000/api/transform-style`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: req.content, tone: req.tone || "formal" }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  await mockDelay();

  const mocks: Record<string, AIResponse> = {
    write: {
      result: `The morning sun cast long shadows across the cobblestones as Elena stepped from the doorway. She pulled her coat tighter, aware of the eyes that followed her — the city always watched those who didn't belong. Three days. That was all she had before the council made their decision, before everything she'd built here crumbled to dust.\n\nShe reached into her pocket and felt the edge of the letter. Still there. Still real.`,
      changes: [{ type: "structure", description: "Added narrative hook and time pressure to create immediate tension" }],
    },
    rewrite: {
      result: req.content
        ? `${req.content.split(" ").slice(0, 8).join(" ")} — though perhaps that framing deserves a second look. Consider instead: the scene opens with movement, with urgency, the character already mid-action rather than observed from outside.`
        : "Please select text to rewrite.",
      changes: [
        { type: "clarity", description: "Shifted from passive to active voice" },
        { type: "flow", description: "Restructured sentence rhythm for better pacing" },
      ],
    },
    describe: {
      result: `The room smelled of old paper and something sharper — chemical, almost medicinal. Light filtered through shuttered blinds in pale stripes. Every surface held its own archaeology: stacked journals, a cracked leather chair, a mug with a dark ring at its base. The kind of space where time moved differently, or didn't move at all.`,
      changes: [{ type: "clarity", description: "Used sensory details across smell, sight, and texture to build atmosphere" }],
    },
    brainstorm: {
      result: "",
      suggestions: [
        "What if the antagonist genuinely believes they're the hero of this story?",
        "Introduce a ticking clock: the protagonist has 48 hours before an irreversible event.",
        "Add a morally ambiguous ally whose loyalty shifts based on their own hidden agenda.",
        "The setting itself could become a character — a city that remembers, a house that forgets.",
        "Consider a non-linear timeline where the ending is revealed at the midpoint.",
      ],
    },
    chat: {
      result: "That's an interesting direction for your story. Based on what you've written so far, I'd suggest developing the secondary characters more — they can act as mirrors for your protagonist's internal conflict. Would you like me to suggest some character dynamics?",
    },
  };

  return mocks[req.action] || { result: "Action not recognized." };
}

/**
 * POST /api/upload
 * Uploads file and returns extracted text + metadata
 */
export async function uploadFile(file: File, projectId: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`http://localhost:8000/api/projects/${projectId}/scripts/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  let extractedText = "";
  if (data.script_ids && data.script_ids.length > 0) {
    const scriptRes = await fetch(`http://localhost:8000/api/scripts/${data.script_ids[0]}`);
    if (scriptRes.ok) {
      const scriptData = await scriptRes.json();
      extractedText = scriptData.content;
    }
  }

  return {
    fileId: data.script_ids?.[0] || `file_${Date.now()}`,
    fileName: data.title || file.name,
    extractedText: extractedText || `[Uploaded ${file.name}]`,
    fileType: file.type,
  };
}

/**
 * POST /api/chat
 * Sends a chat message and returns AI response
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  projectId: string,
  scriptId: string,
  context: string
): Promise<ChatMessage> {
  const res = await fetch(`http://localhost:8000/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, projectId, scriptId, context }),
  });
  
  if (!res.ok) throw new Error(await res.text());
  
  const data = await res.json();
  
  return { role: "assistant", content: data.reply, timestamp: Date.now() };
}

/**
 * PATCH /api/projects/:id
 * Saves project content
 */
export async function saveProject(scriptId: string, content: string, wordCount: number): Promise<void> {
  const res = await fetch(`http://localhost:8000/api/scripts/${scriptId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    console.error("Failed to autosave to backend", await res.text());
  }
}