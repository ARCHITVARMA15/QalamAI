"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types/project";

interface Props {
  project: Project;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  animationDelay?: number;
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

 function ProjectCard({ project, onDelete, onRename, animationDelay = 0 }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      onDelete(project.id);
    }
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    const name = prompt("Rename project:", project.title);
    if (name?.trim()) onRename(project.id, name.trim());
  };

  return (
    <div
      onClick={() => router.push(`/projects/${project.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        aspectRatio: "3 / 4",
        background: "#ffffff",
        borderRadius: "18px",
        border: isHovered ? "1px solid transparent" : "1px solid #e8e2d9",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.34,1.2,0.64,1)",
        boxShadow: isHovered ? "0 12px 40px rgba(0,0,0,0.13)" : "0 2px 16px rgba(0,0,0,0.07)",
        transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        overflow: "hidden",
        animation: `fadeUp 0.4s ease ${animationDelay}s both`,
      }}
    >
      {/* Top accent bar on hover */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: "linear-gradient(90deg, #c96a3b, #7c5cbf)",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.25s",
        }}
      />

      {/* Three-dot menu */}
      <div
        ref={menuRef}
        style={{ position: "absolute", top: "0.9rem", right: "0.9rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          style={{
            width: "30px", height: "30px", borderRadius: "7px",
            border: "none", background: "transparent",
            cursor: "pointer", color: "#9e9589",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: isHovered || menuOpen ? 1 : 0,
            transition: "opacity 0.2s, background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f1eb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Project options"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute", top: "36px", right: 0,
              background: "#fff", border: "1px solid #e8e2d9",
              borderRadius: "12px", padding: "0.35rem",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              zIndex: 10, minWidth: "150px",
              animation: "fadeUp 0.15s ease both",
            }}
          >
            <button onClick={handleRename} style={menuItemStyle}>
              ✏️ &nbsp;Rename
            </button>
            <div style={{ height: "1px", background: "#f0ebe3", margin: "0.25rem 0" }} />
            <button onClick={handleDelete} style={{ ...menuItemStyle, color: "#c0392b" }}>
              🗑️ &nbsp;Delete
            </button>
          </div>
        )}
      </div>

      {/* Emoji */}
      <div style={{ fontSize: "2.4rem", marginBottom: "auto", userSelect: "none" }}>
        {project.emoji}
      </div>

      {/* Card body */}
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "1.2rem", letterSpacing: "-0.02em",
            lineHeight: 1.25, color: "#1a1510", marginBottom: "0.4rem",
          }}
        >
          {project.title}
        </div>
        {project.description && (
          <div
            style={{
              fontSize: "0.78rem", color: "#9e9589",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
              lineHeight: 1.5, marginBottom: "0.6rem",
            }}
          >
            {project.description}
          </div>
        )}

        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: "0.75rem", borderTop: "1px solid #f0ebe3",
          }}
        >
          <span style={{ fontSize: "0.73rem", color: "#9e9589" }}>
            {project.wordCount.toLocaleString()} words
          </span>
          <span
            style={{
              fontSize: "0.68rem", fontWeight: 500,
              padding: "0.18rem 0.55rem", borderRadius: "20px",
              background: "#f5f1eb", color: "#9e9589",
            }}
          >
            {formatTimeAgo(project.updatedAt)}
          </span>
        </div>

        {/* Genre tag */}
        <div style={{ marginTop: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.68rem", fontWeight: 600,
              padding: "0.2rem 0.6rem", borderRadius: "20px",
              background: "rgba(201,106,59,0.08)", color: "#c96a3b",
              letterSpacing: "0.02em",
            }}
          >
            {project.genre}
          </span>
        </div>
      </div>
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", width: "100%",
  padding: "0.5rem 0.75rem", borderRadius: "8px",
  border: "none", background: "transparent",
  fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem",
  color: "#1a1510", cursor: "pointer", textAlign: "left",
  transition: "background 0.15s",
};

export default ProjectCard;