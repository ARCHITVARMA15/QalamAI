/**
 * API Service Layer
 * All backend calls go through here. When your backend is ready,
 * replace the mock implementations with real fetch() calls.
 *
 * Backend team: expected endpoints are documented on each function.
 */

export interface AIRequest {
  action: "write" | "rewrite" | "describe" | "brainstorm" | "chat" | "enhance" | "tone" | "shorten" | "expand" | "summarize";
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

  // All other actions — routed to Groq-powered /api/ai/action endpoint
  const res = await fetch(`http://localhost:8000/api/ai/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: req.action,
      content: req.content,
      context: req.context || "",
      tone: req.tone || "formal",
      genre: req.genre || "",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
  context: string,
  mode: string = "Standard"
): Promise<ChatMessage> {
  const res = await fetch(`http://localhost:8000/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, projectId, scriptId, context, mode }),
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

// ─── Comic Image Generation ─────────────────────────────────────────────────

export interface ComicResult {
  status: string;
  image_base64: string;
  prompt_used: string;
  source_text: string;
}

/**
 * POST /api/scripts/:scriptId/generate-comic
 * Sends selected text to Imagen 4.0 and returns a comic-style image as base64.
 */
export async function generateComicImage(scriptId: string, selectedText: string): Promise<ComicResult> {
  const res = await fetch(`http://localhost:8000/api/scripts/${scriptId}/generate-comic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selected_text: selectedText }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Plot Tweak ─────────────────────────────────────────────────────────────

export interface TweakPlotResponse {
  result: string;
  warnings: string[];
  changes: { type: string; description: string }[];
}

/**
 * POST /api/analysis/tweak-plot
 * Rewrites a passage to apply a retroactive plot change,
 * grounded in the Knowledge Graph to avoid new contradictions.
 */
export async function tweakPlot(
  scriptId: string,
  originalText: string,
  tweakInstruction: string,
): Promise<TweakPlotResponse> {
  const res = await fetch(`http://localhost:8000/api/analysis/tweak-plot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script_id: scriptId,
      original_text: originalText,
      tweak_instruction: tweakInstruction,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Writing Mode — Auto-Suggest Tweaks ────────────────────────────────────

export interface AutoSuggestResponse {
  suggestions: string[];
  changes: { type: string; description: string }[];
}

/**
 * POST /api/analysis/auto-suggest-tweaks
 * Proactively scans the writer's recent output against the story bible
 * and returns up to 4 specific continuity/consistency suggestions.
 */
export async function autoSuggestTweaks(
  scriptId: string,
  recentText: string,
): Promise<AutoSuggestResponse> {
  const res = await fetch(`http://localhost:8000/api/analysis/auto-suggest-tweaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script_id: scriptId,
      recent_text: recentText,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}