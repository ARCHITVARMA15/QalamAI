"use client";

import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types/project";
// import { Project } from "../../types/project";

const STORAGE_KEY = "writeai_projects";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProjects(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load projects", e);
    }
    setIsLoaded(true);
  }, []);

  const save = useCallback((updated: Project[]) => {
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const createProject = useCallback(
    (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "wordCount" | "content">) => {
      const newProject: Project = {
        ...data,
        id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        wordCount: 0,
        content: "",
      };
      save([newProject, ...projects]);
      return newProject;
    },
    [projects, save]
  );

  const deleteProject = useCallback(
    (id: string) => {
      save(projects.filter((p) => p.id !== id));
    },
    [projects, save]
  );

  const renameProject = useCallback(
    (id: string, title: string) => {
      save(projects.map((p) => (p.id === id ? { ...p, title, updatedAt: Date.now() } : p)));
    },
    [projects, save]
  );

  return { projects, isLoaded, createProject, deleteProject, renameProject };
}