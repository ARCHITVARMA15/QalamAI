"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/types/project";
import ProjectCard from "@/components/projects/ProjectCard";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

 function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoaded, createProject, deleteProject, renameProject } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleCreated = (project: Project) => {
    showToast("✨ Project created!");
    setTimeout(() => router.push(`/projects/${project.id}`), 500);
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ─── Google Font ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #faf7f4;
          margin: 0;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes toastSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        ::placeholder { color: #b8b0a4; }
        input, textarea { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ─── Background ─── */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 60% 50% at 10% 20%, rgba(201,106,59,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 90% 80%, rgba(124,92,191,0.07) 0%, transparent 60%)
          `,
        }}
      />

      {/* ─── Navbar ─── */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2.5rem", height: "64px",
          background: "rgba(250,247,244,0.88)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e8e2d9",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem",
            letterSpacing: "-0.02em", color: "#1a1510", textDecoration: "none",
          }}
        >
          Write<span style={{ color: "#c96a3b" }}>AI</span>
        </a>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.55rem 1.25rem",
            background: "#1a1510", color: "#fff",
            border: "none", borderRadius: "10px",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 500,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#c96a3b"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1510"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
      </nav>

      {/* ─── Main ─── */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "3rem 2.5rem" }}>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ animation: "fadeUp 0.4s ease both" }}>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                letterSpacing: "-0.03em", lineHeight: 1.1, color: "#1a1510",
              }}
            >
              My Projects
            </h1>
            <p style={{ color: "#9e9589", fontSize: "0.88rem", marginTop: "0.3rem" }}>
              {isLoaded ? `${projects.length} project${projects.length !== 1 ? "s" : ""}` : "Loading…"}
            </p>
          </div>

          {/* Search */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1rem",
              background: "#fff", border: "1px solid #e8e2d9",
              borderRadius: "10px", width: "220px",
              animation: "fadeUp 0.4s ease 0.05s both",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={() => {}}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9e9589" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: "0.85rem", color: "#1a1510", width: "100%",
              }}
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* New Project Card */}
          <NewProjectButton onClick={() => setModalOpen(true)} />

          {/* Skeleton while loading */}
          {!isLoaded &&
            [1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "3/4", borderRadius: "18px",
                  background: "linear-gradient(90deg, #f0ebe3 25%, #faf7f4 50%, #f0ebe3 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                  border: "1px solid #e8e2d9",
                }}
              />
            ))}

          {/* Project Cards */}
          {isLoaded &&
            filtered.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={(id) => { deleteProject(id); showToast("Project deleted."); }}
                onRename={renameProject}
                animationDelay={0.06 + i * 0.06}
              />
            ))}

          {/* Empty state */}
          {isLoaded && projects.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1", textAlign: "center",
                padding: "5rem 2rem", color: "#9e9589",
                animation: "fadeUp 0.4s ease 0.1s both",
              }}
            >
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✍️</div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.5rem", color: "#1a1510", marginBottom: "0.5rem" }}>
                No projects yet
              </h3>
              <p style={{ fontSize: "0.88rem" }}>
                Click{" "}
                <button
                  onClick={() => setModalOpen(true)}
                  style={{ color: "#c96a3b", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "inherit", fontWeight: 500, textDecoration: "underline", padding: 0 }}
                >
                  New Project
                </button>{" "}
                to start your first story.
              </p>
            </div>
          )}

          {/* No search results */}
          {isLoaded && projects.length > 0 && filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "#9e9589" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
              <p>No projects match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </main>

      {/* ─── Modal ─── */}
      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createProject}
        onCreated={handleCreated}
      />

      {/* ─── Toast ─── */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: "2rem", right: "2rem", zIndex: 100,
            background: "#1a1510", color: "#fff",
            padding: "0.8rem 1.3rem", borderRadius: "12px",
            fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            animation: "toastSlide 0.3s ease both",
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

/* ─── New Project Button Card ─── */
function NewProjectButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "3/4",
        border: hovered ? "2px dashed #c96a3b" : "2px dashed #d4cdc5",
        borderRadius: "18px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "0.8rem",
        cursor: "pointer",
        background: hovered ? "rgba(201,106,59,0.03)" : "transparent",
        color: hovered ? "#c96a3b" : "#b8b0a4",
        transition: "all 0.25s cubic-bezier(0.34,1.2,0.64,1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          width: "52px", height: "52px", borderRadius: "50%",
          border: "2px solid currentColor",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", lineHeight: 1,
          transition: "transform 0.3s",
          transform: hovered ? "rotate(90deg)" : "rotate(0deg)",
        }}
      >
        +
      </div>
      <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>New Project</span>
    </button>
  );
}
export default ProjectsPage;