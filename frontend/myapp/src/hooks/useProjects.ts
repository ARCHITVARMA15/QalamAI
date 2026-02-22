"use client";

import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types/project";
// import { Project } from "../../types/project";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // We hardcode owner_id="default" for now since auth isn't wired up
  const ownerId = "default";

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/projects?owner_id=${ownerId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((p: any) => ({
          ...p,
          id: p._id || p.id,
          wordCount: p.wordCount || 0,
          content: p.content || "",
          description: p.description || "",
          emoji: p.emoji || "📝",
          genre: p.genre || "Fiction",
          // Normalize date fields: backend returns ISO strings or timestamps
          createdAt: p.createdAt ? new Date(p.createdAt).getTime()
            : p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime()
            : p.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
        }));
        setProjects(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "wordCount" | "content">) => {
      // Optimistic upate
      const tempId = `temp_${Date.now()}`;
      const newProject: Project = { ...data, id: tempId, createdAt: Date.now(), updatedAt: Date.now(), wordCount: 0, content: "" };
      setProjects((prev) => [newProject, ...prev]);

      try {
        const res = await fetch("http://localhost:8000/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner_id: ownerId, title: data.title, description: data.description }),
        });
        if (res.ok) {
          const result = await res.json();
          // Update temp ID with real DB ID
          setProjects((prev) => prev.map((p) => (p.id === tempId ? { ...p, id: result.project_id } : p)));
          newProject.id = result.project_id;
        }
      } catch (e) {
        console.error("Failed to create project on backend", e);
      }
      return newProject;
    },
    []
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      try {
        await fetch(`http://localhost:8000/api/projects/${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete project on backend", e);
      }
    },
    []
  );

  const renameProject = useCallback(
    async (id: string, title: string) => {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, title, updatedAt: Date.now() } : p)));
      try {
        await fetch(`http://localhost:8000/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      } catch (e) {
        console.error("Failed to rename project on backend", e);
      }
    },
    []
  );

  return { projects, isLoaded, createProject, deleteProject, renameProject, fetchProjects };
}