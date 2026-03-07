"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ProgressProvider, useProgressContext } from "@/hooks/useProgress";
import type { BranchNode, LeafNode, Task } from "@/hooks/useProgress";
import roadmap from "@/data/roadmap.json";
import Link from "next/link";

type RoadmapData = {
  id: string;
  label: string;
  children: BranchNode[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_WIDTHS = {
  root: 160,
  branch: 180,
  leaf: 190,
  task: 220,
};

const GAP_BRANCH = 20;
const GAP_LEAF = 12;
const GAP_TASK = 8;

// ─── Task Node ────────────────────────────────────────────────────────────────

function TaskNode({ task, allTasks, color }: { task: Task; allTasks: Task[]; color: string }) {
  const { smartToggle, isTaskUnlocked, isComplete } = useProgressContext();
  const unlocked = isTaskUnlocked(task);
  const complete = isComplete(task.id);

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color, opacity: unlocked ? 1 : 0.3 }} />
      <button
        onClick={() => unlocked && smartToggle(task, allTasks)}
        disabled={!unlocked}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150"
        style={{
          width: NODE_WIDTHS.task,
          minWidth: NODE_WIDTHS.task,
          backgroundColor: complete ? `${color}18` : unlocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          borderColor: complete ? `${color}50` : unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
          opacity: unlocked ? 1 : 0.35,
          cursor: unlocked ? "pointer" : "not-allowed",
        }}
      >
        <div
          className="w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center transition-all duration-150"
          style={{
            borderColor: complete ? color : unlocked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
            backgroundColor: complete ? color : "transparent",
          }}
        >
          {complete && <span style={{ fontSize: 8, color: "#000", fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{
          color: complete ? "rgba(255,255,255,0.35)" : unlocked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
          textDecoration: complete ? "line-through" : "none",
          fontSize: 12,
          flex: 1,
        }}>
          {task.label}
        </span>
        {!unlocked && <span className="text-xs opacity-40 flex-shrink-0">🔒</span>}
      </button>
    </div>
  );
}

// ─── Leaf Node ────────────────────────────────────────────────────────────────

function LeafNodeComponent({
  node,
  onHeightChange,
  onSelect,
}: {
  node: LeafNode;
  onHeightChange?: (height: number) => void;
  onSelect?: (node: LeafNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { getNodeProgress } = useProgressContext();
  const { pct } = getNodeProgress(node.tasks);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !onHeightChange) return;
    const observer = new ResizeObserver(() => {
      onHeightChange(containerRef.current?.offsetHeight ?? 0);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div ref={containerRef} className="flex items-start">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
        style={{
          width: NODE_WIDTHS.leaf,
          minWidth: NODE_WIDTHS.leaf,
          backgroundColor: expanded ? `${node.color}22` : "rgba(255,255,255,0.05)",
          borderColor: expanded ? `${node.color}60` : "rgba(255,255,255,0.1)",
          alignSelf: "flex-start",
        }}
      >
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: `conic-gradient(${node.color} ${pct}%, rgba(255,255,255,0.1) 0%)` }}
        >
          <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full bg-[#0d0d14] flex items-center justify-center">
            <span style={{ color: node.color, fontSize: pct === 100 ? 5 : 7, fontWeight: 700 }}>{pct}%</span>
          </div>
        </div>
        <span className="text-xs font-medium text-white/80 flex-1 text-left">{node.label}</span>
        <span
          className="text-white/30 text-xs transition-transform duration-200 flex-shrink-0"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >›</span>
      </button>

      {expanded && (
        <div className="flex items-start ml-3 self-start">
          <div className="w-5 h-px mt-[18px] flex-shrink-0"
            style={{ backgroundColor: `${node.color}40` }} />
          <div className="flex flex-col relative" style={{ gap: GAP_TASK }}>
            <div
              className="absolute w-px"
              style={{
                backgroundColor: `${node.color}30`,
                left: "-2px",
                top: "10px",
                bottom: "10px",
              }}
            />
            {node.tasks.map((task) => (
              <TaskNode key={task.id} task={task} allTasks={node.tasks} color={node.color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Branch Node ──────────────────────────────────────────────────────────────

function BranchNodeComponent({ branch, onSelect }: { branch: BranchNode; onSelect?: (node: LeafNode) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { getBranchProgress } = useProgressContext();
  const { pct } = getBranchProgress(branch.children);
  const branchButtonRef = useRef<HTMLDivElement>(null);
  const [branchButtonHeight, setBranchButtonHeight] = useState(44);

  // Measure actual branch button height
  useEffect(() => {
    if (!branchButtonRef.current) return;
    const observer = new ResizeObserver(() => {
      setBranchButtonHeight(branchButtonRef.current?.offsetHeight ?? 44);
    });
    observer.observe(branchButtonRef.current);
    return () => observer.disconnect();
  }, []);

  const [childHeights, setChildHeights] = useState<number[]>(
    () => new Array(branch.children.length).fill(40)
  );

  const updateChildHeight = useCallback((index: number, height: number) => {
    setChildHeights((prev) => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  }, []);

  const totalChildrenHeight =
    childHeights.reduce((sum, h) => sum + h, 0) +
    GAP_LEAF * (childHeights.length - 1);
  const topOffset = Math.max(0, (totalChildrenHeight - branchButtonHeight) / 2);

  return (
    <div className="flex items-start">
      {/* Branch button */}
      <div
        ref={branchButtonRef}
        className="flex flex-col items-start flex-shrink-0"
        style={{ paddingTop: expanded ? topOffset : 0, transition: "padding-top 0.2s ease" }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            width: NODE_WIDTHS.branch,
            minWidth: NODE_WIDTHS.branch,
            backgroundColor: expanded ? `${branch.color}25` : "rgba(255,255,255,0.07)",
            borderColor: expanded ? `${branch.color}70` : "rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: `conic-gradient(${branch.color} ${pct}%, rgba(255,255,255,0.1) 0%)` }}
          >
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(13,13,20,0.85)" }}>
              <span style={{ color: branch.color, fontSize: pct === 100 ? 5 : 7, fontWeight: 800 }}>{pct}%</span>
            </div>
          </div>
          <span className="text-sm flex-1 text-left" style={{ color: branch.color }}>{branch.label}</span>
          <span
            className="text-white/30 text-sm transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >›</span>
        </button>
        <div className="mt-1 mx-1" style={{ width: NODE_WIDTHS.branch - 8 }}>
          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: branch.color }} />
          </div>
        </div>
      </div>

      {/* Leaf nodes */}
      {expanded && (
        <div className="flex items-start ml-4">
          <div className="flex-shrink-0 relative" style={{ width: 16 }}>
            <div
              className="absolute w-px"
              style={{
                backgroundColor: `${branch.color}30`,
                left: "50%",
                top: `${childHeights[0] / 2}px`,
                height: `${totalChildrenHeight - childHeights[0] / 2 - childHeights[childHeights.length - 1] / 2}px`,
              }}
            />
            {branch.children.map((_, i) => {
              const offsetTop =
                childHeights.slice(0, i).reduce((s, h) => s + h + GAP_LEAF, 0) +
                childHeights[i] / 2;
              return (
                <div key={i} className="absolute h-px w-full"
                  style={{ backgroundColor: `${branch.color}40`, top: `${offsetTop}px` }} />
              );
            })}
          </div>
          <div className="flex flex-col" style={{ gap: GAP_LEAF }}>
            {branch.children.map((leaf, i) => (
              <LeafNodeComponent
                key={leaf.id}
                node={leaf}
                onHeightChange={(h) => updateChildHeight(i, h)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Branch Height Wrapper ────────────────────────────────────────────────────

function BranchHeightWrapper({
  branch,
  index,
  branchHeights,
  onHeightChange,
  onSelect,
}: {
  branch: BranchNode;
  index: number;
  branchHeights: number[];
  onHeightChange: (index: number, height: number) => void;
  onSelect?: (node: LeafNode) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(() => {
      onHeightChange(index, ref.current?.offsetHeight ?? 44);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index, onHeightChange]);

  const tickTop = branchHeights[index] / 2;

  return (
    <div ref={ref} className="flex items-start relative">
      <div className="absolute h-px"
        style={{ backgroundColor: `${branch.color}40`, left: 0, top: `${tickTop}px`, width: 16 }} />
      <div style={{ marginLeft: 16 }}>
        <BranchNodeComponent branch={branch} onSelect={onSelect} />
      </div>
    </div>
  );
}

// ─── Mind Map ─────────────────────────────────────────────────────────────────

function MindMap({ onSelectLeaf }: { onSelectLeaf?: (node: LeafNode) => void }) {
  const data = roadmap as RoadmapData;
  const { getOverallProgress } = useProgressContext();
  const { done, total, pct } = getOverallProgress(data.children);

  const [branchHeights, setBranchHeights] = useState<number[]>(
    () => new Array(data.children.length).fill(44)
  );

  const updateBranchHeight = useCallback((index: number, height: number) => {
    setBranchHeights((prev) => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  }, []);

  const totalBranchHeight =
    branchHeights.reduce((sum, h) => sum + h, 0) +
    GAP_BRANCH * (branchHeights.length - 1);
  const rootHeight = 90;
  const rootTopOffset = Math.max(0, (totalBranchHeight - rootHeight) / 2);

  return (
    <div className="flex items-start p-12">
      {/* Root node */}
      <div
        className="flex items-center flex-shrink-0 mr-2"
        style={{ paddingTop: rootTopOffset, transition: "padding-top 0.2s ease" }}
      >
        <div className="flex flex-col items-center gap-1" style={{ width: NODE_WIDTHS.root }}>
          <div
            className="w-full px-5 py-3 rounded-2xl border-2 font-bold"
            style={{
              backgroundColor: "#1a1505",
              borderColor: "#a63e24",
              color: "#ff6038",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800 }}>Financial</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Freedom</div>
            <div style={{ fontSize: 10, color: "#f0c04080", marginTop: 4 }}>{pct}% complete</div>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ff6038, #4ade80)" }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{done} / {total} tasks</div>
        </div>
        <div className="w-6 h-px bg-white/20 mx-2 flex-shrink-0" />
      </div>

      {/* Branches */}
      <div className="relative flex flex-col" style={{ gap: GAP_BRANCH }}>
        <div
          className="absolute w-px"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            left: 0,
            top: `${branchHeights[0] / 2}px`,
            height: `${totalBranchHeight - branchHeights[0] / 2 - branchHeights[branchHeights.length - 1] / 2}px`,
          }}
        />
        {data.children.map((branch, i) => (
          <BranchHeightWrapper
            key={branch.id}
            branch={branch}
            index={i}
            branchHeights={branchHeights}
            onHeightChange={updateBranchHeight}
            onSelect={onSelectLeaf}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialMindMapPage() {
  const [zoom, setZoom] = useState(1);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(1))));
  const zoomOut = () => setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))));
  const resetZoom = () => setZoom(1);

  // Scroll-to-zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Math.max(0.4, parseFloat((z - e.deltaY * 0.001).toFixed(2)))));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  return (
    <ProgressProvider>
      <div className="flex flex-col h-screen bg-[#0d0d14] overflow-hidden">

        {/* ── Navbar ── */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d0d14] z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">← Back</Link>
            <div style={{ fontFamily: "serif", fontSize: 18, fontWeight: 800, color: "#ff6038" }}>
              MapleMind
            </div>
            <span className="text-white/20 text-sm">/ Financial Roadmap</span>
          </div>

          {/* Overall progress in navbar */}
          <OverallProgressBar />

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button onClick={zoomOut}
              className="w-7 h-7 rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors flex items-center justify-center text-sm">
              −
            </button>
            <button onClick={resetZoom}
              className="px-2 h-7 rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors text-xs min-w-[48px]">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={zoomIn}
              className="w-7 h-7 rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors flex items-center justify-center text-sm">
              +
            </button>
          </div>
        </header>

        {/* ── Canvas + Sidebar ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Canvas */}
          <div ref={canvasRef} className="flex-1 overflow-auto">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                transition: "transform 0.15s ease",
                width: `${100 / zoom}%`,
                minHeight: `${100 / zoom}%`,
              }}
            >
              <MindMap onSelectLeaf={setSelectedLeaf} />
            </div>
          </div>

          {/* Sidebar — scaffold for leaf node zoom (populated later) */}
          {selectedLeaf && (
            <div
              className="flex-shrink-0 border-l border-white/10 bg-[#0d0d14] overflow-y-auto"
              style={{ width: 300, animation: "slideIn 0.2s ease" }}
            >
              <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold" style={{ color: selectedLeaf.color }}>
                    {selectedLeaf.label}
                  </h2>
                  <button onClick={() => setSelectedLeaf(null)}
                    className="text-white/30 hover:text-white/60 text-sm transition-colors">✕</button>
                </div>
                {/* Leaf detail content goes here in the future */}
                <p className="text-xs text-white/30">Detailed view coming soon.</p>
              </div>
            </div>
          )}
        </div>

        {/* Zoom hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/20 pointer-events-none">
          Ctrl + scroll to zoom · use +/− buttons or click % to reset
        </div>
      </div>
    </ProgressProvider>
  );
}

// ─── Overall Progress Bar (reads from context) ────────────────────────────────

function OverallProgressBar() {
  const { getOverallProgress } = useProgressContext();
  const data = roadmap as RoadmapData;
  const { done, total, pct } = getOverallProgress(data.children);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40">Overall progress</span>
      <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ff6038, #4ade80)" }}
        />
      </div>
      <span className="text-xs font-bold text-white/60">{pct}%</span>
      <span className="text-xs text-white/30">{done}/{total}</span>
    </div>
  );
}