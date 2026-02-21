"use client";

import { useState, useRef, useCallback } from "react";
import { uploadFile, UploadResponse } from "@/lib/api";

interface Props {
  projectId: string;
  onUpload: (file: UploadResponse) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "uploading" | "done" | "error";
}

 function FileUploadZone({ projectId, onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const id = `f_${Date.now()}`;
    const entry: UploadedFile = {
      id, name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || "unknown",
      status: "uploading",
    };
    setFiles(prev => [entry, ...prev]);
    try {
      const result = await uploadFile(file, projectId);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "done" } : f));
      onUpload(result);
    } catch {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "error" } : f));
    }
  }, [projectId, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) Array.from(e.target.files).forEach(processFile);
  };

  const getIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("text")) return "📝";
    if (type.includes("word") || type.includes("document")) return "📃";
    return "📎";
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: dragging ? "2px dashed #c96a3b" : "2px dashed #d4cdc5",
          borderRadius: "12px", padding: "1.5rem",
          textAlign: "center", cursor: "pointer",
          background: dragging ? "rgba(201,106,59,0.04)" : "transparent",
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>📁</div>
        <p style={{ fontSize: "0.82rem", color: "#4a4540", marginBottom: "0.25rem", fontWeight: 500 }}>
          Drop files here or <span style={{ color: "#c96a3b", textDecoration: "underline" }}>browse</span>
        </p>
        <p style={{ fontSize: "0.72rem", color: "#9e9589" }}>PDF, TXT, DOCX, PNG, JPG supported</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.gif,.webp"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.5rem 0.75rem", borderRadius: "8px",
              background: "#fff", border: "1px solid #e8e2d9",
            }}>
              <span style={{ fontSize: "1rem" }}>{getIcon(f.type)}</span>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "#1a1510", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                <p style={{ fontSize: "0.68rem", color: "#9e9589" }}>{f.size}</p>
              </div>
              {f.status === "uploading" && (
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid #e8e2d9", borderTopColor: "#c96a3b", animation: "spin 0.8s linear infinite" }} />
              )}
              {f.status === "done" && <span style={{ color: "#27ae60", fontSize: "0.8rem" }}>✓</span>}
              {f.status === "error" && <span style={{ color: "#c0392b", fontSize: "0.8rem" }}>✗</span>}
              <button
                onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9589", fontSize: "0.75rem", padding: "0.1rem" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
export default FileUploadZone;