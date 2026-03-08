"use client";

import { useState, useEffect, createContext, useContext } from "react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Task = {
  id: string;
  label: string;
  prerequisite?: string;
};

export type LeafNode = {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
};

export type BranchNode = {
  id: string;
  label: string;
  color: string;
  children: LeafNode[];
};

export type RoadmapData = {
  id: string;
  label: string;
  children: BranchNode[];
};

type ProgressMap = Record<string, boolean>;

const STORAGE_KEY = "maplemind_progress";

// ─── Core Hook ────────────────────────────────────────────────────────────────

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress(JSON.parse(stored));
    } catch {
      console.warn("Could not load progress from localStorage");
    }
  }, []);

  // Persist to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      console.warn("Could not save progress to localStorage");
    }
  }, [progress]);

  // ─── Unlock logic ──────────────────────────────────────────────────────────

  const isTaskUnlocked = (task: Task): boolean => {
    if (!task.prerequisite) return true;
    return !!progress[task.prerequisite];
  };

  // ─── Toggle ───────────────────────────────────────────────────────────────

  const uncheckWithDependents = (taskId: string, allTasks: Task[]) => {
    const dependentMap: Record<string, string[]> = {};
    allTasks.forEach((t) => {
      if (t.prerequisite) {
        if (!dependentMap[t.prerequisite]) dependentMap[t.prerequisite] = [];
        dependentMap[t.prerequisite].push(t.id);
      }
    });

    const toUncheck = new Set<string>();
    const collect = (id: string) => {
      toUncheck.add(id);
      (dependentMap[id] ?? []).forEach(collect);
    };
    collect(taskId);

    setProgress((prev) => {
      const next = { ...prev };
      toUncheck.forEach((id) => { next[id] = false; });
      return next;
    });
  };

  const smartToggle = (task: Task, allTasks: Task[]) => {
    if (!isTaskUnlocked(task)) return;
    if (progress[task.id]) {
      uncheckWithDependents(task.id, allTasks);
    } else {
      setProgress((prev) => ({ ...prev, [task.id]: true }));
    }
  };

  // Synchronously writes to localStorage — use before router.back() to avoid
  // the race condition where navigation fires before the React state flush.
  const markComplete = (taskId: string) => {
    setProgress((prev) => {
      const next = { ...prev, [taskId]: true };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ─── Progress calculators ─────────────────────────────────────────────────

  const isComplete = (taskId: string): boolean => !!progress[taskId];

  const getNodeProgress = (tasks: Task[]): { done: number; total: number; pct: number } => {
    const total = tasks.length;
    const done = tasks.filter((t) => progress[t.id]).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, pct };
  };

  const getBranchProgress = (children: LeafNode[]): { done: number; total: number; pct: number } => {
    const allTasks = children.flatMap((child) => child.tasks ?? []);
    return getNodeProgress(allTasks);
  };

  const getOverallProgress = (branches: BranchNode[]): { done: number; total: number; pct: number } => {
    const allTasks = branches.flatMap((branch) =>
      branch.children.flatMap((child) => child.tasks ?? [])
    );
    return getNodeProgress(allTasks);
  };

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetProgress = () => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    progress,
    smartToggle,
    markComplete,
    isTaskUnlocked,
    isComplete,
    getNodeProgress,
    getBranchProgress,
    getOverallProgress,
    resetProgress,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProgressContext = createContext<ReturnType<typeof useProgress> | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const value = useProgress();
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// ─── Context Hook ─────────────────────────────────────────────────────────────

export function useProgressContext() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgressContext must be used inside <ProgressProvider>");
  return context;
}