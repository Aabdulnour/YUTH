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

const NODE_WIDTHS = {
  root: 160,
  branch: 180,
  leaf: 190,
  task: 220,
};

const NODE_HEIGHTS = {
  collapsedBranch: 44,
};

const GAP_BRANCH = 20;
const GAP_LEAF = 12;
const GAP_TASK = 8;
const CONNECTOR_WIDTH = 16;
const LEAF_EXPANDED_EXTRA_WIDTH = 260;

function TaskNode({
  task,
  allTasks,
  color,
}: {
  task: Task;
  allTasks: Task[];
  color: string;
}) {
  const { smartToggle, isTaskUnlocked, isComplete } = useProgressContext();
  const unlocked = isTaskUnlocked(task);
  const complete = isComplete(task.id);

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color, opacity: unlocked ? 1 : 0.3 }}
      />

      <button
        onClick={() => unlocked && smartToggle(task, allTasks)}
        disabled={!unlocked}
        className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all duration-150"
        style={{
          width: NODE_WIDTHS.task,
          minWidth: NODE_WIDTHS.task,
          backgroundColor: complete
            ? `${color}18`
            : unlocked
              ? "rgba(255,255,255,0.04)"
              : "rgba(255,255,255,0.02)",
          borderColor: complete
            ? `${color}50`
            : unlocked
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.05)",
          opacity: unlocked ? 1 : 0.35,
          cursor: unlocked ? "pointer" : "not-allowed",
        }}
      >
        <div
          className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border transition-all duration-150"
          style={{
            borderColor: complete
              ? color
              : unlocked
                ? "rgba(255,255,255,0.3)"
                : "rgba(255,255,255,0.15)",
            backgroundColor: complete ? color : "transparent",
          }}
        >
          {complete && (
            <span
              style={{
                fontSize: 8,
                color: "#000",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              ✓
            </span>
          )}
        </div>

        <span
          style={{
            color: complete
              ? "rgba(255,255,255,0.35)"
              : unlocked
                ? "rgba(255,255,255,0.85)"
                : "rgba(255,255,255,0.3)",
            textDecoration: complete ? "line-through" : "none",
            fontSize: 12,
            flex: 1,
          }}
        >
          {task.label}
        </span>

        {!unlocked && <span className="flex-shrink-0 text-xs opacity-40">🔒</span>}
      </button>
    </div>
  );
}

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

  const handleLeafClick = () => {
    setExpanded((prev) => !prev);
    onSelect?.(node);
  };

  return (
    <div ref={containerRef} className="flex items-start">
      <button
        onClick={handleLeafClick}
        className="flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          width: NODE_WIDTHS.leaf,
          minWidth: NODE_WIDTHS.leaf,
          backgroundColor: expanded ? `${node.color}22` : "rgba(255,255,255,0.05)",
          borderColor: expanded ? `${node.color}60` : "rgba(255,255,255,0.1)",
          alignSelf: "flex-start",
        }}
      >
        <div
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${node.color} ${pct}%, rgba(255,255,255,0.1) 0%)`,
          }}
        >
          <div className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-[#0d0d14]">
            <span
              style={{
                color: node.color,
                fontSize: pct === 100 ? 5 : 7,
                fontWeight: 700,
              }}
            >
              {pct}%
            </span>
          </div>
        </div>

        <span className="flex-1 text-left text-xs font-medium text-white/80">
          {node.label}
        </span>

        <span
          className="flex-shrink-0 text-xs text-white/30 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
      </button>

      {expanded && (
        <div className="ml-3 flex items-start self-start">
          <div
            className="mt-[18px] h-px w-5 flex-shrink-0"
            style={{ backgroundColor: `${node.color}40` }}
          />

          <div className="relative flex flex-col" style={{ gap: GAP_TASK }}>
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
              <TaskNode
                key={task.id}
                task={task}
                allTasks={node.tasks}
                color={node.color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BranchNodeComponent({
  branch,
  onSelect,
}: {
  branch: BranchNode;
  onSelect?: (node: LeafNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { getBranchProgress } = useProgressContext();
  const { pct } = getBranchProgress(branch.children);

  const [childHeights, setChildHeights] = useState<number[]>(
    () => new Array(branch.children.length).fill(40),
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
    childHeights.reduce((sum, height) => sum + height, 0) +
    GAP_LEAF * Math.max(0, childHeights.length - 1);

  const contentHeight = expanded
    ? Math.max(totalChildrenHeight, NODE_HEIGHTS.collapsedBranch)
    : NODE_HEIGHTS.collapsedBranch;

  const expandedWidth =
    NODE_WIDTHS.branch +
    CONNECTOR_WIDTH +
    CONNECTOR_WIDTH +
    NODE_WIDTHS.leaf +
    LEAF_EXPANDED_EXTRA_WIDTH;

  return (
    <div
      className="relative"
      style={{
        minHeight: contentHeight,
        width: expanded ? expandedWidth : NODE_WIDTHS.branch,
      }}
    >
      <div
        className="absolute left-0"
        style={{
          top: expanded ? "50%" : 0,
          transform: expanded ? "translateY(-50%)" : "none",
          width: NODE_WIDTHS.branch,
        }}
      >
        <div className="flex flex-shrink-0 flex-col items-start">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              width: NODE_WIDTHS.branch,
              minWidth: NODE_WIDTHS.branch,
              backgroundColor: expanded ? `${branch.color}25` : "rgba(255,255,255,0.07)",
              borderColor: expanded ? `${branch.color}70` : "rgba(255,255,255,0.12)",
            }}
          >
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${branch.color} ${pct}%, rgba(255,255,255,0.1) 0%)`,
              }}
            >
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: "rgba(13,13,20,0.85)" }}
              >
                <span
                  style={{
                    color: branch.color,
                    fontSize: pct === 100 ? 5 : 7,
                    fontWeight: 800,
                  }}
                >
                  {pct}%
                </span>
              </div>
            </div>

            <span className="flex-1 text-left text-sm" style={{ color: branch.color }}>
              {branch.label}
            </span>

            <span
              className="flex-shrink-0 text-sm text-white/30 transition-transform duration-200"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ›
            </span>
          </button>

          <div className="mx-1 mt-1" style={{ width: NODE_WIDTHS.branch - 8 }}>
            <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: branch.color }}
              />
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="absolute flex items-start"
          style={{
            left: NODE_WIDTHS.branch + CONNECTOR_WIDTH,
            top: 0,
            height: totalChildrenHeight,
          }}
        >
          <div
            className="relative flex-shrink-0"
            style={{ width: CONNECTOR_WIDTH, height: totalChildrenHeight }}
          >
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
                childHeights
                  .slice(0, i)
                  .reduce((sum, height) => sum + height + GAP_LEAF, 0) +
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

          <div className="flex flex-col" style={{ gap: GAP_LEAF }}>
            {branch.children.map((leaf, i) => (
              <LeafNodeComponent
                key={leaf.id}
                node={leaf}
                onHeightChange={(height) => updateChildHeight(i, height)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BranchHeightWrapper({
  branch,
  index,
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
      onHeightChange(index, ref.current?.offsetHeight ?? NODE_HEIGHTS.collapsedBranch);
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index, onHeightChange]);

  return (
    <div ref={ref} className="relative">
      <div
        className="absolute h-px"
        style={{
          backgroundColor: `${branch.color}40`,
          left: 0,
          top: "50%",
          width: CONNECTOR_WIDTH,
          transform: "translateY(-50%)",
        }}
      />
      <div style={{ marginLeft: CONNECTOR_WIDTH }}>
        <BranchNodeComponent branch={branch} onSelect={onSelect} />
      </div>
    </div>
  );
}

function MindMap({ onSelectLeaf }: { onSelectLeaf?: (node: LeafNode) => void }) {
  const data = roadmap as RoadmapData;
  const { getOverallProgress } = useProgressContext();
  const { done, total, pct } = getOverallProgress(data.children);

  const [branchHeights, setBranchHeights] = useState<number[]>(
    () => new Array(data.children.length).fill(NODE_HEIGHTS.collapsedBranch),
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
    branchHeights.reduce((sum, height) => sum + height, 0) +
    GAP_BRANCH * Math.max(0, branchHeights.length - 1);

  const rootHeight = 90;
  const mapHeight = Math.max(rootHeight, totalBranchHeight);

  return (
    <div className="relative p-12" style={{ minHeight: mapHeight }}>
      <div
        className="absolute flex items-center"
        style={{
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <div className="flex flex-col items-center gap-1" style={{ width: NODE_WIDTHS.root }}>
          <div
            className="w-full rounded-2xl border-2 px-5 py-3 text-center font-bold"
            style={{
              backgroundColor: "#1a1505",
              borderColor: "#a63e24",
              color: "#ff6038",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800 }}>Financial</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Freedom</div>
            <div
              style={{
                fontSize: 10,
                color: "#f0c04080",
                marginTop: 4,
              }}
            >
              {pct}% complete
            </div>
          </div>

          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #ff6038, #4ade80)",
              }}
            />
          </div>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            {done} / {total} tasks
          </div>
        </div>

        <div className="mx-2 h-px w-6 flex-shrink-0 bg-white/20" />
      </div>

      <div
        className="absolute"
        style={{
          left: NODE_WIDTHS.root + 24,
          top: 0,
        }}
      >
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
    </div>
  );
}

function OverallProgressBar() {
  const { getOverallProgress } = useProgressContext();
  const data = roadmap as RoadmapData;
  const { done, total, pct } = getOverallProgress(data.children);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40">Overall progress</span>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff6038, #4ade80)",
          }}
        />
      </div>
      <span className="text-xs font-bold text-white/60">{pct}%</span>
      <span className="text-xs text-white/30">
        {done}/{total}
      </span>
    </div>
  );
}

export default function FinancialMindMapPage() {
  const [zoom, setZoom] = useState(1);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => {
    setZoom((value) => Math.min(2, parseFloat((value + 0.1).toFixed(1))));
  };

  const zoomOut = () => {
    setZoom((value) => Math.max(0.4, parseFloat((value - 0.1).toFixed(1))));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((value) =>
          Math.min(2, Math.max(0.4, parseFloat((value - e.deltaY * 0.001).toFixed(2)))),
        );
      }
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  return (
    <ProgressProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[#0d0d14]">
        <header className="z-10 flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#0d0d14] px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              ← Back
            </Link>

            <div
              style={{
                fontFamily: "serif",
                fontSize: 18,
                fontWeight: 800,
                color: "#ff6038",
              }}
            >
              MapleMind
            </div>

            <span className="text-sm text-white/20">/ Financial Roadmap</span>
          </div>

          <OverallProgressBar />

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm text-white/60 transition-colors hover:bg-white/10"
            >
              −
            </button>

            <button
              onClick={resetZoom}
              className="h-7 min-w-[48px] rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white/60 transition-colors hover:bg-white/10"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              onClick={zoomIn}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm text-white/60 transition-colors hover:bg-white/10"
            >
              +
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
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

          {selectedLeaf && (
            <div
              className="flex-shrink-0 overflow-y-auto border-l border-white/10 bg-[#0d0d14]"
              style={{ width: 300, animation: "slideIn 0.2s ease" }}
            >
              <style>
                {`@keyframes slideIn {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }`}
              </style>

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold" style={{ color: selectedLeaf.color }}>
                    {selectedLeaf.label}
                  </h2>

                  <button
                    onClick={() => setSelectedLeaf(null)}
                    className="text-sm text-white/30 transition-colors hover:text-white/60"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-white/30">Detailed view coming soon.</p>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/20">
          Ctrl + scroll to zoom · use +/− buttons or click % to reset
        </div>
      </div>
    </ProgressProvider>
  );
}