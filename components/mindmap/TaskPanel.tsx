"use client";

import { useState, useRef, useEffect } from "react";
import { ProgressProvider, useProgressContext } from "@/hooks/useProgress";
import type { BranchNode, LeafNode, Task } from "@/hooks/useProgress";
import roadmapRaw from "@/data/roadmap.json";

// roadmap.json now uses a `categories` schema; adapt it to the BranchNode[]
// shape that the rest of this component expects.
type RawTask = { id: string; label: string; type: string; prerequisite?: string };
type RawLeaf = { id: string; label: string; prerequisite?: string | null; tasks: RawTask[] };
type RawCategory = {
  id: string; label: string; icon: string; color: string; half: string;
  setup: RawLeaf | null; maintenance: RawLeaf | null;
};
type RoadmapCategories = { id: string; label: string; categories: RawCategory[] };

// Flatten categories → BranchNode[] so the existing tree UI keeps working
function buildBranches(raw: RoadmapCategories): BranchNode[] {
  return raw.categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    color: cat.color,
    children: [cat.setup, cat.maintenance]
      .filter((l): l is RawLeaf => l !== null)
      .map((leaf) => ({
        id: leaf.id,
        label: leaf.label,
        color: cat.color,
        tasks: leaf.tasks as Task[],
      })) as LeafNode[],
  })) as BranchNode[];
}

type RoadmapData = {
  id: string;
  label: string;
  children: BranchNode[];
};

const _raw = roadmapRaw as unknown as RoadmapCategories;
const roadmap: RoadmapData = {
  id: _raw.id,
  label: _raw.label,
  children: buildBranches(_raw),
};

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
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-all duration-150"
        style={{
          backgroundColor: complete ? `${color}18` : unlocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          borderColor: complete ? `${color}50` : unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
          opacity: unlocked ? 1 : 0.35,
          cursor: unlocked ? "pointer" : "not-allowed",
          minWidth: "180px",
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
        }}>
          {task.label}
        </span>
        {!unlocked && <span className="ml-auto text-xs opacity-40">🔒</span>}
      </button>
    </div>
  );
}

// ─── Leaf Node ────────────────────────────────────────────────────────────────

function LeafNodeComponent({
  node,
  onHeightChange,
}: {
  node: LeafNode;
  onHeightChange?: (height: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { getNodeProgress } = useProgressContext();
  const { pct } = getNodeProgress(node.tasks);
  const containerRef = useRef<HTMLDivElement>(null);

  // Report height to parent whenever it changes
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
      {/* Leaf button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
        style={{
          backgroundColor: expanded ? `${node.color}22` : "rgba(255,255,255,0.05)",
          borderColor: expanded ? `${node.color}60` : "rgba(255,255,255,0.1)",
          minWidth: "160px",
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
        <span className="text-xs font-medium text-white/80">{node.label}</span>
        <span
          className="ml-auto text-white/30 text-xs transition-transform duration-200"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >›</span>
      </button>

      {/* Expanded tasks */}
      {expanded && (
        <div className="flex items-start ml-3 self-start">
          <div className="w-5 h-px mt-[18px] flex-shrink-0"
            style={{ backgroundColor: `${node.color}40` }} />
          <div className="flex flex-col gap-2 relative">
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

function BranchNodeComponent({ branch }: { branch: BranchNode }) {
  const [expanded, setExpanded] = useState(false);
  const { getBranchProgress } = useProgressContext();
  const { pct } = getBranchProgress(branch.children);

  // Track each child's rendered height so we can center the branch button
  const [childHeights, setChildHeights] = useState<number[]>(
    () => new Array(branch.children.length).fill(40)
  );

  const updateChildHeight = (index: number, height: number) => {
    setChildHeights((prev) => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  };

  const GAP = 12; // gap-3 = 12px
  const totalChildrenHeight =
    childHeights.reduce((sum, h) => sum + h, 0) +
    GAP * (childHeights.length - 1);
  const branchButtonHeight = 44; // approximate button height
  // How much to offset the branch button down so it centers on the children
  const topOffset = Math.max(0, (totalChildrenHeight - branchButtonHeight) / 2);

  return (
    <div className="flex items-start">
      {/* Branch button — offset to vertically center on children */}
      <div
        className="flex flex-col items-start flex-shrink-0"
        style={{ paddingTop: expanded ? topOffset : 0, transition: "padding-top 0.2s ease" }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: expanded ? `${branch.color}25` : "rgba(255,255,255,0.07)",
            borderColor: expanded ? `${branch.color}70` : "rgba(255,255,255,0.12)",
            minWidth: "150px",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: `conic-gradient(${branch.color} ${pct}%, rgba(255,255,255,0.1) 0%)` }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(13,13,20,0.85)" }}
            >
              <span style={{ color: branch.color, fontSize: pct === 100 ? 5 : 7, fontWeight: 800 }}>{pct}%</span>
            </div>
          </div>
          <span className="text-sm" style={{ color: branch.color }}>{branch.label}</span>
          <span
            className="ml-2 text-white/30 text-sm transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >›</span>
        </button>

        {/* Progress bar */}
        <div className="mt-1 mx-1" style={{ width: "calc(100% - 8px)" }}>
          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: `${branch.color}` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded leaf nodes */}
      {expanded && (
        <div className="flex items-start ml-4">
          {/* Horizontal connector from branch to spine */}
          <div className="flex-shrink-0 relative" style={{ width: "16px" }}>
            {/* Vertical spine line spanning all children */}
            <div
              className="absolute w-px"
              style={{
                backgroundColor: `${branch.color}30`,
                left: "50%",
                top: `${childHeights[0] / 2}px`,
                height: `${totalChildrenHeight - childHeights[0] / 2 - childHeights[childHeights.length - 1] / 2}px`,
              }}
            />
            {/* Horizontal ticks — one per child, centered on each child */}
            {branch.children.map((_, i) => {
              const offsetTop =
                childHeights.slice(0, i).reduce((s, h) => s + h + GAP, 0) +
                childHeights[i] / 2;
              return (
                <div
                  key={i}
                  className="absolute h-px w-full"
                  style={{
                    backgroundColor: `${branch.color}40`,
                    top: `${offsetTop}px`,
                  }}
                />
              );
            })}
          </div>

          {/* Leaf nodes stacked with gap */}
          <div className="flex flex-col" style={{ gap: `${GAP}px` }}>
            {branch.children.map((leaf, i) => (
              <LeafNodeComponent
                key={leaf.id}
                node={leaf}
                onHeightChange={(h) => updateChildHeight(i, h)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function MindMapInner() {
  const data = roadmap as RoadmapData;
  const { getOverallProgress } = useProgressContext();
  const { done, total, pct } = getOverallProgress(data.children);

  const [branchHeights, setBranchHeights] = useState<number[]>(
    () => new Array(data.children.length).fill(44)
  );

  const updateBranchHeight = (index: number, height: number) => {
    setBranchHeights((prev) => {
      if (prev[index] === height) return prev;
      const next = [...prev];
      next[index] = height;
      return next;
    });
  };

  const GAP = 20; // gap-5 = 20px
  const totalBranchHeight =
    branchHeights.reduce((sum, h) => sum + h, 0) +
    GAP * (branchHeights.length - 1);
  const rootHeight = 80;
  const rootTopOffset = Math.max(0, (totalBranchHeight - rootHeight) / 2);

  return (
    <div className="flex items-start p-8 overflow-auto min-h-screen bg-[#0d0d14]">

      {/* Root node — centered on all branches */}
      <div
        className="flex items-center flex-shrink-0 mr-2"
        style={{ paddingTop: rootTopOffset, transition: "padding-top 0.2s ease" }}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className="px-5 py-3 rounded-2xl border-2 font-bold"
            style={{
              backgroundColor: "#1a1505",
              borderColor: "#f0c04060",
              color: "#f0c040",
              minWidth: "140px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800 }}>Financial</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Freedom</div>
            <div style={{ fontSize: 10, color: "#f0c04080", marginTop: 4 }}>{pct}% complete</div>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #f0c040, #4ade80)" }}
            />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{done} / {total} tasks</div>
        </div>
        <div className="w-6 h-px bg-white/20 mx-2" />
      </div>

      {/* Branches */}
      <div className="relative" style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
        {/* Vertical spine */}
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
            gap={GAP}
            onHeightChange={updateBranchHeight}
          />
        ))}
      </div>
    </div>
  );
}

export default function MindMap() {
  return (
    <ProgressProvider>
      <MindMapInner />
    </ProgressProvider>
  );
}

// ─── Branch Height Wrapper ────────────────────────────────────────────────────
// Measures each branch's total height and reports it up to MindMap

function BranchHeightWrapper({
  branch,
  index,
  branchHeights,
  gap,
  onHeightChange,
}: {
  branch: BranchNode;
  index: number;
  branchHeights: number[];
  gap: number;
  onHeightChange: (index: number, height: number) => void;
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

  // Horizontal tick from spine to branch button, centered on this branch
  const tickTop = branchHeights[index] / 2;

  return (
    <div ref={ref} className="flex items-start relative">
      {/* Horizontal tick from spine */}
      <div
        className="absolute h-px"
        style={{
          backgroundColor: `${branch.color}40`,
          left: 0,
          top: `${tickTop}px`,
          width: "16px",
        }}
      />
      <div style={{ marginLeft: "16px" }}>
        <BranchNodeComponent branch={branch} />
      </div>
    </div>
  );
}