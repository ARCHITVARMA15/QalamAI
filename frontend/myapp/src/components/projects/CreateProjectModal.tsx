"use client";

import { useState, useRef, useEffect } from "react";
import { Project, Genre } from "@/types/project";

const EMOJIS = ["📖", "✍️", "🌙", "🔮", "⚔️", "🌿", "🐉", "🚀", "🏰", "🕵️", "💀", "🌊", "🎭", "🦋", "🌸", "⚡", "🎪", "🌺"];
const GENRES: Genre[] = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Literary", "Horror", "Other"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "wordCount" | "content">) => Project;
  onCreated: (project: Project) => void;
}

 function CreateProjectModal({ isOpen, onClose, onCreate, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📖");
  const [genre, setGenre] = useState<Genre>("Fantasy");
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setEmoji("📖");
      setGenre("Fantasy");
      setTitleError(false);
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!title.trim()) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    const project = onCreate({ title: title.trim(), description: description.trim(), emoji, genre });
    onCreated(project);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) handleCreate();
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,12,9,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-8"
        style={{
          background: "#faf7f4",
          boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
          animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.8rem", letterSpacing: "-0.03em", color: "#1a1510" }}>
            New Project
          </h2>
          <p style={{ color: "#9e9589", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Give your story a name and start writing.
          </p>
        </div>

        {/* Emoji Picker */}
        <div className="mb-5">
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a1510", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pick an Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  width: "42px", height: "42px", borderRadius: "10px", fontSize: "1.3rem",
                  border: emoji === e ? "2px solid #c96a3b" : "1.5px solid #e8e2d9",
                  background: emoji === e ? "rgba(201,106,59,0.08)" : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a1510", display: "block", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Title <span style={{ color: "#c96a3b" }}>*</span>
          </label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
            placeholder="e.g. The Forgotten Kingdom"
            maxLength={60}
            style={{
              width: "100%", padding: "0.7rem 0.9rem",
              border: titleError ? "1.5px solid #c0392b" : "1.5px solid #e8e2d9",
              borderRadius: "10px", fontSize: "0.9rem",
              fontFamily: "'DM Sans', sans-serif",
              background: "#fff", color: "#1a1510", outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = titleError ? "#c0392b" : "#c96a3b")}
            onBlur={(e) => (e.target.style.borderColor = titleError ? "#c0392b" : "#e8e2d9")}
          />
          {titleError && <p style={{ color: "#c0392b", fontSize: "0.78rem", marginTop: "0.3rem" }}>Please enter a project title.</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a1510", display: "block", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this story about?"
            rows={2}
            style={{
              width: "100%", padding: "0.7rem 0.9rem",
              border: "1.5px solid #e8e2d9", borderRadius: "10px",
              fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif",
              background: "#fff", color: "#1a1510", outline: "none",
              resize: "vertical", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#c96a3b")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e2d9")}
          />
        </div>

        {/* Genre */}
        <div className="mb-7">
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a1510", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Genre
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                style={{
                  padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.8rem",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  border: genre === g ? "1.5px solid #c96a3b" : "1.5px solid #e8e2d9",
                  background: genre === g ? "rgba(201,106,59,0.08)" : "#fff",
                  color: genre === g ? "#c96a3b" : "#9e9589",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.6rem 1.2rem", borderRadius: "10px",
              border: "1.5px solid #e8e2d9", background: "transparent",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem",
              color: "#9e9589", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#1a1510"; (e.target as HTMLButtonElement).style.borderColor = "#1a1510"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "#9e9589"; (e.target as HTMLButtonElement).style.borderColor = "#e8e2d9"; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            style={{
              padding: "0.6rem 1.5rem", borderRadius: "10px", border: "none",
              background: "#1a1510", color: "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "#c96a3b"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "#1a1510"; }}
          >
            Create Project →
          </button>
        </div>

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default CreateProjectModal;