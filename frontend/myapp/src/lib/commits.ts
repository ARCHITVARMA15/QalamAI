// ─── Commit Tracking System ───────────────────────────────────────────────────
// Runs in localStorage. Backend-ready: replace localStorage with API (see TODOs).

export type CommitType =
  | "write" | "rewrite" | "describe" | "brainstorm"
  | "enhance" | "tone" | "manual" | "upload"
  | "create" | "rename" | "insight" | "tweak-plot";

export interface Commit {
  id: string;
  projectId: string;
  projectTitle: string;
  projectEmoji: string;
  type: CommitType;
  message: string;
  wordsBefore: number;
  wordsAfter: number;
  wordDelta: number;
  timestamp: number;
  sessionId: string;
  snippet?: string;
}

export interface DayActivity {
  date: string;
  count: number;
  commits: Commit[];
}

const COMMITS_KEY = "writeai_commits";
const SESSION_KEY = "writeai_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function recordCommit(params: {
  projectId: string;
  projectTitle: string;
  projectEmoji: string;
  type: CommitType;
  message: string;
  wordsBefore: number;
  wordsAfter: number;
  snippet?: string;
}): Commit {
  // TODO: POST `${process.env.NEXT_PUBLIC_API_URL}/api/commits` when backend ready
  const commit: Commit = {
    id: `commit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...params,
    wordDelta: params.wordsAfter - params.wordsBefore,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };
  const existing = getAllCommits();
  existing.unshift(commit);
  localStorage.setItem(COMMITS_KEY, JSON.stringify(existing.slice(0, 2000)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("writeai:commit", { detail: commit }));
  }
  return commit;
}

export function getAllCommits(): Commit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMMITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function buildHeatmapData(): DayActivity[] {
  const commits = getAllCommits();
  const map = new Map<string, Commit[]>();
  const today = new Date();
  const days: string[] = [];
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(key);
    map.set(key, []);
  }
  commits.forEach((c) => {
    const key = new Date(c.timestamp).toISOString().slice(0, 10);
    if (map.has(key)) map.get(key)!.push(c);
  });
  return days.map((date) => ({
    date,
    count: map.get(date)?.length || 0,
    commits: map.get(date) || [],
  }));
}

export function getDashboardStats() {
  const commits = getAllCommits();
  const projects = new Set(commits.map((c) => c.projectId));
  const totalWords = commits.reduce((s, c) => s + Math.max(0, c.wordDelta), 0);
  const now = Date.now();
  const thisWeek = commits.filter((c) => c.timestamp > now - 7 * 86400000).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = commits.filter((c) => new Date(c.timestamp).toISOString().slice(0, 10) === todayStr).length;

  const heatmap = buildHeatmapData();
  let streak = 0, maxStreak = 0, cur = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].count > 0) { cur++; }
    else { if (i >= heatmap.length - 2) streak = cur; maxStreak = Math.max(maxStreak, cur); cur = 0; }
  }
  maxStreak = Math.max(maxStreak, cur);
  if (streak === 0 && heatmap[heatmap.length - 1]?.count > 0) streak = cur;

  const pm = new Map<string, { title: string; emoji: string; commits: number; words: number; lastActive: number }>();
  commits.forEach((c) => {
    if (!pm.has(c.projectId)) pm.set(c.projectId, { title: c.projectTitle, emoji: c.projectEmoji, commits: 0, words: 0, lastActive: 0 });
    const p = pm.get(c.projectId)!;
    p.commits++; p.words += Math.max(0, c.wordDelta);
    if (c.timestamp > p.lastActive) p.lastActive = c.timestamp;
  });

  const typeCounts: Record<string, number> = {};
  commits.forEach((c) => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });

  return {
    totalCommits: commits.length,
    totalProjects: projects.size,
    totalWordsWritten: totalWords,
    thisWeekCommits: thisWeek,
    todayCommits: todayCount,
    currentStreak: streak,
    longestStreak: maxStreak,
    projectBreakdown: [...pm.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.commits - a.commits),
    typeCounts,
  };
}

export const COMMIT_META: Record<CommitType, { label: string; color: string; bg: string }> = {
  write:      { label: "Write",      color: "#1a7a5e", bg: "rgba(26,122,94,0.12)"   },
  rewrite:    { label: "Rewrite",    color: "#c96a3b", bg: "rgba(201,106,59,0.12)"  },
  describe:   { label: "Describe",   color: "#7c5cbf", bg: "rgba(124,92,191,0.12)"  },
  brainstorm: { label: "Brainstorm", color: "#c9a83b", bg: "rgba(201,168,59,0.12)"  },
  enhance:    { label: "Enhance",    color: "#3b82c9", bg: "rgba(59,130,201,0.12)"  },
  tone:       { label: "Tone",       color: "#c93b6a", bg: "rgba(201,59,106,0.12)"  },
  manual:     { label: "Edit",       color: "#6a6560", bg: "rgba(106,101,96,0.12)"  },
  upload:     { label: "Upload",     color: "#3bc96a", bg: "rgba(59,201,106,0.12)"  },
  create:     { label: "Create",     color: "#1a7a5e", bg: "rgba(26,122,94,0.15)"   },
  rename:     { label: "Rename",     color: "#9e9589", bg: "rgba(158,149,137,0.12)" },
  insight:      { label: "Insight",      color: "#c98c50", bg: "rgba(201,140,80,0.12)"  },
  "tweak-plot":  { label: "Tweak Plot",   color: "#b84fc9", bg: "rgba(184,79,201,0.12)" },
};

export function formatTimeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), dy = Math.floor(d / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Seeds demo data so dashboard looks full on first visit
export function seedDemoCommits(projectId: string, projectTitle: string, projectEmoji: string) {
  const existing = getAllCommits();
  if (existing.some((c) => c.projectId === projectId)) return;
  const types: CommitType[] = ["create","manual","write","rewrite","brainstorm","enhance","tone","manual","write","insight","manual","rewrite","write","enhance","manual"];
  const messages = [
    "Created project","Typed opening paragraph","AI wrote: The forest at dawn",
    "Rewrote Chapter 1 opening","Brainstormed three plot directions","Enhanced descriptive passages",
    "Applied dramatic tone shift","Revised character dialogue","Continued the story arc",
    "Analyzed story knowledge graph","Edited supporting scene","Rewrote climax sequence",
    "Wrote resolution chapter","Enhanced emotional depth","Final polish pass",
  ];
  const now = Date.now();
  const demos: Commit[] = [];
  let wc = 0;
  const activeDays = [...new Set(Array.from({ length: 35 }, () => Math.floor(Math.random() * 90)))].sort((a, b) => b - a);
  let msgIdx = 0;
  activeDays.slice(0, 28).forEach((daysAgo) => {
    const count = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < count; j++) {
      const before = wc;
      const delta = Math.floor(Math.random() * 150) + 15;
      wc += delta;
      const t = types[msgIdx % types.length];
      demos.push({
        id: `demo_${daysAgo}_${j}_${Math.random().toString(36).slice(2,5)}`,
        projectId, projectTitle, projectEmoji,
        type: t, message: messages[msgIdx % messages.length],
        wordsBefore: before, wordsAfter: wc, wordDelta: delta,
        timestamp: now - daysAgo * 86400000 - j * 1800000,
        sessionId: `demo_${daysAgo}`,
        snippet: "The wind carried whispers of forgotten stories across the valley...",
      });
      msgIdx++;
    }
  });
  localStorage.setItem(COMMITS_KEY, JSON.stringify([...demos, ...existing].slice(0, 2000)));
}