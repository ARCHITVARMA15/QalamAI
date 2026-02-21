// // "use client";

// // import { useState, useEffect, useRef, useCallback } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import {
// //   getAllCommits, buildHeatmapData, getDashboardStats,
// //   seedDemoCommits, COMMIT_META, formatTimeAgo,
// //   Commit, DayActivity, CommitType,
// // } from "@/lib/commits";

// // // ─── Heatmap cell color ───────────────────────────────────────────────────────
// // function getHeatColor(count: number): string {
// //   if (count === 0) return "#f0e8df";
// //   if (count === 1) return "#c8dfc5";
// //   if (count === 2) return "#8ec48a";
// //   if (count <= 4) return "#4a9e5c";
// //   return "#1a7a3e";
// // }

// // // ─── Month labels for heatmap ─────────────────────────────────────────────────
// // function getMonthPositions(days: DayActivity[]): { label: string; col: number }[] {
// //   const seen = new Set<string>();
// //   const result: { label: string; col: number }[] = [];
// //   days.forEach((d, i) => {
// //     const month = new Date(d.date).toLocaleDateString("en-US", { month: "short" });
// //     const col = Math.floor(i / 7);
// //     if (!seen.has(month)) { seen.add(month); result.push({ label: month, col }); }
// //   });
// //   return result;
// // }

// // // ─── Heatmap Component ────────────────────────────────────────────────────────
// // function ContributionHeatmap({ days, onDayClick }: { days: DayActivity[]; onDayClick: (d: DayActivity) => void }) {
// //   const [tooltip, setTooltip] = useState<{ day: DayActivity; x: number; y: number } | null>(null);
// //   const totalActive = days.filter((d) => d.count > 0).length;
// //   const totalCommits = days.reduce((s, d) => s + d.count, 0);
// //   const monthPositions = getMonthPositions(days);

// //   // Group into weeks (columns of 7)
// //   const weeks: DayActivity[][] = [];
// //   for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

// //   const CELL = 13, GAP = 3;

// //   return (
// //     <div>
// //       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
// //         <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.05rem", color: "#1a120a" }}>
// //           {totalCommits} contributions in the last year
// //         </p>
// //         <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: "#9e9589" }}>
// //           <span>Less</span>
// //           {[0, 1, 2, 3, 4].map((l) => (
// //             <div key={l} style={{ width: CELL, height: CELL, borderRadius: "3px", background: getHeatColor(l === 0 ? 0 : l) }} />
// //           ))}
// //           <span>More</span>
// //         </div>
// //       </div>

// //       <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
// //         <div style={{ position: "relative", display: "inline-block" }}>
// //           {/* Month labels */}
// //           <div style={{ display: "flex", marginLeft: "28px", marginBottom: "4px", position: "relative", height: "16px" }}>
// //             {monthPositions.map(({ label, col }) => (
// //               <span key={label} style={{
// //                 position: "absolute", left: col * (CELL + GAP),
// //                 fontSize: "0.65rem", color: "#9e9589", fontWeight: 500,
// //                 letterSpacing: "0.04em",
// //               }}>
// //                 {label}
// //               </span>
// //             ))}
// //           </div>

// //           <div style={{ display: "flex", gap: GAP }}>
// //             {/* Day labels */}
// //             <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: "2px" }}>
// //               {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
// //                 <div key={i} style={{ height: CELL, fontSize: "0.6rem", color: "#9e9589", lineHeight: `${CELL}px`, width: "24px", textAlign: "right" }}>
// //                   {d}
// //                 </div>
// //               ))}
// //             </div>

// //             {/* Grid */}
// //             {weeks.map((week, wi) => (
// //               <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
// //                 {week.map((day, di) => (
// //                   <div
// //                     key={di}
// //                     onClick={() => day.count > 0 && onDayClick(day)}
// //                     onMouseEnter={(e) => {
// //                       const rect = e.currentTarget.getBoundingClientRect();
// //                       setTooltip({ day, x: rect.left, y: rect.top });
// //                     }}
// //                     onMouseLeave={() => setTooltip(null)}
// //                     style={{
// //                       width: CELL, height: CELL, borderRadius: "3px",
// //                       background: getHeatColor(day.count),
// //                       cursor: day.count > 0 ? "pointer" : "default",
// //                       transition: "transform 0.1s, filter 0.1s",
// //                       border: "1px solid rgba(0,0,0,0.04)",
// //                     }}
// //                     onMouseOver={(e) => { if (day.count > 0) { e.currentTarget.style.transform = "scale(1.3)"; e.currentTarget.style.zIndex = "10"; e.currentTarget.style.position = "relative"; }}}
// //                     onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.zIndex = "auto"; }}
// //                   />
// //                 ))}
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Tooltip */}
// //       {tooltip && (
// //         <div style={{
// //           position: "fixed", top: tooltip.y - 44, left: tooltip.x - 20,
// //           background: "#1a120a", color: "#faf7f4", padding: "0.35rem 0.65rem",
// //           borderRadius: "7px", fontSize: "0.72rem", pointerEvents: "none", zIndex: 9999,
// //           boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
// //           whiteSpace: "nowrap",
// //         }}>
// //           <strong>{tooltip.day.count} commit{tooltip.day.count !== 1 ? "s" : ""}</strong> on{" "}
// //           {new Date(tooltip.day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // // ─── Stat Card ────────────────────────────────────────────────────────────────
// // function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
// //   return (
// //     <div style={{
// //       background: "#fff", border: "1px solid #e8e2d9", borderRadius: "14px",
// //       padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden",
// //     }}>
// //       <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: accent, borderRadius: "14px 14px 0 0" }} />
// //       <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e9589", marginBottom: "0.5rem" }}>
// //         {label}
// //       </p>
// //       <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "2.2rem", color: "#1a120a", lineHeight: 1, letterSpacing: "-0.03em" }}>
// //         {value}
// //       </p>
// //       {sub && <p style={{ fontSize: "0.72rem", color: "#9e9589", marginTop: "0.4rem" }}>{sub}</p>}
// //     </div>
// //   );
// // }

// // // ─── Commit Row ───────────────────────────────────────────────────────────────
// // function CommitRow({ commit, isFirst }: { commit: Commit; isFirst: boolean }) {
// //   const [expanded, setExpanded] = useState(false);
// //   const meta = COMMIT_META[commit.type];

// //   return (
// //     <div style={{
// //       borderBottom: "1px solid #f0ebe3",
// //       animation: isFirst ? "slideIn 0.3s ease both" : undefined,
// //     }}>
// //       <div
// //         onClick={() => setExpanded(!expanded)}
// //         style={{
// //           display: "flex", alignItems: "center", gap: "0.75rem",
// //           padding: "0.75rem 1rem", cursor: "pointer",
// //           transition: "background 0.15s",
// //         }}
// //         onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
// //         onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
// //       >
// //         {/* Type dot */}
// //         <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />

// //         {/* Type badge */}
// //         <span style={{
// //           fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
// //           letterSpacing: "0.07em", padding: "0.18rem 0.55rem", borderRadius: "20px",
// //           background: meta.bg, color: meta.color, flexShrink: 0, minWidth: "60px", textAlign: "center",
// //         }}>
// //           {meta.label}
// //         </span>

// //         {/* Message */}
// //         <span style={{ flex: 1, fontSize: "0.83rem", color: "#2a2520", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
// //           {commit.message}
// //         </span>

// //         {/* Project */}
// //         <span style={{ fontSize: "0.7rem", color: "#9e9589", flexShrink: 0, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
// //           {commit.projectEmoji} {commit.projectTitle}
// //         </span>

// //         {/* Word delta */}
// //         <span style={{
// //           fontSize: "0.72rem", fontWeight: 600, flexShrink: 0,
// //           color: commit.wordDelta >= 0 ? "#1a7a5e" : "#c93b3b",
// //           minWidth: "50px", textAlign: "right",
// //         }}>
// //           {commit.wordDelta >= 0 ? "+" : ""}{commit.wordDelta}w
// //         </span>

// //         {/* Time */}
// //         <span style={{ fontSize: "0.7rem", color: "#b8b0a4", flexShrink: 0, minWidth: "60px", textAlign: "right" }}>
// //           {formatTimeAgo(commit.timestamp)}
// //         </span>

// //         {/* Expand chevron */}
// //         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b8b0a4" strokeWidth="2"
// //           style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
// //           <path d="M6 9l6 6 6-6" />
// //         </svg>
// //       </div>

// //       {/* Expanded detail */}
// //       {expanded && (
// //         <div style={{
// //           padding: "0.5rem 1rem 0.85rem 2.5rem",
// //           background: "#faf7f4", borderTop: "1px solid #f0ebe3",
// //           animation: "fadeDown 0.2s ease both",
// //         }}>
// //           <div style={{ display: "flex", gap: "2rem", marginBottom: "0.5rem" }}>
// //             <div>
// //               <p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Commit ID</p>
// //               <p style={{ fontSize: "0.72rem", color: "#4a4540", fontFamily: "monospace" }}>{commit.id.slice(7, 19)}</p>
// //             </div>
// //             <div>
// //               <p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Words before</p>
// //               <p style={{ fontSize: "0.72rem", color: "#4a4540" }}>{commit.wordsBefore.toLocaleString()}</p>
// //             </div>
// //             <div>
// //               <p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Words after</p>
// //               <p style={{ fontSize: "0.72rem", color: "#4a4540" }}>{commit.wordsAfter.toLocaleString()}</p>
// //             </div>
// //             <div>
// //               <p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Time</p>
// //               <p style={{ fontSize: "0.72rem", color: "#4a4540" }}>
// //                 {new Date(commit.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })},{" "}
// //                 {new Date(commit.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
// //               </p>
// //             </div>
// //           </div>
// //           {commit.snippet && (
// //             <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "8px", padding: "0.6rem 0.85rem", borderLeft: "3px solid " + meta.color }}>
// //               <p style={{ fontSize: "0.78rem", color: "#6a6560", fontStyle: "italic", lineHeight: 1.6 }}>"{commit.snippet}"</p>
// //             </div>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // // ─── Main Dashboard Page ──────────────────────────────────────────────────────
// // export default function DashboardPage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const projectId = params.id as string;

// //   const [commits, setCommits] = useState<Commit[]>([]);
// //   const [heatmap, setHeatmap] = useState<DayActivity[]>([]);
// //   const [stats, setStats] = useState<ReturnType<typeof getDashboardStats> | null>(null);
// //   const [project, setProject] = useState<{ title: string; emoji: string } | null>(null);
// //   const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
// //   const [filterType, setFilterType] = useState<CommitType | "all">("all");
// //   const [liveIndicator, setLiveIndicator] = useState(false);

// //   const refresh = useCallback(() => {
// //     setCommits(getAllCommits());
// //     setHeatmap(buildHeatmapData());
// //     setStats(getDashboardStats());
// //   }, []);

// //   useEffect(() => {
// //     // Load project info
// //     const stored = localStorage.getItem("writeai_projects");
// //     if (stored) {
// //       const projects = JSON.parse(stored);
// //       const p = projects.find((x: { id: string; title: string; emoji: string }) => x.id === projectId);
// //       if (p) {
// //         setProject({ title: p.title, emoji: p.emoji });
// //         seedDemoCommits(projectId, p.title, p.emoji || "📖");
// //       }
// //     }
// //     refresh();

// //     // Live update listener
// //     const handler = () => {
// //       refresh();
// //       setLiveIndicator(true);
// //       setTimeout(() => setLiveIndicator(false), 2000);
// //     };
// //     window.addEventListener("writeai:commit", handler);
// //     // Also poll every 3s to catch changes from other tabs
// //     const interval = setInterval(refresh, 3000);
// //     return () => { window.removeEventListener("writeai:commit", handler); clearInterval(interval); };
// //   }, [projectId, refresh]);

// //   const displayCommits = commits.filter((c) => filterType === "all" || c.type === filterType);
// //   const commitTypes = [...new Set(commits.map((c) => c.type))] as CommitType[];

// //   // Group commits by date for the log
// //   const groupedByDate = displayCommits.reduce((acc: Record<string, Commit[]>, c) => {
// //     const key = new Date(c.timestamp).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
// //     if (!acc[key]) acc[key] = [];
// //     acc[key].push(c);
// //     return acc;
// //   }, {});

// //   return (
// //     <>
// //       <style>{`
// //         @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
// //         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
// //         body { font-family: 'DM Sans', sans-serif; background: #faf7f4; }
// //         ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
// //         @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
// //         @keyframes fadeDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
// //         @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
// //         @keyframes fadeUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
// //       `}</style>

// //       {/* Ambient */}
// //       <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
// //         background: "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(201,140,80,0.05) 0%, transparent 60%)" }} />

// //       {/* ── Nav ── */}
// //       <nav style={{
// //         position: "sticky", top: 0, zIndex: 50,
// //         display: "flex", alignItems: "center", gap: "0.75rem",
// //         padding: "0 1.75rem", height: "56px",
// //         background: "rgba(250,247,244,0.94)", backdropFilter: "blur(12px)",
// //         borderBottom: "1px solid #e8e2d9",
// //       }}>
// //         <button onClick={() => router.push(`/projects/${projectId}/insight`)}
// //           style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#9e9589", fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", padding: "0.35rem 0.65rem", borderRadius: "8px", transition: "all 0.15s" }}
// //           onMouseEnter={(e) => { e.currentTarget.style.background = "#f0ebe3"; e.currentTarget.style.color = "#1a1510"; }}
// //           onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9e9589"; }}>
// //           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
// //           Insight
// //         </button>

// //         <div style={{ width: "1px", height: "18px", background: "#e8e2d9" }} />

// //         {project && (
// //           <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
// //             <span>{project.emoji}</span>
// //             <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>{project.title}</span>
// //             <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "20px", background: "#f0ebe3", color: "#9e9589", marginLeft: "0.2rem" }}>Dashboard</span>
// //           </div>
// //         )}

// //         <div style={{ flex: 1 }} />

// //         {/* Live indicator */}
// //         <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: liveIndicator ? "#1a7a5e" : "#9e9589", transition: "color 0.3s" }}>
// //           <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: liveIndicator ? "#1a7a5e" : "#c8dfc5", animation: "pulse 2s ease infinite" }} />
// //           {liveIndicator ? "New commit recorded!" : "Live"}
// //         </div>

// //         <button onClick={() => router.push(`/projects/${projectId}`)}
// //           style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem", color: "#4a4540", cursor: "pointer", transition: "all 0.15s" }}
// //           onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c98c50"; e.currentTarget.style.color = "#c98c50"; }}
// //           onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; }}>
// //           ✍️ Open Editor
// //         </button>
// //       </nav>

// //       {/* ── Body ── */}
// //       <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

// //         {/* Header */}
// //         <div style={{ marginBottom: "2rem", animation: "fadeUp 0.5s ease both" }}>
// //           <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "#1a120a", letterSpacing: "-0.03em", marginBottom: "0.3rem" }}>
// //             Writing Activity
// //           </h1>
// //           <p style={{ fontSize: "0.85rem", color: "#9e9589" }}>
// //             Every change, every session, every word — tracked automatically.
// //           </p>
// //         </div>

// //         {/* ── Stats grid ── */}
// //         {stats && (
// //           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem", animation: "fadeUp 0.5s ease 0.1s both" }}>
// //             <StatCard label="Total Commits" value={stats.totalCommits} sub="all time" accent="#c98c50" />
// //             <StatCard label="Words Written" value={stats.totalWordsWritten > 999 ? `${(stats.totalWordsWritten / 1000).toFixed(1)}k` : stats.totalWordsWritten} sub="net new words" accent="#1a7a5e" />
// //             <StatCard label="This Week" value={stats.thisWeekCommits} sub="last 7 days" accent="#3b82c9" />
// //             <StatCard label="Today" value={stats.todayCommits} sub={new Date().toLocaleDateString("en-US", { weekday: "long" })} accent="#c93b6a" />
// //             <StatCard label="Current Streak" value={`${stats.currentStreak}d`} sub={`best: ${stats.longestStreak}d`} accent="#c9a83b" />
// //             <StatCard label="Projects" value={stats.totalProjects} sub="active" accent="#7c5cbf" />
// //           </div>
// //         )}

// //         {/* ── Heatmap card ── */}
// //         <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", padding: "1.5rem 1.75rem", marginBottom: "2rem", animation: "fadeUp 0.5s ease 0.2s both" }}>
// //           <ContributionHeatmap days={heatmap} onDayClick={setSelectedDay} />

// //           {/* Selected day detail */}
// //           {selectedDay && (
// //             <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#faf7f4", borderRadius: "10px", border: "1px solid #e8e2d9", animation: "fadeDown 0.2s ease both" }}>
// //               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
// //                 <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>
// //                   {new Date(selectedDay.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
// //                   <span style={{ fontSize: "0.75rem", color: "#9e9589", marginLeft: "0.5rem" }}>
// //                     — {selectedDay.count} commit{selectedDay.count !== 1 ? "s" : ""}
// //                   </span>
// //                 </p>
// //                 <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9589", fontSize: "0.85rem" }}>✕</button>
// //               </div>
// //               <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
// //                 {selectedDay.commits.map((c) => {
// //                   const meta = COMMIT_META[c.type];
// //                   return (
// //                     <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0.6rem", background: "#fff", borderRadius: "8px", border: "1px solid #e8e2d9" }}>
// //                       <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
// //                       <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "20px", background: meta.bg, color: meta.color }}>{meta.label}</span>
// //                       <span style={{ flex: 1, fontSize: "0.8rem", color: "#2a2520" }}>{c.message}</span>
// //                       <span style={{ fontSize: "0.7rem", color: c.wordDelta >= 0 ? "#1a7a5e" : "#c93b3b", fontWeight: 600 }}>{c.wordDelta >= 0 ? "+" : ""}{c.wordDelta}w</span>
// //                       <span style={{ fontSize: "0.68rem", color: "#b8b0a4" }}>
// //                         {new Date(c.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
// //                       </span>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* ── Two column: commit log + project breakdown ── */}
// //         <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", animation: "fadeUp 0.5s ease 0.3s both" }}>

// //           {/* ── Commit Log ── */}
// //           <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", overflow: "hidden" }}>
// //             {/* Header */}
// //             <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f0ebe3", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
// //               <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.05rem", color: "#1a120a" }}>Commit History</h2>
// //               <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
// //                 <button onClick={() => setFilterType("all")} style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", border: filterType === "all" ? "1.5px solid #1a120a" : "1.5px solid #e8e2d9", background: filterType === "all" ? "#1a120a" : "#fff", color: filterType === "all" ? "#fff" : "#9e9589", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>All</button>
// //                 {commitTypes.map((t) => {
// //                   const m = COMMIT_META[t];
// //                   return (
// //                     <button key={t} onClick={() => setFilterType(filterType === t ? "all" : t)} style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", border: `1.5px solid ${filterType === t ? m.color : "#e8e2d9"}`, background: filterType === t ? m.bg : "#fff", color: filterType === t ? m.color : "#9e9589", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
// //                       {m.label}
// //                     </button>
// //                   );
// //                 })}
// //               </div>
// //             </div>

// //             {/* Commit rows grouped by date */}
// //             <div style={{ maxHeight: "600px", overflowY: "auto" }}>
// //               {Object.keys(groupedByDate).length === 0 ? (
// //                 <div style={{ padding: "3rem", textAlign: "center", color: "#9e9589" }}>
// //                   <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📝</div>
// //                   <p style={{ fontFamily: "'DM Serif Display',serif", color: "#4a4540", marginBottom: "0.3rem" }}>No commits yet</p>
// //                   <p style={{ fontSize: "0.78rem" }}>Start writing — every AI action and edit will appear here.</p>
// //                 </div>
// //               ) : (
// //                 Object.entries(groupedByDate).map(([date, dayCommits]) => (
// //                   <div key={date}>
// //                     {/* Date divider */}
// //                     <div style={{ padding: "0.5rem 1rem", background: "#faf7f4", borderBottom: "1px solid #f0ebe3", display: "flex", alignItems: "center", gap: "0.75rem" }}>
// //                       <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9e9589" }}>{date}</span>
// //                       <div style={{ flex: 1, height: "1px", background: "#e8e2d9" }} />
// //                       <span style={{ fontSize: "0.68rem", color: "#b8b0a4" }}>{dayCommits.length} commit{dayCommits.length !== 1 ? "s" : ""}</span>
// //                     </div>
// //                     {dayCommits.map((c, i) => <CommitRow key={c.id} commit={c} isFirst={i === 0 && date === Object.keys(groupedByDate)[0]} />)}
// //                   </div>
// //                 ))
// //               )}
// //             </div>
// //           </div>

// //           {/* ── Right: Projects + Type breakdown ── */}
// //           <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

// //             {/* Project breakdown */}
// //             <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", overflow: "hidden" }}>
// //               <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #f0ebe3" }}>
// //                 <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>Projects</h3>
// //               </div>
// //               <div style={{ padding: "0.5rem 0" }}>
// //                 {stats?.projectBreakdown.slice(0, 6).map((p, i) => (
// //                   <div key={p.id} style={{ padding: "0.6rem 1.1rem", display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", transition: "background 0.15s" }}
// //                     onClick={() => router.push(`/projects/${p.id}`)}
// //                     onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
// //                     onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
// //                     <span style={{ fontSize: "1.1rem" }}>{p.emoji}</span>
// //                     <div style={{ flex: 1, minWidth: 0 }}>
// //                       <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1a120a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
// //                       <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
// //                         <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: "#f0ebe3", overflow: "hidden" }}>
// //                           <div style={{ height: "100%", borderRadius: "2px", background: "#c98c50", width: `${Math.min(100, (p.commits / (stats?.projectBreakdown[0]?.commits || 1)) * 100)}%`, transition: "width 0.6s ease" }} />
// //                         </div>
// //                         <span style={{ fontSize: "0.65rem", color: "#9e9589", flexShrink: 0 }}>{p.commits}c</span>
// //                       </div>
// //                     </div>
// //                     <span style={{ fontSize: "0.68rem", color: "#1a7a5e", fontWeight: 600 }}>+{p.words > 999 ? `${(p.words/1000).toFixed(1)}k` : p.words}w</span>
// //                   </div>
// //                 ))}
// //                 {(!stats || stats.projectBreakdown.length === 0) && (
// //                   <p style={{ padding: "1rem 1.1rem", fontSize: "0.78rem", color: "#9e9589" }}>No projects tracked yet.</p>
// //                 )}
// //               </div>
// //             </div>

// //             {/* Commit type breakdown */}
// //             <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", overflow: "hidden" }}>
// //               <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #f0ebe3" }}>
// //                 <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>Action Breakdown</h3>
// //               </div>
// //               <div style={{ padding: "0.75rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
// //                 {stats && Object.entries(stats.typeCounts).sort(([, a], [, b]) => b - a).map(([type, count]) => {
// //                   const meta = COMMIT_META[type as CommitType];
// //                   const total = Object.values(stats.typeCounts).reduce((s, v) => s + v, 0);
// //                   return (
// //                     <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
// //                       <span style={{ fontSize: "0.68rem", fontWeight: 700, width: "64px", color: meta.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{meta.label}</span>
// //                       <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#f0ebe3", overflow: "hidden" }}>
// //                         <div style={{ height: "100%", borderRadius: "3px", background: meta.color, width: `${(count / total) * 100}%`, transition: "width 0.6s ease" }} />
// //                       </div>
// //                       <span style={{ fontSize: "0.68rem", color: "#9e9589", minWidth: "24px", textAlign: "right" }}>{count}</span>
// //                     </div>
// //                   );
// //                 })}
// //                 {!stats?.typeCounts || Object.keys(stats.typeCounts).length === 0 ? (
// //                   <p style={{ fontSize: "0.78rem", color: "#9e9589" }}>No activity yet.</p>
// //                 ) : null}
// //               </div>
// //             </div>

// //             {/* Writing time estimate */}
// //             {stats && stats.totalCommits > 0 && (
// //               <div style={{ background: "linear-gradient(135deg, #1a120a, #2a2015)", borderRadius: "16px", padding: "1.25rem 1.3rem", color: "#faf7f4" }}>
// //                 <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#c98c50", marginBottom: "0.5rem" }}>Writing Summary</p>
// //                 <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.5rem", lineHeight: 1.2, marginBottom: "0.4rem" }}>
// //                   {stats.totalWordsWritten.toLocaleString()} words written
// //                 </p>
// //                 <p style={{ fontSize: "0.78rem", color: "#9e9589", lineHeight: 1.6 }}>
// //                   Across {stats.totalCommits} commits in {stats.totalProjects} project{stats.totalProjects !== 1 ? "s" : ""}.
// //                   {stats.currentStreak > 1 ? ` ${stats.currentStreak}-day writing streak 🔥` : " Keep writing!"}
// //                 </p>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </>
// //   );
// // }




"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAllCommits, buildHeatmapData, getDashboardStats,
  seedDemoCommits, COMMIT_META, formatTimeAgo,
  Commit, DayActivity, CommitType,
} from "@/lib/commits";

// ─── Mock user (swap with real auth user when ready) ──────────────────────────
const MOCK_USER = {
  name: "Archi Varma",
  handle: "@archivarma",
  avatar: null as string | null, // set to a URL string to use a real image
  initials: "AV",
  bio: "Fiction writer. World-builder. KalamAI power user.",
  joinedYear: 2024,
  location: "Mumbai, India",
};

function getHeatColor(count: number): string {
  if (count === 0) return "#f0e8df";
  if (count === 1) return "#c8dfc5";
  if (count === 2) return "#8ec48a";
  if (count <= 4) return "#4a9e5c";
  return "#1a7a3e";
}

function getMonthPositions(days: DayActivity[]): { label: string; col: number }[] {
  const seen = new Set<string>();
  const result: { label: string; col: number }[] = [];
  days.forEach((d, i) => {
    const month = new Date(d.date).toLocaleDateString("en-US", { month: "short" });
    const col = Math.floor(i / 7);
    if (!seen.has(month)) { seen.add(month); result.push({ label: month, col }); }
  });
  return result;
}

function ContributionHeatmap({ days, onDayClick }: { days: DayActivity[]; onDayClick: (d: DayActivity) => void }) {
  const [tooltip, setTooltip] = useState<{ day: DayActivity; x: number; y: number } | null>(null);
  const totalCommits = days.reduce((s, d) => s + d.count, 0);
  const monthPositions = getMonthPositions(days);
  const weeks: DayActivity[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const CELL = 13, GAP = 3;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.05rem", color: "#1a120a" }}>
          {totalCommits} contributions in the last year
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: "#9e9589" }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} style={{ width: CELL, height: CELL, borderRadius: "3px", background: getHeatColor(l === 0 ? 0 : l) }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{ display: "flex", marginLeft: "28px", marginBottom: "4px", position: "relative", height: "16px" }}>
            {monthPositions.map(({ label, col }) => (
              <span key={label} style={{ position: "absolute", left: col * (CELL + GAP), fontSize: "0.65rem", color: "#9e9589", fontWeight: 500, letterSpacing: "0.04em" }}>{label}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: GAP }}>
            <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: "2px" }}>
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <div key={i} style={{ height: CELL, fontSize: "0.6rem", color: "#9e9589", lineHeight: `${CELL}px`, width: "24px", textAlign: "right" }}>{d}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {week.map((day, di) => (
                  <div key={di}
                    onClick={() => day.count > 0 && onDayClick(day)}
                    onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ day, x: r.left, y: r.top }); }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ width: CELL, height: CELL, borderRadius: "3px", background: getHeatColor(day.count), cursor: day.count > 0 ? "pointer" : "default", transition: "transform 0.1s", border: "1px solid rgba(0,0,0,0.04)" }}
                    onMouseOver={(e) => { if (day.count > 0) { e.currentTarget.style.transform = "scale(1.3)"; e.currentTarget.style.position = "relative"; e.currentTarget.style.zIndex = "10"; }}}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.zIndex = "auto"; }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {tooltip && (
        <div style={{ position: "fixed", top: tooltip.y - 44, left: tooltip.x - 20, background: "#1a120a", color: "#faf7f4", padding: "0.35rem 0.65rem", borderRadius: "7px", fontSize: "0.72rem", pointerEvents: "none", zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", whiteSpace: "nowrap" }}>
          <strong>{tooltip.day.count} commit{tooltip.day.count !== 1 ? "s" : ""}</strong> on {new Date(tooltip.day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "14px", padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: accent, borderRadius: "14px 14px 0 0" }} />
      <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e9589", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "2.2rem", color: "#1a120a", lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "#9e9589", marginTop: "0.4rem" }}>{sub}</p>}
    </div>
  );
}

function CommitRow({ commit, isFirst }: { commit: Commit; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = COMMIT_META[commit.type];
  return (
    <div style={{ borderBottom: "1px solid #f0ebe3", animation: isFirst ? "slideIn 0.3s ease both" : undefined }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer", transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
        <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "0.18rem 0.55rem", borderRadius: "20px", background: meta.bg, color: meta.color, flexShrink: 0, minWidth: "60px", textAlign: "center" }}>{meta.label}</span>
        <span style={{ flex: 1, fontSize: "0.83rem", color: "#2a2520", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{commit.message}</span>
        <span style={{ fontSize: "0.7rem", color: "#9e9589", flexShrink: 0, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{commit.projectEmoji} {commit.projectTitle}</span>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, flexShrink: 0, color: commit.wordDelta >= 0 ? "#1a7a5e" : "#c93b3b", minWidth: "50px", textAlign: "right" }}>{commit.wordDelta >= 0 ? "+" : ""}{commit.wordDelta}w</span>
        <span style={{ fontSize: "0.7rem", color: "#b8b0a4", flexShrink: 0, minWidth: "60px", textAlign: "right" }}>{formatTimeAgo(commit.timestamp)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b8b0a4" strokeWidth="2" style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6" /></svg>
      </div>
      {expanded && (
        <div style={{ padding: "0.5rem 1rem 0.85rem 2.5rem", background: "#faf7f4", borderTop: "1px solid #f0ebe3", animation: "fadeDown 0.2s ease both" }}>
          <div style={{ display: "flex", gap: "2rem", marginBottom: "0.5rem" }}>
            <div><p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Commit ID</p><p style={{ fontSize: "0.72rem", color: "#4a4540", fontFamily: "monospace" }}>{commit.id.slice(7, 19)}</p></div>
            <div><p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Words before</p><p style={{ fontSize: "0.72rem", color: "#4a4540" }}>{commit.wordsBefore.toLocaleString()}</p></div>
            <div><p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Words after</p><p style={{ fontSize: "0.72rem", color: "#4a4540" }}>{commit.wordsAfter.toLocaleString()}</p></div>
            <div><p style={{ fontSize: "0.65rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.15rem" }}>Time</p><p style={{ fontSize: "0.72rem", color: "#4a4540" }}>{new Date(commit.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}, {new Date(commit.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
          </div>
          {commit.snippet && (
            <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "8px", padding: "0.6rem 0.85rem", borderLeft: "3px solid " + meta.color }}>
              <p style={{ fontSize: "0.78rem", color: "#6a6560", fontStyle: "italic", lineHeight: 1.6 }}>"{commit.snippet}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── User Avatar ──────────────────────────────────────────────────────────────
function UserAvatar({ size = 40 }: { size?: number }) {
  return MOCK_USER.avatar ? (
    <img src={MOCK_USER.avatar} alt={MOCK_USER.name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8e2d9" }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #c98c50, #c96a3b)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35,
      fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.02em",
      border: "2px solid rgba(201,106,59,0.2)", flexShrink: 0,
    }}>
      {MOCK_USER.initials}
    </div>
  );
}

// ─── User Profile Card (left sidebar) ────────────────────────────────────────
function UserProfileCard({ stats }: { stats: ReturnType<typeof getDashboardStats> | null }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", overflow: "hidden", marginBottom: "1rem" }}>
      {/* Banner */}
      <div style={{ height: "64px", background: "linear-gradient(135deg, #fdf0e6, #f5e6d8)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(201,140,80,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,106,59,0.1) 0%, transparent 40%)" }} />
      </div>

      {/* Avatar — overlapping banner */}
      <div style={{ padding: "0 1.25rem", position: "relative" }}>
        <div style={{ marginTop: "-24px", marginBottom: "0.75rem", display: "inline-block", borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <UserAvatar size={48} />
        </div>

        <div style={{ marginBottom: "0.85rem" }}>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.05rem", color: "#1a120a", lineHeight: 1.2 }}>{MOCK_USER.name}</p>
          <p style={{ fontSize: "0.72rem", color: "#9e9589", marginTop: "0.1rem" }}>{MOCK_USER.handle}</p>
        </div>

        <p style={{ fontSize: "0.78rem", color: "#6a6560", lineHeight: 1.55, marginBottom: "0.85rem" }}>{MOCK_USER.bio}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "#9e9589" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {MOCK_USER.location}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "#9e9589" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Joined {MOCK_USER.joinedYear}
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", paddingBottom: "1.1rem", borderTop: "1px solid #f0ebe3", paddingTop: "0.85rem" }}>
          {[
            { label: "Commits", value: stats?.totalCommits || 0 },
            { label: "Projects", value: stats?.totalProjects || 0 },
            { label: "Words", value: stats ? (stats.totalWordsWritten > 999 ? `${(stats.totalWordsWritten/1000).toFixed(1)}k` : stats.totalWordsWritten) : 0 },
            { label: "Streak", value: `${stats?.currentStreak || 0}d 🔥` },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "0.4rem", background: "#faf7f4", borderRadius: "8px" }}>
              <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.1rem", color: "#1a120a", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "0.62rem", color: "#9e9589", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.15rem" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
 function DashboardPage() {
  const router = useRouter();

  const [commits, setCommits] = useState<Commit[]>([]);
  const [heatmap, setHeatmap] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getDashboardStats> | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [filterType, setFilterType] = useState<CommitType | "all">("all");
  const [liveIndicator, setLiveIndicator] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const refresh = useCallback(() => {
    setCommits(getAllCommits());
    setHeatmap(buildHeatmapData());
    setStats(getDashboardStats());
  }, []);

  useEffect(() => {
    // Seed demo data for any existing projects
    const stored = localStorage.getItem("writeai_projects");
    if (stored) {
      const projects = JSON.parse(stored);
      projects.forEach((p: { id: string; title: string; emoji: string }) => {
        seedDemoCommits(p.id, p.title, p.emoji || "📖");
      });
    }
    refresh();

    const handler = () => { refresh(); setLiveIndicator(true); setTimeout(() => setLiveIndicator(false), 2000); };
    window.addEventListener("writeai:commit", handler);
    const interval = setInterval(refresh, 3000);
    return () => { window.removeEventListener("writeai:commit", handler); clearInterval(interval); };
  }, [refresh]);

  const displayCommits = commits.filter((c) => filterType === "all" || c.type === filterType);
  const commitTypes = [...new Set(commits.map((c) => c.type))] as CommitType[];

  const groupedByDate = displayCommits.reduce((acc: Record<string, Commit[]>, c) => {
    const key = new Date(c.timestamp).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf7f4; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #d4cdc5; border-radius: 3px; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(201,140,80,0.05) 0%, transparent 60%)" }} />

      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 1.75rem", height: "56px", background: "rgba(250,247,244,0.94)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8e2d9" }}>

        {/* Logo */}
        <a href="/projects" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.2rem", color: "#1a1510", textDecoration: "none", letterSpacing: "-0.02em" }}>
          Write<span style={{ color: "#c96a3b" }}>AI</span>
        </a>

        <div style={{ width: "1px", height: "18px", background: "#e8e2d9" }} />

        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "20px", background: "#f0ebe3", color: "#9e9589", fontWeight: 600 }}>Dashboard</span>

        <div style={{ flex: 1 }} />

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: liveIndicator ? "#1a7a5e" : "#9e9589", transition: "color 0.3s" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: liveIndicator ? "#1a7a5e" : "#c8dfc5", animation: "pulse 2s ease infinite" }} />
          {liveIndicator ? "New commit recorded!" : "Live"}
        </div>

        <button onClick={() => router.push("/projects")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e8e2d9", background: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem", color: "#4a4540", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c98c50"; e.currentTarget.style.color = "#c98c50"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e2d9"; e.currentTarget.style.color = "#4a4540"; }}>
          ← My Projects
        </button>

        {/* Profile avatar in nav */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <UserAvatar size={32} />
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9e9589" strokeWidth="2" style={{ transform: showProfileMenu ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {showProfileMenu && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", border: "1px solid #e8e2d9", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "0.5rem", minWidth: "180px", animation: "fadeDown 0.15s ease both", zIndex: 100 }}>
              <div style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #f0ebe3", marginBottom: "0.3rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a120a" }}>{MOCK_USER.name}</p>
                <p style={{ fontSize: "0.7rem", color: "#9e9589" }}>{MOCK_USER.handle}</p>
              </div>
              {[
                { label: "✍️ My Projects", action: () => router.push("/projects") },
                { label: "📊 Dashboard", action: () => setShowProfileMenu(false) },
              ].map((item) => (
                <button key={item.label} onClick={item.action}
                  style={{ display: "block", width: "100%", padding: "0.5rem 0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "#4a4540", textAlign: "left", borderRadius: "8px", fontFamily: "'DM Sans',sans-serif", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Body: 3-column layout ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 4rem", display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem" }}>

        {/* ── LEFT: Profile sidebar ── */}
        <div style={{ animation: "fadeUp 0.4s ease both" }}>
          <UserProfileCard stats={stats} />

          {/* Quick nav */}
          <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "0.7rem 1rem", borderBottom: "1px solid #f0ebe3" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e9589" }}>Quick Access</p>
            </div>
            {stats?.projectBreakdown.slice(0, 5).map((p) => (
              <div key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 1rem", cursor: "pointer", transition: "background 0.15s", borderBottom: "1px solid #f0ebe3" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: "1rem" }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "#1a120a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                  <p style={{ fontSize: "0.65rem", color: "#9e9589" }}>{p.commits} commits</p>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c8c0b8" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
            {(!stats || stats.projectBreakdown.length === 0) && (
              <p style={{ padding: "1rem", fontSize: "0.75rem", color: "#9e9589" }}>No projects yet.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Main dashboard content ── */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: "1.5rem", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <UserAvatar size={44} />
              <div>
                <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: "#1a120a", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  {MOCK_USER.name}'s Writing Activity
                </h1>
                <p style={{ fontSize: "0.82rem", color: "#9e9589", marginTop: "0.2rem" }}>Every change, every session, every word — tracked automatically.</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem", animation: "fadeUp 0.5s ease 0.1s both" }}>
              <StatCard label="Total Commits" value={stats.totalCommits} sub="all time" accent="#c98c50" />
              <StatCard label="Words Written" value={stats.totalWordsWritten > 999 ? `${(stats.totalWordsWritten / 1000).toFixed(1)}k` : stats.totalWordsWritten} sub="net new words" accent="#1a7a5e" />
              <StatCard label="This Week" value={stats.thisWeekCommits} sub="last 7 days" accent="#3b82c9" />
              <StatCard label="Today" value={stats.todayCommits} sub={new Date().toLocaleDateString("en-US", { weekday: "long" })} accent="#c93b6a" />
              <StatCard label="Streak" value={`${stats.currentStreak}d`} sub={`best: ${stats.longestStreak}d`} accent="#c9a83b" />
            </div>
          )}

          {/* Heatmap */}
          <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", padding: "1.5rem 1.75rem", marginBottom: "1.5rem", animation: "fadeUp 0.5s ease 0.2s both" }}>
            <ContributionHeatmap days={heatmap} onDayClick={setSelectedDay} />
            {selectedDay && (
              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#faf7f4", borderRadius: "10px", border: "1px solid #e8e2d9", animation: "fadeDown 0.2s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>
                    {new Date(selectedDay.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    <span style={{ fontSize: "0.75rem", color: "#9e9589", marginLeft: "0.5rem" }}>— {selectedDay.count} commit{selectedDay.count !== 1 ? "s" : ""}</span>
                  </p>
                  <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9589" }}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {selectedDay.commits.map((c) => {
                    const meta = COMMIT_META[c.type];
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0.6rem", background: "#fff", borderRadius: "8px", border: "1px solid #e8e2d9" }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "20px", background: meta.bg, color: meta.color }}>{meta.label}</span>
                        <span style={{ flex: 1, fontSize: "0.8rem", color: "#2a2520" }}>{c.message}</span>
                        <span style={{ fontSize: "0.7rem", color: c.wordDelta >= 0 ? "#1a7a5e" : "#c93b3b", fontWeight: 600 }}>{c.wordDelta >= 0 ? "+" : ""}{c.wordDelta}w</span>
                        <span style={{ fontSize: "0.68rem", color: "#b8b0a4" }}>{new Date(c.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Commit log + right panel */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem", animation: "fadeUp 0.5s ease 0.3s both" }}>
            <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f0ebe3", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.05rem", color: "#1a120a" }}>Commit History</h2>
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  <button onClick={() => setFilterType("all")} style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", border: filterType === "all" ? "1.5px solid #1a120a" : "1.5px solid #e8e2d9", background: filterType === "all" ? "#1a120a" : "#fff", color: filterType === "all" ? "#fff" : "#9e9589", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}>All</button>
                  {commitTypes.map((t) => { const m = COMMIT_META[t]; return (
                    <button key={t} onClick={() => setFilterType(filterType === t ? "all" : t)} style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", border: `1.5px solid ${filterType === t ? m.color : "#e8e2d9"}`, background: filterType === t ? m.bg : "#fff", color: filterType === t ? m.color : "#9e9589", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{m.label}</button>
                  ); })}
                </div>
              </div>
              <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                {Object.keys(groupedByDate).length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#9e9589" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📝</div>
                    <p style={{ fontFamily: "'DM Serif Display',serif", color: "#4a4540", marginBottom: "0.3rem" }}>No commits yet</p>
                    <p style={{ fontSize: "0.78rem" }}>Start writing — every AI action and edit will appear here.</p>
                  </div>
                ) : (
                  Object.entries(groupedByDate).map(([date, dayCommits]) => (
                    <div key={date}>
                      <div style={{ padding: "0.5rem 1rem", background: "#faf7f4", borderBottom: "1px solid #f0ebe3", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9e9589" }}>{date}</span>
                        <div style={{ flex: 1, height: "1px", background: "#e8e2d9" }} />
                        <span style={{ fontSize: "0.68rem", color: "#b8b0a4" }}>{dayCommits.length} commit{dayCommits.length !== 1 ? "s" : ""}</span>
                      </div>
                      {dayCommits.map((c, i) => <CommitRow key={c.id} commit={c} isFirst={i === 0 && date === Object.keys(groupedByDate)[0]} />)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: type breakdown + summary card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#fff", border: "1px solid #e8e2d9", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid #f0ebe3" }}>
                  <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "0.95rem", color: "#1a120a" }}>Action Breakdown</h3>
                </div>
                <div style={{ padding: "0.75rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {stats && Object.entries(stats.typeCounts).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                    const meta = COMMIT_META[type as CommitType];
                    const total = Object.values(stats.typeCounts).reduce((s, v) => s + v, 0);
                    return (
                      <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, width: "60px", color: meta.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{meta.label}</span>
                        <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#f0ebe3", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: "3px", background: meta.color, width: `${(count / total) * 100}%`, transition: "width 0.6s ease" }} />
                        </div>
                        <span style={{ fontSize: "0.68rem", color: "#9e9589", minWidth: "20px", textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                  {!stats?.typeCounts || Object.keys(stats.typeCounts).length === 0 ? <p style={{ fontSize: "0.78rem", color: "#9e9589" }}>No activity yet.</p> : null}
                </div>
              </div>

              {stats && stats.totalCommits > 0 && (
                <div style={{ background: "linear-gradient(135deg, #1a120a, #2a2015)", borderRadius: "16px", padding: "1.25rem 1.3rem", color: "#faf7f4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <UserAvatar size={28} />
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#c98c50" }}>Writing Summary</p>
                  </div>
                  <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1.4rem", lineHeight: 1.2, marginBottom: "0.4rem" }}>
                    {stats.totalWordsWritten.toLocaleString()} words written
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#9e9589", lineHeight: 1.6 }}>
                    Across {stats.totalCommits} commits in {stats.totalProjects} project{stats.totalProjects !== 1 ? "s" : ""}.
                    {stats.currentStreak > 1 ? ` ${stats.currentStreak}-day streak 🔥` : " Keep writing!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;




