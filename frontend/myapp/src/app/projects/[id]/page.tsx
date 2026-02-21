// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { callAIAction, saveProject, UploadResponse } from "@/lib/api";
// import LeftSidebar from "@/components/editor/LeftSidebar";
// import RightSidebar from "@/components/editor/RightSidebar";
// import EditorToolbar from "@/components/editor/EditorToolbar";
// import AIActionBar from "@/components/editor/AIActionBar";
// import FileUploadZone from "@/components/editor/FileUploadZone";
// import KnowledgeGraph from "@/components/editor/KnowledgeGraph";

// interface Project {
//   id: string;
//   title: string;
//   emoji: string;
//   description: string;
//   genre: string;
//   content: string;
//   wordCount: number;
//   createdAt: number;
//   updatedAt: number;
// }

// interface AIResult {
//   text: string;
//   suggestions?: string[];
//   changes?: { type: string; description: string }[];
// }

// export default function ProjectEditorPage() {
//   const params = useParams();
//   const router = useRouter();
//   const projectId = params.id as string;
//   const editorRef = useRef<HTMLDivElement>(null);

//   const [project, setProject] = useState<Project | null>(null);
//   const [notFound, setNotFound] = useState(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [showUploadPanel, setShowUploadPanel] = useState(false);
//   const [wordCount, setWordCount] = useState(0);
//   const [isSaved, setIsSaved] = useState(true);
//   const [aiLoading, setAiLoading] = useState(false);
//   const [aiResult, setAiResult] = useState<AIResult | null>(null);
//   const [hasSelection, setHasSelection] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>([]);
//   const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
//   const [docTitle, setDocTitle] = useState("Untitled");
//   const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // ─── Load project from Backend ───────────────────────────────
//   useEffect(() => {
//     // 1. Fetch top-level project metadata
//     fetch(`http://localhost:8000/api/projects/${projectId}`)
//       .then(res => res.json())
//       .then(data => {
//         // Map backend _id to frontend id if needed
//         const mappedProject = { ...data, id: data._id || data.id };
//         setProject(mappedProject);
//         setDocTitle(data.title || "Untitled");

//         if (editorRef.current && data.content) {
//           editorRef.current.innerHTML = data.content;
//           countWords();
//         }
//       })
//       .catch(err => {
//         console.error("Project not found", err);
//         setNotFound(true);
//       });
//     // Fetch the latest script for this project from the backend
//     fetch(`http://localhost:8000/api/projects/${projectId}/scripts`)
//       .then(res => res.json())
//       .then(scripts => {
//         if (scripts && scripts.length > 0) {
//           // Found existing scripts, use the most recent one
//           const latestScript = scripts[0];
//           setActiveScriptId(latestScript._id || latestScript.id);
//           if (editorRef.current && latestScript.content) {
//             editorRef.current.innerHTML = latestScript.content;
//             countWords();
//           }
//         } else if (!activeScriptId) {
//           // No scripts found for this project, auto-create one
//           fetch(`http://localhost:8000/api/projects/${projectId}/scripts`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ title: "Untitled Document", content: "" })
//           })
//             .then(res => res.json())
//             .then(data => {
//               if (data.status === "success" && data.script_id) {
//                 setActiveScriptId(data.script_id);
//               }
//             })
//             .catch(err => console.error("Failed to init script:", err));
//         }
//       })
//       .catch(err => console.error("Failed to fetch scripts:", err));
//   }, [projectId]);

//   // ─── Word count ──────────────────────────────────────────────────────────────
//   const countWords = useCallback(() => {
//     const text = editorRef.current?.innerText || "";
//     const words = text.trim().split(/\s+/).filter(Boolean).length;
//     setWordCount(words);
//     return words;
//   }, []);

//   // ─── Selection tracking ──────────────────────────────────────────────────────
//   useEffect(() => {
//     const handleSelectionChange = () => {
//       const sel = window.getSelection();
//       setHasSelection(!!sel && sel.toString().length > 0);
//     };
//     document.addEventListener("selectionchange", handleSelectionChange);
//     return () => document.removeEventListener("selectionchange", handleSelectionChange);
//   }, []);

//   // ─── Auto-save ───────────────────────────────────────────────────────────────
//   const triggerSave = useCallback(() => {
//     if (!project || !activeScriptId) return;
//     setIsSaved(false);
//     if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
//     saveTimeoutRef.current = setTimeout(async () => {
//       const content = editorRef.current?.innerHTML || "";
//       const wc = countWords();
//       await saveProject(activeScriptId, content, wc);
//       setIsSaved(true);
//     }, 1500);
//   }, [project, countWords, activeScriptId]);

//   const handleEditorInput = () => {
//     countWords();
//     triggerSave();
//   };

//   // ─── Formatting ──────────────────────────────────────────────────────────────
//   const handleFormat = (command: string, value?: string) => {
//     document.execCommand(command, false, value);
//     editorRef.current?.focus();
//   };

//   const handleUndo = () => { document.execCommand("undo"); editorRef.current?.focus(); };
//   const handleRedo = () => { document.execCommand("redo"); editorRef.current?.focus(); };

//   // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.metaKey || e.ctrlKey) {
//       switch (e.key) {
//         case "b": e.preventDefault(); handleFormat("bold"); break;
//         case "i": e.preventDefault(); handleFormat("italic"); break;
//         case "u": e.preventDefault(); handleFormat("underline"); break;
//         case "z": e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); break;
//         case "s": e.preventDefault(); triggerSave(); break;
//       }
//     }
//   };

//   // ─── AI Actions ──────────────────────────────────────────────────────────────
//   const handleAIAction = useCallback(async (action: string, options?: { tone?: string }) => {
//     if (!project) return;
//     setAiLoading(true);
//     setAiResult(null);

//     const selection = window.getSelection()?.toString() || "";
//     const fullContent = editorRef.current?.innerText || "";

//     try {
//       const response = await callAIAction({
//         action: action as "write" | "rewrite" | "describe" | "brainstorm" | "chat" | "enhance" | "tone",
//         content: selection || fullContent,
//         projectId: project.id,
//         context: fullContent.slice(0, 500),
//         tone: options?.tone,
//         genre: project.genre,
//       });

//       // For write action, insert text into editor at cursor
//       if (action === "write" && response.result) {
//         editorRef.current?.focus();
//         const sel = window.getSelection();
//         if (sel && sel.rangeCount > 0) {
//           const range = sel.getRangeAt(0);
//           range.collapse(false);
//           const textNode = document.createTextNode("\n\n" + response.result);
//           range.insertNode(textNode);
//           range.collapse(false);
//           sel.removeAllRanges();
//           sel.addRange(range);
//         } else {
//           editorRef.current!.innerHTML += `<p>${response.result}</p>`;
//         }
//         triggerSave();
//       }

//       setAiResult({
//         text: response.result,
//         suggestions: response.suggestions,
//         changes: response.changes,
//       });
//     } catch (err) {
//       setAiResult({ text: "Something went wrong. Please try again." });
//     } finally {
//       setAiLoading(false);
//     }
//   }, [project, triggerSave]);

//   // ─── File upload handler ─────────────────────────────────────────────────────
//   const handleFileUpload = useCallback((file: UploadResponse) => {
//     setUploadedFiles(prev => [file, ...prev]);
//     // Set the active script ID to the ID returned from the backend
//     if (file.fileId && file.fileId.startsWith("file_") === false) {
//       setActiveScriptId(file.fileId);
//     }
//     // Insert extracted text into editor
//     if (file.extractedText && editorRef.current) {
//       editorRef.current.innerHTML += `<hr/><p><strong>📎 ${file.fileName}</strong></p><p>${file.extractedText}</p>`;
//       triggerSave();
//       countWords();
//     }
//   }, [triggerSave, countWords]);

//   // ─── Loading / Not found states ──────────────────────────────────────────────
//   if (notFound) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#faf7f4", flexDirection: "column", gap: "1rem" }}>
//         <div style={{ fontSize: "3rem" }}>🔍</div>
//         <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "#1a1510" }}>Project not found</h2>
//         <button onClick={() => router.push("/projects")} style={{ padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none", background: "#1a1510", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
//           ← Back to Projects
//         </button>
//       </div>
//     );
//   }

//   if (!project) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#faf7f4" }}>
//         <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e8e2d9", borderTopColor: "#c96a3b", animation: "spin 0.8s linear infinite" }} />
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//         body { font-family: 'DM Sans', sans-serif; background: #faf7f4; }

//         .editor-content { outline: none; min-height: 60vh; font-weight: 400; }
//         .editor-content:empty::before { content: 'Type here…'; color: #b8b0a4; font-style: italic; font-weight: 400; }
//         .editor-content h1 { font-family: 'DM Serif Display', serif; font-size: 2rem; margin-bottom: 1rem; font-weight: normal; }
//         .editor-content h2 { font-family: 'DM Serif Display', serif; font-size: 1.5rem; margin-bottom: 0.75rem; font-weight: normal; }
//         .editor-content h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: normal; }
//         .editor-content p { margin-bottom: 1rem; }
//         .editor-content ul, .editor-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
//         .editor-content li { margin-bottom: 0.25rem; }
//         .editor-content hr { border: none; border-top: 1px solid #e8e2d9; margin: 1.5rem 0; }

//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
//         @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

//         ::-webkit-scrollbar { width: 6px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
//       `}</style>

//       {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
//       <nav style={{
//         display: "flex", alignItems: "center",
//         padding: "0 1.5rem", height: "52px",
//         background: "rgba(250,247,244,0.95)", backdropFilter: "blur(12px)",
//         borderBottom: "1px solid #e8e2d9",
//         position: "sticky", top: 0, zIndex: 50,
//         gap: "0.75rem",
//       }}>
//         {/* Back */}
//         <button
//           onClick={() => router.push("/projects")}
//           style={{
//             display: "flex", alignItems: "center", gap: "0.4rem",
//             background: "none", border: "none", cursor: "pointer",
//             color: "#9e9589", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif",
//             padding: "0.35rem 0.6rem", borderRadius: "7px", transition: "all 0.15s",
//           }}
//           onMouseEnter={e => { e.currentTarget.style.background = "#f0ebe3"; e.currentTarget.style.color = "#1a1510"; }}
//           onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9e9589"; }}
//         >
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
//           Back
//         </button>

//         {/* Divider */}
//         <div style={{ width: "1px", height: "20px", background: "#e8e2d9" }} />

//         {/* Project name + emoji */}
//         <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
//           <span style={{ fontSize: "1rem" }}>{project.emoji}</span>
//           <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "0.95rem", color: "#1a1510" }}>
//             {project.title}
//           </span>
//         </div>

//         {/* Spacer */}
//         <div style={{ flex: 1 }} />



//         <button
//           onClick={() => router.push(`/projects/${projectId}/insight`)}
//           style={{
//             display: "flex", alignItems: "center", gap: "0.4rem",
//             padding: "0.4rem 0.9rem", borderRadius: "8px",
//             border: "1.5px solid #e8e2d9",
//             background: "#fff",
//             color: "#4a4540",
//             fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
//             cursor: "pointer", transition: "all 0.2s",
//           }}
//           onMouseEnter={(e) => {
//             e.currentTarget.style.borderColor = "#c96a3b";
//             e.currentTarget.style.color = "#c96a3b";
//             e.currentTarget.style.background = "rgba(201,106,59,0.04)";
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.borderColor = "#e8e2d9";
//             e.currentTarget.style.color = "#4a4540";
//             e.currentTarget.style.background = "#fff";
//           }}
//         >
//           🕸️ Insight
//         </button>


//         {/* Upload button */}
//         <button
//           onClick={() => setShowUploadPanel(!showUploadPanel)}
//           style={{
//             display: "flex", alignItems: "center", gap: "0.4rem",
//             padding: "0.4rem 0.9rem", borderRadius: "8px",
//             border: showUploadPanel ? "1.5px solid #c96a3b" : "1.5px solid #e8e2d9",
//             background: showUploadPanel ? "rgba(201,106,59,0.06)" : "#fff",
//             color: showUploadPanel ? "#c96a3b" : "#4a4540",
//             fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
//             cursor: "pointer", transition: "all 0.15s",
//           }}
//         >
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//             <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
//           </svg>
//           Upload {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
//         </button>

//         {/* Word count + save */}
//         <span style={{ fontSize: "0.78rem", color: "#9e9589" }}>
//           {wordCount.toLocaleString()} words
//         </span>
//         <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: isSaved ? "#27ae60" : "#9e9589" }}>
//           {isSaved
//             ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>Saved</>
//             : <><div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "2px solid #9e9589", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />Saving…</>
//           }
//         </div>

//         {/* Settings */}
//         <button style={{ width: "30px", height: "30px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#9e9589", display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//             <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
//           </svg>
//         </button>
//       </nav>

//       {/* ── Body: 3-column layout ──────────────────────────────────────────── */}
//       <div style={{ display: "flex", height: "calc(100vh - 52px)", overflow: "hidden" }}>

//         {/* LEFT SIDEBAR */}
//         <LeftSidebar
//           projectTitle={project.title}
//           projectEmoji={project.emoji}
//           onBack={() => router.push("/projects")}
//           collapsed={sidebarCollapsed}
//           onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
//         />

//         {/* CENTER: Editor */}
//         <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

//           {/* Formatting toolbar */}
//           <EditorToolbar
//             wordCount={wordCount}
//             isSaved={isSaved}
//             onFormat={handleFormat}
//             onUndo={handleUndo}
//             onRedo={handleRedo}
//           />

//           {/* Upload panel (collapsible) */}
//           {showUploadPanel && (
//             <div style={{
//               padding: "1rem 2rem",
//               borderBottom: "1px solid #e8e2d9",
//               background: "#fdf9f6",
//               animation: "fadeUp 0.2s ease both",
//             }}>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
//                 <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510" }}>
//                   Upload Files
//                 </h3>
//                 <p style={{ fontSize: "0.75rem", color: "#9e9589" }}>
//                   Extracted text will be inserted into your document
//                 </p>
//               </div>
//               <FileUploadZone projectId={projectId} onUpload={handleFileUpload} />
//             </div>
//           )}

//           {/* Scrollable editor area */}
//           <div style={{ flex: 1, overflowY: "auto", padding: "2rem 3rem" }}>
//             {/* Document title */}
//             <input
//               value={docTitle}
//               onChange={e => setDocTitle(e.target.value)}
//               placeholder="Untitled"
//               style={{
//                 width: "100%", border: "none", outline: "none",
//                 background: "transparent",
//                 fontFamily: "'DM Serif Display', serif",
//                 fontSize: "2rem", letterSpacing: "-0.03em",
//                 color: "#1a1510", marginBottom: "0.5rem",
//                 caretColor: "#c96a3b",
//               }}
//             />

//             {/* <div style={{ marginTop: "2rem", paddingBottom: "3rem" }}>
//   <KnowledgeGraph
//     projectId={projectId}
//     editorContent={editorRef.current?.innerText || ""}
//   />

// </div> */}

//             {/* Brainstorm suggestions from AI */}
//             {aiResult?.suggestions && aiResult.suggestions.length > 0 && (
//               <div style={{
//                 padding: "1rem 1.25rem", borderRadius: "12px",
//                 background: "#fffbf0", border: "1px solid #f5e6a3",
//                 marginBottom: "1.5rem", animation: "fadeUp 0.3s ease both",
//               }}>
//                 <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9e6800", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
//                   💡 Brainstorm Ideas
//                 </p>
//                 <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
//                   {aiResult.suggestions.map((s, i) => (
//                     <div
//                       key={i}
//                       onClick={() => {
//                         if (editorRef.current) {
//                           editorRef.current.innerHTML += `<p>${s}</p>`;
//                           triggerSave();
//                         }
//                       }}
//                       style={{
//                         padding: "0.55rem 0.75rem", borderRadius: "8px",
//                         background: "#fff", border: "1px solid #f0e6a0",
//                         fontSize: "0.83rem", color: "#1a1510", cursor: "pointer",
//                         transition: "all 0.15s", lineHeight: 1.5,
//                       }}
//                       onMouseEnter={e => { e.currentTarget.style.borderColor = "#c96a3b"; e.currentTarget.style.background = "#fffaf0"; }}
//                       onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0e6a0"; e.currentTarget.style.background = "#fff"; }}
//                     >
//                       {s}
//                       <span style={{ fontSize: "0.7rem", color: "#c96a3b", marginLeft: "0.5rem" }}>↗ Insert</span>
//                     </div>
//                   ))}
//                 </div>
//                 <button onClick={() => setAiResult(null)} style={{ marginTop: "0.5rem", background: "none", border: "none", fontSize: "0.72rem", color: "#9e9589", cursor: "pointer" }}>
//                   Dismiss
//                 </button>
//               </div>
//             )}

//             {/* AI Loading overlay */}
//             {aiLoading && (
//               <div style={{
//                 padding: "1rem 1.25rem", borderRadius: "12px",
//                 background: "#fdf9f6", border: "1px solid #e8e2d9",
//                 marginBottom: "1.5rem",
//                 display: "flex", alignItems: "center", gap: "0.75rem",
//                 animation: "pulse 1.5s ease infinite",
//               }}>
//                 <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2.5px solid #e8e2d9", borderTopColor: "#c96a3b", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
//                 <span style={{ fontSize: "0.83rem", color: "#9e9589" }}>AI is thinking…</span>
//               </div>
//             )}

//             {/* Rich text editor */}
//             <div
//               ref={editorRef}
//               contentEditable
//               suppressContentEditableWarning
//               className="editor-content"
//               onInput={handleEditorInput}
//               onKeyDown={handleKeyDown}
//               style={{
//                 fontFamily: "'DM Serif Display', serif",
//                 fontSize: "1.1rem", lineHeight: 1.85,
//                 color: "#1a1510", caretColor: "#c96a3b",
//                 minHeight: "60vh", outline: "none",
//               }}
//             />
//           </div>

//           {/* AI Action Bar */}
//           <AIActionBar
//             onAction={handleAIAction}
//             loading={aiLoading}
//             hasSelection={hasSelection}
//           />
//         </main>

//         {/* RIGHT SIDEBAR: AI Chat */}
//         <RightSidebar
//           projectId={projectId}
//           editorContent={editorRef.current?.innerText || ""}
//           aiResult={aiResult && !aiResult.suggestions ? aiResult : null}
//           onClearResult={() => setAiResult(null)}
//         />
//       </div>
//     </>
//   );
// }




"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { callAIAction, saveProject, UploadResponse } from "@/lib/api";
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
  };
  return map[action] || `Applied ${action}`;
}

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const editorRef = useRef<HTMLDivElement>(null);

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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Commit tracking refs ────────────────────────────────────────────────────
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
      const content = editorRef.current?.innerHTML || "";
      const wc = countWords();
      await saveProject(activeScriptId, content, wc);
      setIsSaved(true);
    }, 1500);
  }, [project, countWords, activeScriptId]);

  // ─── Editor input: auto-commit on 10+ word changes ──────────────────────────
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

  // ─── Formatting ──────────────────────────────────────────────────────────────
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  const handleUndo = () => { document.execCommand("undo"); editorRef.current?.focus(); };
  const handleRedo = () => { document.execCommand("redo"); editorRef.current?.focus(); };

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case "b": e.preventDefault(); handleFormat("bold"); break;
        case "i": e.preventDefault(); handleFormat("italic"); break;
        case "u": e.preventDefault(); handleFormat("underline"); break;
        case "z": e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); break;
        case "s": e.preventDefault(); triggerSave(); break;
      }
    }
  };

  // ─── AI Actions ──────────────────────────────────────────────────────────────
  const handleAIAction = useCallback(async (action: string, options?: { tone?: string }) => {
    if (!project) return;
    setAiLoading(true);
    setAiResult(null);

    const selection = window.getSelection()?.toString() || "";
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#faf7f4", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "3rem" }}>🔍</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "#1a1510" }}>Project not found</h2>
        <button onClick={() => router.push("/projects")} style={{ padding: "0.6rem 1.2rem", borderRadius: "10px", border: "none", background: "#1a1510", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          ← Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#faf7f4" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e8e2d9", borderTopColor: "#c96a3b", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf7f4; }
        .editor-content { outline: none; min-height: 60vh; font-weight: 400; }
        .editor-content:empty::before { content: 'Type here…'; color: #b8b0a4; font-style: italic; font-weight: 400; }
        .editor-content h1 { font-family: 'DM Serif Display', serif; font-size: 2rem; margin-bottom: 1rem; font-weight: normal; }
        .editor-content h2 { font-family: 'DM Serif Display', serif; font-size: 1.5rem; margin-bottom: 0.75rem; font-weight: normal; }
        .editor-content h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: normal; }
        .editor-content p { margin-bottom: 1rem; }
        .editor-content ul, .editor-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .editor-content li { margin-bottom: 0.25rem; }
        .editor-content hr { border: none; border-top: 1px solid #e8e2d9; margin: 1.5rem 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
      `}</style>

      {/* ── Top Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center",
        padding: "0 1.5rem", height: "52px",
        background: "rgba(250,247,244,0.95)", backdropFilter: "blur(12px)",
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
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "0.95rem", color: "#1a1510" }}>{project.title}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Insight button */}
        <button
          onClick={() => router.push(`/projects/${projectId}/insight`)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", color: "#4a4540", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#c96a3b"; e.currentTarget.style.color = "#c96a3b"; e.currentTarget.style.background = "rgba(201,106,59,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; e.currentTarget.style.background = "#fff"; }}
        >
          🕸️ Insight
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
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: showUploadPanel ? "1.5px solid #c96a3b" : "1.5px solid #e8e2d9", background: showUploadPanel ? "rgba(201,106,59,0.06)" : "#fff", color: showUploadPanel ? "#c96a3b" : "#4a4540", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s" }}
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
        />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <EditorToolbar
            wordCount={wordCount}
            isSaved={isSaved}
            onFormat={handleFormat}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {showUploadPanel && (
            <div style={{ padding: "1rem 2rem", borderBottom: "1px solid #e8e2d9", background: "#fdf9f6", animation: "fadeUp 0.2s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "#1a1510" }}>Upload Files</h3>
                <p style={{ fontSize: "0.75rem", color: "#9e9589" }}>Extracted text will be inserted into your document</p>
              </div>
              <FileUploadZone projectId={projectId} onUpload={handleFileUpload} />
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "2rem 3rem" }}>
            <input
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="Untitled"
              style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "'DM Serif Display', serif", fontSize: "2rem", letterSpacing: "-0.03em", color: "#1a1510", marginBottom: "0.5rem", caretColor: "#c96a3b" }}
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
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#c96a3b"; e.currentTarget.style.background = "#fffaf0"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0e6a0"; e.currentTarget.style.background = "#fff"; }}
                    >
                      {s}
                      <span style={{ fontSize: "0.7rem", color: "#c96a3b", marginLeft: "0.5rem" }}>↗ Insert</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setAiResult(null)} style={{ marginTop: "0.5rem", background: "none", border: "none", fontSize: "0.72rem", color: "#9e9589", cursor: "pointer" }}>
                  Dismiss
                </button>
              </div>
            )}

            {aiLoading && (
              <div style={{ padding: "1rem 1.25rem", borderRadius: "12px", background: "#fdf9f6", border: "1px solid #e8e2d9", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", animation: "pulse 1.5s ease infinite" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2.5px solid #e8e2d9", borderTopColor: "#c96a3b", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
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
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", lineHeight: 1.85, color: "#1a1510", caretColor: "#c96a3b", minHeight: "60vh", outline: "none" }}
            />
          </div>

          <AIActionBar
            onAction={handleAIAction}
            loading={aiLoading}
            hasSelection={hasSelection}
          />
        </main>

        <RightSidebar
          projectId={projectId}
          scriptId={activeScriptId}
          editorContent={editorRef.current?.innerText || ""}
          aiResult={aiResult && !aiResult.suggestions ? aiResult : null}
          onClearResult={() => setAiResult(null)}
        />
      </div>
    </>
  );
}