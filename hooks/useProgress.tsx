"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import React from "react";
import { loadPersistedUserProfile, savePersistedUserProfile } from "@/lib/persistence/profile-store";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";

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

// ─── Local storage helpers ────────────────────────────────────────────────────

function readLocal(): ProgressMap {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as ProgressMap) : {};
  } catch { return {}; }
}

function writeLocal(p: ProgressMap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

// ─── Core Hook ────────────────────────────────────────────────────────────────

export function useProgress() {
  const { userId } = usePrivateRoute();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  // Keep a ref to the full cached profile so we never need to re-fetch before saving
  const profileCacheRef = useRef<Parameters<typeof savePersistedUserProfile>[1] | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  userIdRef.current = userId ?? undefined;

  // ── Supabase save (uses cached profile — no extra fetch) ──────────────────
  const persistToSupabase = useCallback((next: ProgressMap) => {
    const uid = userIdRef.current;
    if (!uid || !profileCacheRef.current) return;
    const updated = { ...profileCacheRef.current, roadmapProgress: next } as Parameters<typeof savePersistedUserProfile>[1];
    profileCacheRef.current = updated;
    void savePersistedUserProfile(uid, updated);
  }, []);

  // ── Combined write: localStorage + Supabase ────────────────────────────────
  const persist = useCallback((next: ProgressMap) => {
    writeLocal(next);
    persistToSupabase(next);
  }, [persistToSupabase]);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setProgress(readLocal());
      setLoaded(true);
      return;
    }

    let cancelled = false;
    void loadPersistedUserProfile(userId).then((profile) => {
      if (cancelled) return;
      // Cache the full profile so future saves can merge without re-fetching
      profileCacheRef.current = (profile ?? {}) as Parameters<typeof savePersistedUserProfile>[1];
      const saved = (profile as { roadmapProgress?: ProgressMap })?.roadmapProgress ?? readLocal();
      setProgress(saved);
      writeLocal(saved);
      setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [userId]);

  // ── Unlock logic ──────────────────────────────────────────────────────────

  const isTaskUnlocked = useCallback((task: Task): boolean => {
    if (!task.prerequisite) return true;
    return !!progress[task.prerequisite];
  }, [progress]);

  // ── Toggle ────────────────────────────────────────────────────────────────

  const uncheckWithDependents = useCallback((taskId: string, allTasks: Task[]) => {
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
      persist(next);
      return next;
    });
  }, [persist]);

  const smartToggle = useCallback((task: Task, allTasks: Task[]) => {
    if (!isTaskUnlocked(task)) return;
    if (progress[task.id]) {
      uncheckWithDependents(task.id, allTasks);
    } else {
      setProgress((prev) => {
        const next = { ...prev, [task.id]: true };
        persist(next);
        return next;
      });
    }
  }, [isTaskUnlocked, progress, uncheckWithDependents, persist]);

  // Use before router.back() — writes synchronously inside setState callback
  // so the save is guaranteed to fire before navigation
  const markComplete = useCallback((taskId: string) => {
    setProgress((prev) => {
      const next = { ...prev, [taskId]: true };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Progress calculators ──────────────────────────────────────────────────

  const isComplete = useCallback((taskId: string): boolean =>
    !!progress[taskId], [progress]);

  const getNodeProgress = useCallback((tasks: Task[]): { done: number; total: number; pct: number } => {
    const total = tasks.length;
    const done  = tasks.filter((t) => progress[t.id]).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, pct };
  }, [progress]);

  const getBranchProgress = useCallback((children: LeafNode[]): { done: number; total: number; pct: number } => {
    return getNodeProgress(children.flatMap((c) => c.tasks ?? []));
  }, [getNodeProgress]);

  const getOverallProgress = useCallback((branches: BranchNode[]): { done: number; total: number; pct: number } => {
    return getNodeProgress(branches.flatMap((b) => b.children.flatMap((c) => c.tasks ?? [])));
  }, [getNodeProgress]);

  const resetProgress = useCallback(() => {
    setProgress({});
    persist({});
  }, [persist]);

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

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const value = useProgress();
  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgressContext must be used inside <ProgressProvider>");
  return ctx;
}
