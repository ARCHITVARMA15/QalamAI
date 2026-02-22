




"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { callAIAction, saveProject, UploadResponse, generateComicImage, ComicResult, tweakPlot, fetchContradictions, resolveContradiction, Contradiction, generateComicStrip, downloadComicPdf, ComicPanel, orchestrateAnalysis } from "@/lib/api";
import { recordCommit, CommitType } from "@/lib/commits";
import LeftSidebar from "@/components/editor/LeftSidebar";
import RightSidebar from "@/components/editor/RightSidebar";
import EditorToolbar from "@/components/editor/EditorToolbar";
import AIActionBar from "@/components/editor/AIActionBar";
import FileUploadZone from "@/components/editor/FileUploadZone";

interface Project {
  id: string;
  title: string;
  emoji: string;
  description: string;
  genre: string;
  content: string;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

interface AIResult {
  text: string;
  suggestions?: string[];
  changes?: { type: string; description: string }[];
}

// ─── Helper: commit message per AI action ────────────────────────────────────
function getCommitMessage(action: string, selectedText?: string): string {
  const preview = selectedText ? ` "${selectedText.slice(0, 40)}${selectedText.length > 40 ? "…" : ""}"` : "";
  const map: Record<string, string> = {
    write: "AI wrote new content",
    rewrite: `Rewrote passage${preview}`,
    describe: "AI added description",
    brainstorm: "Brainstormed story directions",
    enhance: `Enhanced writing${preview}`,
    tone: "Applied tone transformation",
    shorten: "Shortened passage",
    expand: "Expanded passage",
    summarize: "Summarized section",
    upload: "Uploaded file and extracted content",
    insight: "Ran knowledge graph analysis",
    "tweak-plot": `Retroactive plot tweak${preview}`,
  };
  return map[action] || `Applied ${action}`;
}

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSaved, setIsSaved] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("Untitled");
  const [activeChapterId, setActiveChapterId] = useState("ch-1");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<HTMLElement[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Comic generation state
  const [comicImage, setComicImage] = useState<ComicResult | null>(null);
  const [comicLoading, setComicLoading] = useState(false);

  // Comic STRIP modal state (multi-panel + PDF download)
  const [comicPanels, setComicPanels] = useState<ComicPanel[]>([]);
  const [comicStripLoading, setComicStripLoading] = useState(false);
  const [showComicModal, setShowComicModal] = useState(false);

  // Suggestions from orchestration pipeline
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Alert counts (set after orchestration, cleared when user views Issues/Suggestions tabs)
  const [newIssueCount, setNewIssueCount] = useState(0);
  const [newSuggestionCount, setNewSuggestionCount] = useState(0);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const isResizing = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Sidebar is on the right; width = window.innerWidth - mouseX
      const newWidth = Math.max(280, Math.min(700, window.innerWidth - e.clientX));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => { isResizing.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  // Contradictions (continuity errors) from backend — shown in RightSidebar Issues tab
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  // Ref mirror of activeScriptId so acceptDiff closures always read the latest value
  const activeScriptIdRef = useRef<string | null>(null);
  useEffect(() => { activeScriptIdRef.current = activeScriptId; }, [activeScriptId]);

  // Fetch contradictions when we have a script (and refetch when user requests)
  const refreshContradictions = useCallback(async () => {
    if (!activeScriptId) return;
    try {
      const list = await fetchContradictions(activeScriptId);
      setContradictions(list);
    } catch (e) {
      console.error("Failed to fetch contradictions", e);
      setContradictions([]);
    }
  }, [activeScriptId]);

  useEffect(() => {
    if (activeScriptId) refreshContradictions();
  }, [activeScriptId, refreshContradictions]);

  const lastCommittedWords = useRef(0);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedCreate = useRef(false);

  // ─── Load project from Backend ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${projectId}`)
      .then(res => res.json())
      .then(data => {
        const mappedProject = { ...data, id: data._id || data.id };
        setProject(mappedProject);
        setDocTitle(data.title || "Untitled");
        if (editorRef.current && data.content) {
          editorRef.current.innerHTML = data.content;
          countWords();
        }
      })
      .catch(err => {
        console.error("Project not found", err);
        setNotFound(true);
      });

    fetch(`http://localhost:8000/api/projects/${projectId}/scripts`)
      .then(res => res.json())
      .then(scripts => {
        if (scripts && scripts.length > 0) {
          const latestScript = scripts[0];
          setActiveScriptId(latestScript._id || latestScript.id);
          if (editorRef.current && latestScript.content) {
            editorRef.current.innerHTML = latestScript.content;
            countWords();
          }
        } else if (!activeScriptId) {
          fetch(`http://localhost:8000/api/projects/${projectId}/scripts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled Document", content: "" }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.status === "success" && data.script_id) {
                setActiveScriptId(data.script_id);
              }
            })
            .catch(err => console.error("Failed to init script:", err));
        }
      })
      .catch(err => console.error("Failed to fetch scripts:", err));
  }, [projectId]);

  // ─── Auto-trigger Knowledge Graph Analysis ───────────────────────────────────
  useEffect(() => {
    if (!activeScriptId || !editorRef.current) return;

    // Wait for content to render into the editor ref before analyzing
    const timer = setTimeout(() => {
      const content = editorRef.current?.innerText || "";
      if (content.trim().length > 10) {
        fetch(`http://localhost:8000/api/scripts/${activeScriptId}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content }),
        }).catch(err => console.error("Failed to auto-analyze project:", err));
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeScriptId]);

  // ─── Record "opened project" commit once ────────────────────────────────────
  useEffect(() => {
    if (project && !hasRecordedCreate.current) {
      hasRecordedCreate.current = true;
      const wc = editorRef.current?.innerText.trim().split(/\s+/).filter(Boolean).length || 0;
      lastCommittedWords.current = wc;
      recordCommit({
        projectId: project.id,
        projectTitle: project.title,
        projectEmoji: project.emoji || "📖",
        type: "create",
        message: `Opened: ${project.title}`,
        wordsBefore: 0,
        wordsAfter: wc,
      });
    }
  }, [project]);

  // ─── Word count ──────────────────────────────────────────────────────────────
  const countWords = useCallback(() => {
    const text = editorRef.current?.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    return words;
  }, []);

  // ─── Smart chapter detection ─────────────────────────────────────────────────
  // Threshold: 5,000 words — used for fallback splits AND sub-splitting oversized chapters
  const CHAPTER_WORD_THRESHOLD = 5000;

  const chapters = useMemo(() => {
    const text = editorRef.current?.innerText || "";
    if (!text.trim()) {
      return [{ id: "ch-1", title: "Chapter 1", wordCount: 0, charStart: 0 }];
    }

    // ── 1. Try to detect chapter markers in the text ──────────────────────────
    // Matches patterns like: "Chapter 1", "CHAPTER II", "Chapter One", "chapter 23", etc.
    const chapterPattern = /^[\s]*(?:chapter)\s+(\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:\s*[:\-–—.].*)?$/gim;

    const markers: { title: string; charStart: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = chapterPattern.exec(text)) !== null) {
      // Clean up the matched title
      const rawTitle = match[0].trim();
      // Capitalize nicely: "chapter 1" → "Chapter 1"
      const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      markers.push({ title, charStart: match.index });
    }

    // ── Helper: count words in a substring ────────────────────────────────────
    const countWordsInRange = (start: number, end: number) =>
      text.slice(start, end).trim().split(/\s+/).filter(Boolean).length;

    // ── Helper: sub-split a chapter if it exceeds the threshold ───────────────
    const subSplit = (
      baseId: string,
      baseTitle: string,
      charStart: number,
      charEnd: number,
    ): { id: string; title: string; wordCount: number; charStart: number }[] => {
      const totalWords = countWordsInRange(charStart, charEnd);
      if (totalWords <= CHAPTER_WORD_THRESHOLD) {
        return [{ id: baseId, title: baseTitle, wordCount: totalWords, charStart }];
      }
      // Split into parts of ~CHAPTER_WORD_THRESHOLD words
      const parts: { id: string; title: string; wordCount: number; charStart: number }[] = [];
      let partStart = charStart;
      let partNum = 1;
      while (partStart < charEnd) {
        // Walk forward CHAPTER_WORD_THRESHOLD words from partStart
        let wc = 0;
        let pos = partStart;
        for (; pos < charEnd && wc < CHAPTER_WORD_THRESHOLD; pos++) {
          if (/\s/.test(text[pos]) && pos > partStart && !/\s/.test(text[pos - 1])) {
            wc++;
          }
        }
        const partEnd = pos >= charEnd ? charEnd : pos;
        const partWords = countWordsInRange(partStart, partEnd);
        const suffix = totalWords > CHAPTER_WORD_THRESHOLD ? ` — Part ${partNum}` : "";
        parts.push({
          id: `${baseId}-p${partNum}`,
          title: `${baseTitle}${suffix}`,
          wordCount: partWords,
          charStart: partStart,
        });
        partStart = partEnd;
        partNum++;
      }
      return parts;
    };

    // ── 2. Build chapter list ─────────────────────────────────────────────────
    let result: { id: string; title: string; wordCount: number; charStart: number }[] = [];

    if (markers.length > 0) {
      // ── Marker-based chapters ──────────────────────────────────────────────
      for (let i = 0; i < markers.length; i++) {
        const start = markers[i].charStart;
        const end = i + 1 < markers.length ? markers[i + 1].charStart : text.length;
        const parts = subSplit(`ch-${i + 1}`, markers[i].title, start, end);
        result.push(...parts);
      }

      // If there's content before the first marker, prepend it as "Preamble"
      if (markers[0].charStart > 0) {
        const preambleWords = countWordsInRange(0, markers[0].charStart);
        if (preambleWords > 5) {
          result.unshift({
            id: "ch-preamble",
            title: "Preamble",
            wordCount: preambleWords,
            charStart: 0,
          });
        }
      }
    } else {
      // ── Fallback: word-count-based chapters ────────────────────────────────
      const totalWords = wordCount;
      const totalChapters = Math.max(1, Math.ceil(totalWords / CHAPTER_WORD_THRESHOLD));

      let chStart = 0;
      for (let i = 0; i < totalChapters; i++) {
        const targetWords = CHAPTER_WORD_THRESHOLD;
        let wc = 0;
        let pos = chStart;
        for (; pos < text.length && wc < targetWords; pos++) {
          if (/\s/.test(text[pos]) && pos > chStart && !/\s/.test(text[pos - 1])) {
            wc++;
          }
        }
        const chEnd = i === totalChapters - 1 ? text.length : pos;
        const chapterWords = countWordsInRange(chStart, chEnd);
        result.push({
          id: `ch-${i + 1}`,
          title: totalChapters === 1 ? "Chapter 1" : `Chapter ${i + 1}`,
          wordCount: chapterWords,
          charStart: chStart,
        });
        chStart = chEnd;
      }
    }

    return result;
  }, [wordCount]);

  // ─── Scroll editor to chapter position on click ─────────────────────────────
  const handleChapterClick = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId);
    if (!editorRef.current || !scrollContainerRef.current) return;

    // Find the chapter object to get its charStart
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const container = scrollContainerRef.current;

    if (chapter.charStart === 0) {
      container.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Scroll proportionally based on character position
    const text = editorRef.current.innerText || "";
    const scrollRatio = chapter.charStart / Math.max(text.length, 1);
    container.scrollTo({
      top: scrollRatio * container.scrollHeight,
      behavior: "smooth",
    });
  }, [chapters]);

  // ─── Selection tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      setHasSelection(!!sel && sel.toString().length > 0);
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // ─── Auto-save ───────────────────────────────────────────────────────────────
  const triggerSave = useCallback(() => {
    if (!project || !activeScriptId) return;
    setIsSaved(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      let content = editorRef.current?.innerHTML || "";
      // Strip search highlights before saving (just in case any were left over from before)
      content = content.replace(/<mark class="search-highlight"[^>]*>([\s\S]*?)<\/mark>/gi, "$1");
      const wc = countWords();
      await saveProject(activeScriptId, content, wc);
      setIsSaved(true);
    }, 1500);
  }, [project, countWords, activeScriptId]);

  // ─── Editor input: auto-commit on 10+ word changes ──────────────────────────
  // When Writing Mode is ON, also schedule reactive auto-suggest (debounced on change).
  const handleEditorInput = useCallback(() => {
    countWords();
    triggerSave();

    // Debounced commit: fires 4s after user stops typing
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      if (!project) return;
      const currentWords = editorRef.current?.innerText.trim().split(/\s+/).filter(Boolean).length || 0;
      const delta = currentWords - lastCommittedWords.current;
      if (Math.abs(delta) >= 10) {
        recordCommit({
          projectId: project.id,
          projectTitle: project.title,
          projectEmoji: project.emoji || "📖",
          type: "manual",
          message: delta > 0 ? `Wrote ${delta} words` : `Removed ${Math.abs(delta)} words`,
          wordsBefore: lastCommittedWords.current,
          wordsAfter: currentWords,
          snippet: editorRef.current?.innerText.slice(0, 120),
        });
        lastCommittedWords.current = currentWords;
      }
    }, 4000);

  }, [project, countWords, triggerSave]);

  // ─── Insert text from chat/LLM into editor (at cursor or at end) ─────────────
  const insertTextIntoEditor = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor || !text.trim()) return;
    editor.focus();
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const isInEditor = range && editor.contains(range.commonAncestorContainer);

    const textNode = document.createTextNode(text.trim());
    if (isInEditor && range) {
      range.deleteContents();
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
    } else {
      const endRange = document.createRange();
      endRange.selectNodeContents(editor);
      endRange.collapse(false);
      endRange.insertNode(textNode);
      endRange.setStartAfter(textNode);
      endRange.setEndAfter(textNode);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(endRange);
      }
    }
    triggerSave();
    countWords();
  }, [triggerSave, countWords]);

  // ─── Formatting ──────────────────────────────────────────────────────────────
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  const handleUndo = () => { document.execCommand("undo"); editorRef.current?.focus(); };
  const handleRedo = () => { document.execCommand("redo"); editorRef.current?.focus(); };

  // ─── Search Functionality (Text Node Based) ──────────────────────────────────
  const handleSearchToggle = () => {
    setShowSearch(s => !s);
    if (showSearch) {
      clearSearchHighlights();
    } else {
      setTimeout(() => document.getElementById("search-input")?.focus(), 50);
    }
  };

  const clearSearchHighlights = () => {
    if (!editorRef.current) return;
    const marks = editorRef.current.querySelectorAll("mark.search-highlight");
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize(); // merge adjacent text nodes
      }
    });
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  };

  const applySearchHighlights = () => {
    clearSearchHighlights();
    if (!searchQuery.trim() || searchQuery.trim().length < 2 || !editorRef.current) return;

    const query = searchQuery.trim().toLowerCase();
    const treeWalker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];

    // First, collect all text nodes
    let node;
    while ((node = treeWalker.nextNode())) {
      textNodes.push(node as Text);
    }

    const newMatches: HTMLElement[] = [];

    textNodes.forEach(textNode => {
      let text = textNode.nodeValue || "";
      let index = text.toLowerCase().indexOf(query);

      while (index !== -1 && textNode.parentNode) {
        // Split text node into three parts: before, match, after
        const matchNode = textNode.splitText(index);
        matchNode.splitText(query.length); // The rest of the text becomes a new sibling

        // Wrap the match in a <mark>
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.style.backgroundColor = "#fff3cd"; // Using the user's custom highlight color look
        mark.style.color = "inherit";
        mark.style.padding = "2px 0";
        mark.style.borderRadius = "3px";
        mark.textContent = matchNode.nodeValue;

        if (matchNode.parentNode) {
          matchNode.parentNode.replaceChild(mark, matchNode);
          newMatches.push(mark);
        }

        // Move to the next chunk of text
        textNode = mark.nextSibling as Text;
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) break;
        text = textNode.nodeValue || "";
        index = text.toLowerCase().indexOf(query);
      }
    });

    setSearchMatches(newMatches);
    if (newMatches.length > 0) {
      setCurrentMatchIndex(0);
      focusMatch(0, newMatches);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  const focusMatch = (index: number, matches: HTMLElement[] = searchMatches) => {
    if (matches.length === 0 || index < 0 || index >= matches.length) return;

    // Reset old focus styles
    matches.forEach(m => {
      m.style.backgroundColor = "#fff3cd";
      m.style.outline = "none";
    });

    // Set active focus style
    const active = matches[index];
    active.style.backgroundColor = "#fef08a";
    active.style.outline = "2px solid #047857";

    active.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSearchNext = () => {
    if (searchMatches.length === 0) return applySearchHighlights();

    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    focusMatch(nextIdx);
  };

  const handleSearchPrev = () => {
    if (searchMatches.length === 0) return;

    const prevIdx = currentMatchIndex - 1 < 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIdx);
    focusMatch(prevIdx);
  };

  // Trigger search reliably when query finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSearch) applySearchHighlights();
    }, 400); // debounce
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.shiftKey ? handleSearchPrev() : handleSearchNext();
    }
    if (e.key === "Escape") handleSearchToggle();
  };

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case "b": e.preventDefault(); handleFormat("bold"); break;
        case "i": e.preventDefault(); handleFormat("italic"); break;
        case "u": e.preventDefault(); handleFormat("underline"); break;
        case "z": e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); break;
        case "s": e.preventDefault(); triggerSave(); break;
        case "f": e.preventDefault(); handleSearchToggle(); break;
      }
    }
  };

  // ─── AI Actions ──────────────────────────────────────────────────────────────
  const handleAIAction = useCallback(async (action: string, options?: { tone?: string; instructions?: string }) => {
    if (!project) return;
    setAiLoading(true);
    setAiResult(null);

    const selection = window.getSelection()?.toString() || "";

    // ── Comic generation — uses multi-panel strip + modal ─────────────────
    if (action === "comic") {
      setAiLoading(false);
      if (!selection.trim()) return;
      setComicStripLoading(true);
      setComicPanels([]);
      setShowComicModal(true);
      try {
        const result = await generateComicStrip(activeScriptId || "draft", selection, 4);
        if (result.panels) setComicPanels(result.panels);
      } catch (err) {
        console.error("Comic strip generation failed:", err);
      } finally {
        setComicStripLoading(false);
      }
      return;
    }

    // ── Tweak Plot — retroactive story change with KG grounding ────────────
    if (action === "tweak-plot") {
      const instruction = options?.instructions?.trim();
      if (!instruction) { setAiLoading(false); return; }

      const fullContent = editorRef.current?.innerText || "";
      const originalText = selection || fullContent.split("\n").filter(Boolean).slice(-3).join("\n");
      const wordsBefore = fullContent.trim().split(/\s+/).filter(Boolean).length;

      try {
        const response = await tweakPlot(
          activeScriptId || "draft",
          originalText,
          instruction,
        );

        // Inject the inline diff in the editor (same pattern as rewrite)
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && selection) {
          const range = sel.getRangeAt(0);
          const diffId = "diff-" + Date.now();
          const diffNode = document.createElement("span");
          diffNode.className = "inline-diff-container";
          diffNode.contentEditable = "false";
          diffNode.id = diffId;

          // Build warning badge HTML if contradictions were flagged
          const warningHtml = response.warnings && response.warnings.length > 0
            ? `<span style="display:inline-block;background:#fff3cd;border:1px solid #ffc107;color:#856404;font-size:0.7em;padding:2px 6px;border-radius:4px;margin-left:4px;vertical-align:middle;" title="${response.warnings[0].replace(/"/g, "'").slice(0, 200)}">⚠️ Check continuity</span>`
            : "";

          diffNode.innerHTML = `
            <span class="diff-del" style="background-color:#ffebe9;color:#cf222e;text-decoration:line-through;padding:0.2em;border-radius:3px;margin:0 0.1em;">${selection}</span>
            <span class="diff-add" style="background-color:#dafbe1;color:#1a7f37;padding:0.2em;border-radius:3px;margin:0 0.1em;">${response.result}</span>
            ${warningHtml}
            <span class="diff-actions" style="display:inline-flex;gap:4px;vertical-align:middle;margin-left:6px;">
              <button onclick="window.acceptDiff('${diffId}')" style="background:#2da44e;color:white;border:none;border-radius:4px;padding:2px 6px;font-size:0.7em;cursor:pointer;">✓ Accept</button>
              <button onclick="window.rejectDiff('${diffId}')" style="background:#cf222e;color:white;border:none;border-radius:4px;padding:2px 6px;font-size:0.7em;cursor:pointer;">✕ Reject</button>
            </span>
          `;
          range.deleteContents();
          range.insertNode(diffNode);
        }

        // Record commit
        const wordsAfter = editorRef.current?.innerText.trim().split(/\s+/).filter(Boolean).length || 0;
        recordCommit({
          projectId: project.id, projectTitle: project.title, projectEmoji: project.emoji || "📖",
          type: "tweak-plot", message: getCommitMessage("tweak-plot", selection),
          wordsBefore, wordsAfter, snippet: response.result?.slice(0, 120),
        });
        lastCommittedWords.current = wordsAfter;

        setAiResult({
          text: response.result,
          changes: [
            ...(response.changes || []),
            // Surface any contradiction warnings as a special change entry
            ...(response.warnings && response.warnings.length > 0
              ? [{ type: "consistency", description: `⚠️ Contradiction warning: ${response.warnings[0].slice(0, 150)}` }]
              : []
            ),
          ],
        });
      } catch (err) {
        setAiResult({ text: "Plot tweak failed. Please try again." });
      } finally {
        setAiLoading(false);
      }
      return;
    }

    const fullContent = editorRef.current?.innerText || "";
    const wordsBefore = fullContent.trim().split(/\s+/).filter(Boolean).length;

    try {
      const response = await callAIAction({
        action: action as "write" | "rewrite" | "describe" | "brainstorm" | "chat" | "enhance" | "tone",
        content: selection || fullContent,
        projectId: project.id,
        context: fullContent.slice(0, 500),
        tone: options?.tone,
        genre: project.genre,
      });

      // Insert text for write action
      if (action === "write" && response.result) {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.collapse(false);
          const textNode = document.createTextNode("\n\n" + response.result);
          range.insertNode(textNode);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          editorRef.current!.innerHTML += `<p>${response.result}</p>`;
        }
        triggerSave();
      } else if ((action === "rewrite" || action === "enhance" || action === "tone") && response.result && selection) {
        // INLINE DIFF VIEWER LOGIC
        // Instead of directly replacing or just showing in the sidebar, we inject an inline diff component approach
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const diffId = "diff-" + Date.now();

          // Create the diff container
          const diffNode = document.createElement("span");
          diffNode.className = "inline-diff-container";
          diffNode.contentEditable = "false";
          diffNode.id = diffId;

          // The diff HTML looks like: [Deleted text in red strikethrough] [New text in green]
          diffNode.innerHTML = `
            <span class="diff-del" style="background-color: #ffebe9; color: #cf222e; text-decoration: line-through; padding: 0.2em; border-radius: 3px; margin: 0 0.1em;">${selection}</span>
            <span class="diff-add" style="background-color: #dafbe1; color: #1a7f37; padding: 0.2em; border-radius: 3px; margin: 0 0.1em;">${response.result}</span>
            <span class="diff-actions" style="display: inline-flex; gap: 4px; vertical-align: middle; margin-left: 6px;">
              <button onclick="window.acceptDiff('${diffId}')" style="background: #2da44e; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.7em; cursor: pointer;">✓ Accept</button>
              <button onclick="window.rejectDiff('${diffId}')" style="background: #cf222e; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.7em; cursor: pointer;">✕ Reject</button>
            </span>
          `;

          range.deleteContents();
          range.insertNode(diffNode);

          // Register the global functions for the inline buttons if not already registered
          if (!(window as any).acceptDiff) {
            (window as any).acceptDiff = (id: string) => {
              const node = document.getElementById(id);
              if (node) {
                const addedText = node.querySelector('.diff-add')?.textContent || '';
                const textNode = document.createTextNode(addedText);
                node.parentNode?.replaceChild(textNode, node);
                // Trigger save after accepting so the document is persisted immediately
                triggerSave();
                // Re-analyse the full document to keep the Knowledge Graph in sync
                const content = editorRef.current?.innerText || "";
                // Use ref so this closure always reads the latest script ID
                const scriptId = activeScriptIdRef.current;
                if (scriptId && content.trim().length > 10) {
                  fetch(`http://localhost:8000/api/scripts/${scriptId}/analyze`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: content }),
                  }).catch(err => console.error("KG re-analysis after accept failed:", err));
                }
              }
            };
            (window as any).rejectDiff = (id: string) => {
              const node = document.getElementById(id);
              if (node) {
                const delText = node.querySelector('.diff-del')?.textContent || '';
                const textNode = document.createTextNode(delText);
                node.parentNode?.replaceChild(textNode, node);
              }
            };
          }
        }
      }

      // ── Record commit for this AI action ──────────────────────────────────
      const wordsAfter = editorRef.current?.innerText.trim().split(/\s+/).filter(Boolean).length || 0;
      recordCommit({
        projectId: project.id,
        projectTitle: project.title,
        projectEmoji: project.emoji || "📖",
        type: action as CommitType,
        message: getCommitMessage(action, selection),
        wordsBefore,
        wordsAfter,
        snippet: response.result?.slice(0, 120),
      });
      lastCommittedWords.current = wordsAfter;

      setAiResult({
        text: response.result,
        suggestions: response.suggestions,
        changes: response.changes,
      });
    } catch (err) {
      setAiResult({ text: "Something went wrong. Please try again." });
    } finally {
      setAiLoading(false);
    }
  }, [project, triggerSave]);

  // ─── File upload handler ─────────────────────────────────────────────────────
  const handleFileUpload = useCallback((file: UploadResponse) => {
    setUploadedFiles(prev => [file, ...prev]);
    if (file.fileId && !file.fileId.startsWith("file_")) {
      setActiveScriptId(file.fileId);
    }
    if (file.extractedText && editorRef.current) {
      const wordsBefore = editorRef.current.innerText.trim().split(/\s+/).filter(Boolean).length;
      editorRef.current.innerHTML += `<hr/><p><strong>📎 ${file.fileName}</strong></p><p>${file.extractedText}</p>`;
      triggerSave();
      const wordsAfter = countWords();

      // Record upload commit
      if (project) {
        recordCommit({
          projectId: project.id,
          projectTitle: project.title,
          projectEmoji: project.emoji || "📖",
          type: "upload",
          message: `Uploaded: ${file.fileName}`,
          wordsBefore,
          wordsAfter,
          snippet: file.extractedText.slice(0, 120),
        });
        lastCommittedWords.current = wordsAfter;
      }
    }
  }, [project, triggerSave, countWords]);

  // ─── Not found / loading states ──────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#fef6ee", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "3rem" }}>🔍</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "#1a1510" }}>Project not found</h2>
        <button onClick={() => router.push("/projects")} style={{ padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none", background: "#047857", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#fef6ee" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e8e2d9", borderTopColor: "#047857", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #fef6ee; }
        .editor-content { outline: none; min-height: 60vh; font-weight: 400; }
        .editor-content:empty::before { content: 'Type here…'; color: #b8b0a4; font-style: italic; font-weight: 400; }
        .editor-content h1 { font-family: 'DM Serif Display', serif; font-size: 2rem; margin-bottom: 1rem; font-weight: normal; }
        .editor-content h2 { font-family: 'DM Serif Display', serif; font-size: 1.5rem; margin-bottom: 0.75rem; font-weight: normal; }
        .editor-content h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: normal; }
        .editor-content p { margin-bottom: 1rem; }
        .editor-content ul, .editor-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .editor-content li { margin-bottom: 0.25rem; }
        .editor-content hr { border: none; border-top: 1px solid #e8e2d9; margin: 1.5rem 0; }
        .editor-content::selection, .editor-content *::selection { background: rgba(4,120,87,0.2); color: inherit; }
        .editor-content::-moz-selection, .editor-content *::-moz-selection { background: rgba(4,120,87,0.2); color: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes stuckPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(4,120,87,0); } 50% { box-shadow: 0 0 12px 2px rgba(4,120,87,0.15); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
        
        .inline-diff-container { display: inline; position: relative; }
        .inline-diff-container .diff-actions button:hover { opacity: 0.85; transform: scale(1.05); }
      `}</style>

      {/* ── Top Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center",
        padding: "0 1.5rem", height: "52px",
        background: "rgba(254,246,238,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8e2d9",
        position: "sticky", top: 0, zIndex: 50, gap: "0.75rem",
      }}>
        <button
          onClick={() => router.push("/projects")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#9e9589", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", padding: "0.35rem 0.6rem", borderRadius: "7px", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f0ebe3"; e.currentTarget.style.color = "#1a1510"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9e9589"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>

        <div style={{ width: "1px", height: "20px", background: "#e8e2d9" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1rem" }}>{project.emoji}</span>
          <span style={{
            fontFamily: "'DM Serif Display', serif", fontSize: "0.95rem", color: "#1a1510",
            borderBottom: "2px solid #047857", paddingBottom: "2px",
          }}>{project.title}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Insight button */}
        <button
          onClick={() => router.push(`/projects/${projectId}/insight`)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", color: "#4a4540", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#047857"; e.currentTarget.style.color = "#047857"; e.currentTarget.style.background = "rgba(4,120,87,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; e.currentTarget.style.background = "#fff"; }}
        >
          🕸️ Insight
        </button>


        <button onClick={() => router.push(`/projects/${projectId}/video`)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", color: "#4a4540", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#047857"; e.currentTarget.style.color = "#047857"; e.currentTarget.style.background = "rgba(4,120,87,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; e.currentTarget.style.background = "#fff"; }}
        >
          🎬 Video
        </button>

        {/* Stuck? button */}
        <button
          onClick={() => router.push(`/projects/${projectId}/stuck`)}
          title="Get More Ideas"
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.4rem 0.9rem", borderRadius: "8px",
            border: "1.5px solid rgba(4,120,87,0.3)",
            background: "linear-gradient(135deg, rgba(4,120,87,0.06), rgba(4,120,87,0.02))",
            color: "#047857",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
            animation: "stuckPulse 2.5s ease-in-out infinite",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(4,120,87,0.1)"; e.currentTarget.style.borderColor = "#047857"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(4,120,87,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(4,120,87,0.06), rgba(4,120,87,0.02))"; e.currentTarget.style.borderColor = "rgba(4,120,87,0.3)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          🧠 Stuck?
        </button>

        {/* Dashboard button */}
        {/* <button
          onClick={() => {
            // Record a manual commit snapshot before navigating
            if (project) {
              const wc = editorRef.current?.innerText.trim().split(/\s+/).filter(Boolean).length || 0;
              if (wc !== lastCommittedWords.current) {
                recordCommit({
                  projectId: project.id,
                  projectTitle: project.title,
                  projectEmoji: project.emoji || "📖",
                  type: "manual",
                  message: `Session snapshot — ${wc} words`,
                  wordsBefore: lastCommittedWords.current,
                  wordsAfter: wc,
                  snippet: editorRef.current?.innerText.slice(0, 120),
                });
              }
            }
            router.push(`/projects/${projectId}/dashboard`);
          }}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", color: "#4a4540", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#c98c50"; e.currentTarget.style.color = "#c98c50"; e.currentTarget.style.background = "rgba(201,140,80,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; e.currentTarget.style.background = "#fff"; }}
        >
          📊 Dashboard
        </button> */}

        {/* Upload button */}
        <button
          onClick={() => setShowUploadPanel(!showUploadPanel)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: showUploadPanel ? "1.5px solid #047857" : "1.5px solid #e8e2d9", background: showUploadPanel ? "rgba(4,120,87,0.06)" : "#fff", color: showUploadPanel ? "#047857" : "#4a4540", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
        </button>

        <span style={{ fontSize: "0.78rem", color: "#9e9589" }}>{wordCount.toLocaleString()} words</span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: isSaved ? "#27ae60" : "#9e9589" }}>
          {isSaved
            ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>Saved</>
            : <><div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "2px solid #9e9589", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />Saving…</>
          }
        </div>

        <button style={{ width: "30px", height: "30px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#9e9589", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </nav>

      {/* ── Body: 3-column layout ── */}
      <div style={{ display: "flex", height: "calc(100vh - 52px)", overflow: "hidden" }}>

        <LeftSidebar
          projectTitle={project.title}
          projectEmoji={project.emoji}
          onBack={() => router.push("/projects")}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          chapters={chapters}
          activeChapterId={activeChapterId}
          onChapterClick={handleChapterClick}
        />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <AIActionBar
            onAction={handleAIAction}
            loading={aiLoading}
            hasSelection={hasSelection}
          />

          {showUploadPanel && (
            <div style={{ padding: "1rem 2rem", borderBottom: "1px solid #e8e2d9", background: "#fef6ee", animation: "fadeUp 0.2s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510" }}>Upload Files</h3>
                <p style={{ fontSize: "0.75rem", color: "#9e9589" }}>Extracted text will be inserted into your document</p>
              </div>
              <FileUploadZone projectId={projectId} onUpload={handleFileUpload} />
            </div>
          )}

          <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
            <div style={{
              background: "#fff", borderRadius: "16px", position: "relative",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)",
              padding: "2rem 2.5rem", minHeight: "calc(100% - 1rem)",
            }}>

              {/* Floating Search Bar */}
              {showSearch && (
                <div style={{
                  position: "absolute", top: "16px", right: "24px", zIndex: 10,
                  display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e8e2d9",
                  borderRadius: "8px", padding: "4px 8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  animation: "fadeUp 0.2s ease"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9e9589" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    id="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Find in document..."
                    style={{ border: "none", outline: "none", width: "160px", fontSize: "0.85rem", color: "#1a1510", fontFamily: "'DM Sans', sans-serif" }}
                  />
                  {searchMatches.length > 0 && (
                    <span style={{ fontSize: "0.75rem", color: "#9e9589", marginRight: "8px" }}>
                      {currentMatchIndex + 1}/{searchMatches.length}
                    </span>
                  )}
                  <div style={{ display: "flex", gap: "2px", borderLeft: "1px solid #e8e2d9", paddingLeft: "6px", marginLeft: "4px" }}>
                    <button onClick={handleSearchPrev} title="Find Previous (Shift+Enter)" style={{ background: "none", border: "none", cursor: "pointer", color: "#4a4540", padding: "2px" }}>⬆</button>
                    <button onClick={handleSearchNext} title="Find Next (Enter)" style={{ background: "none", border: "none", cursor: "pointer", color: "#4a4540", padding: "2px" }}>⬇</button>
                    <button onClick={handleSearchToggle} title="Close (Esc)" style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9589", padding: "2px", marginLeft: "4px" }}>✕</button>
                  </div>
                </div>
              )}

              <input
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="Untitled"
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "'DM Serif Display', serif", fontSize: "2rem", letterSpacing: "-0.03em", color: "#1a1510", marginBottom: "0.5rem", caretColor: "#047857" }}
              />

              {aiResult?.suggestions && aiResult.suggestions.length > 0 && (
                <div style={{ padding: "1rem 1.25rem", borderRadius: "12px", background: "#fffbf0", border: "1px solid #f5e6a3", marginBottom: "1.5rem", animation: "fadeUp 0.3s ease both" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9e6800", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                    💡 Brainstorm Ideas
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {aiResult.suggestions.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (editorRef.current && project) {
                            const wordsBefore = editorRef.current.innerText.trim().split(/\s+/).filter(Boolean).length;
                            editorRef.current.innerHTML += `<p>${s}</p>`;
                            const wordsAfter = editorRef.current.innerText.trim().split(/\s+/).filter(Boolean).length;
                            triggerSave();
                            recordCommit({
                              projectId: project.id,
                              projectTitle: project.title,
                              projectEmoji: project.emoji || "📖",
                              type: "brainstorm",
                              message: `Inserted brainstorm idea`,
                              wordsBefore,
                              wordsAfter,
                              snippet: s.slice(0, 120),
                            });
                            lastCommittedWords.current = wordsAfter;
                          }
                        }}
                        style={{ padding: "0.55rem 0.75rem", borderRadius: "8px", background: "#fff", border: "1px solid #f0e6a0", fontSize: "0.83rem", color: "#1a1510", cursor: "pointer", transition: "all 0.15s", lineHeight: 1.5 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#047857"; e.currentTarget.style.background = "#fffaf0"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0e6a0"; e.currentTarget.style.background = "#fff"; }}
                      >
                        {s}
                        <span style={{ fontSize: "0.7rem", color: "#047857", marginLeft: "0.5rem" }}>↗ Insert</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setAiResult(null)} style={{ marginTop: "0.5rem", background: "none", border: "none", fontSize: "0.72rem", color: "#9e9589", cursor: "pointer" }}>
                    Dismiss
                  </button>
                </div>
              )}

              {aiLoading && (
                <div style={{ padding: "1rem 1.25rem", borderRadius: "12px", background: "#fef6ee", border: "1px solid #e8e2d9", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", animation: "pulse 1.5s ease infinite" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2.5px solid #e8e2d9", borderTopColor: "#047857", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.83rem", color: "#9e9589" }}>AI is thinking…</span>
                </div>
              )}

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="editor-content"
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", lineHeight: 1.85, color: "#1a1510", caretColor: "#047857", minHeight: "60vh", outline: "none" }}
              />
            </div>
          </div>

          <EditorToolbar
            wordCount={wordCount}
            isSaved={isSaved}
            onFormat={handleFormat}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSearch={handleSearchToggle}
          />
        </main>

        {/* ── Resize Handle ── */}
        <div
          onMouseDown={() => {
            isResizing.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          style={{
            width: "5px", flexShrink: 0, cursor: "col-resize",
            background: "transparent",
            transition: "background 0.15s",
            zIndex: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#047857"; }}
          onMouseLeave={e => { if (!isResizing.current) e.currentTarget.style.background = "transparent"; }}
        />

        <RightSidebar
          projectId={projectId}
          scriptId={activeScriptId}
          editorContent={editorRef.current?.innerText || ""}
          aiResult={aiResult && !aiResult.suggestions ? aiResult : null}
          onClearResult={() => setAiResult(null)}
          contradictions={contradictions}
          onResolveContradiction={async (contraId) => {
            await resolveContradiction(contraId);
            refreshContradictions();
          }}
          onRefreshContradictions={refreshContradictions}
          suggestions={suggestions}
          onClearSuggestions={() => setSuggestions([])}
          onInsertIntoEditor={insertTextIntoEditor}
          newIssueCount={newIssueCount}
          newSuggestionCount={newSuggestionCount}
          onDismissAlerts={() => { setNewIssueCount(0); setNewSuggestionCount(0); }}
          width={sidebarWidth}
          onAfterSend={(message) => {
            if (!activeScriptId) return;
            const storyContent = editorRef.current?.innerText || "";
            const textToCheck = storyContent.trim() ? storyContent : message;
            orchestrateAnalysis(activeScriptId, textToCheck, true, message)
              .then(res => {
                if (res.issues?.length > 0) {
                  setContradictions(res.issues);
                  setNewIssueCount(res.issues.length);
                }
                if (res.suggestions?.length > 0) {
                  setSuggestions(res.suggestions);
                  setNewSuggestionCount(res.suggestions.length);
                }
              })
              .catch(err => console.error("Background orchestration failed:", err));
          }}
        />
      </div>

      {/* ── Comic Strip Modal (outside right sidebar) ── */}
      {showComicModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeUp 0.2s ease both",
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowComicModal(false); }}
        >
          <div style={{
            background: "#fef6ee", borderRadius: "20px",
            width: "90vw", maxWidth: "900px", maxHeight: "85vh",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.25rem 1.5rem", borderBottom: "1px solid #e8e2d9",
            }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem", color: "#1a1510", marginBottom: "0.15rem" }}>
                  🖼️ Comic Strip
                </h2>
                <p style={{ fontSize: "0.78rem", color: "#9e9589" }}>
                  {comicStripLoading ? "Generating panels…" : `${comicPanels.length} panel${comicPanels.length !== 1 ? "s" : ""} generated`}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {/* PDF Download button */}
                {comicPanels.length > 0 && !comicStripLoading && (
                  <button
                    onClick={async () => {
                      try {
                        const blob = await downloadComicPdf(activeScriptId || "draft", comicPanels, project?.title || "Comic Strip");
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${project?.title || "comic-strip"}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error("PDF download failed:", err);
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.5rem 1rem", borderRadius: "10px",
                      border: "none", background: "#047857", color: "#fff",
                      fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </button>
                )}
                {/* Close button */}
                <button
                  onClick={() => setShowComicModal(false)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    border: "none", background: "transparent", color: "#9e9589",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal body — panels grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
              {comicStripLoading && (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎨</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "3px solid #e8e2d9", borderTopColor: "#047857", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: "0.9rem", color: "#9e9589" }}>Generating comic panels… this may take 30–60 seconds</span>
                  </div>
                </div>
              )}

              {comicPanels.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: comicPanels.length === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: "1rem",
                }}>
                  {comicPanels.map((panel, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#fff", borderRadius: "12px",
                        border: "1px solid #e8e2d9",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        overflow: "hidden",
                        animation: `fadeUp 0.3s ease ${i * 0.1}s both`,
                      }}
                    >
                      <img
                        src={`data:image/png;base64,${panel.image_base64}`}
                        alt={`Panel ${i + 1}`}
                        style={{ width: "100%", display: "block" }}
                      />
                      <div style={{ padding: "0.6rem 0.75rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Panel {i + 1}
                        </span>
                        <p style={{ fontSize: "0.78rem", color: "#4a4540", lineHeight: 1.45, marginTop: "0.2rem" }}>
                          {panel.source_text.length > 120 ? panel.source_text.slice(0, 120) + "…" : panel.source_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

