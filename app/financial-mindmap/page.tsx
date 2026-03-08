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
const GAP_LEAF   = 12;
const GAP_TASK   = 8;

// Gap between parent right-edge and child left-edge at each level
const CURVE_GAP_BRANCH = 36; // root → branch
const CURVE_GAP_LEAF   = 16; // branch → leaf  (the ml-4 gap)
const CURVE_GAP_TASK   = 36; // leaf → task    (the ml-9 gap = 36px)

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#0c0a09",
  bgCard:      "#141210",
  bgCardHover: "#1a1714",
  border:      "#2e2824",
  borderHover: "#3a3530",
  accent:      "#c82233",
  textPrimary: "#ffffff",
  textSub:     "#a09890",
  textMuted:   "#6a6460",
  textFaint:   "#3a3530",
  spine:       "rgba(160,152,144,0.15)",
  connector:   "rgba(160,152,144,0.22)",
};

// ─── BezierConnectors ─────────────────────────────────────────────────────────
// Renders an SVG overlay of cubic bezier curves from one parent button
// to each child node. The SVG sits absolutely over the gap div.
//
// x0 = 0 (left edge of SVG = right edge of parent button)
// x1 = gapWidth (right edge of SVG = left edge of first child)
// cp_x = gapWidth / 2  (both control points share this x)
// y0 = parentMidY (relative to SVG top = topOffset + parentButtonHeight/2)
// y1 = each child's midY (relative to SVG top)

function BezierConnectors({
  gapWidth,
  parentButtonHeight,
  parentTopOffset,
  childHeights,
  childGap,
  color,
  totalChildrenHeight,
}: {
  gapWidth: number;
  parentButtonHeight: number;
  parentTopOffset: number;
  childHeights: number[];
  childGap: number;
  color: string;
  totalChildrenHeight: number;
}) {
  const svgHeight = Math.max(totalChildrenHeight, parentTopOffset + parentButtonHeight);
  const cpX = gapWidth / 2;
  const x0 = 0;
  const x1 = gapWidth;
  const y0 = parentTopOffset + parentButtonHeight / 2;

  return (
    <svg
      width={gapWidth}
      height={svgHeight}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}
    >
      {childHeights.map((h, i) => {
        const childTopInSvg =
          childHeights.slice(0, i).reduce((s, ch) => s + ch + childGap, 0);
        const y1 = childTopInSvg + h / 2;
        return (
          <path
            key={i}
            d={`M ${x0} ${y0} C ${cpX} ${y0}, ${cpX} ${y1}, ${x1} ${y1}`}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.35}
          />
        );
      })}
    </svg>
  );
}

// ─── Task Node ────────────────────────────────────────────────────────────────

function TaskNode({ task, allTasks, color }: { task: Task; allTasks: Task[]; color: string }) {
  const { smartToggle, isTaskUnlocked, isComplete } = useProgressContext();
  const unlocked = isTaskUnlocked(task);
  const complete  = isComplete(task.id);

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color, opacity: unlocked ? 1 : 0.3 }}
      />
      <button
        onClick={() => unlocked && smartToggle(task, allTasks)}
        disabled={!unlocked}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150"
        style={{
          width: NODE_WIDTHS.task,
          minWidth: NODE_WIDTHS.task,
          backgroundColor: complete ? `${color}15` : unlocked ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
          borderColor: complete ? `${color}45` : unlocked ? T.border : T.textFaint,
          opacity: unlocked ? 1 : 0.35,
          cursor: unlocked ? "pointer" : "not-allowed",
        }}
      >
        <div
          className="w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center transition-all duration-150"
          style={{
            borderColor: complete ? color : unlocked ? "#57504a" : "#3a3530",
            backgroundColor: complete ? color : "transparent",
          }}
        >
          {complete && <span style={{ fontSize: 8, color: "#fff", fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <span
          style={{
            color: complete ? T.textMuted : unlocked ? T.textSub : "#57504a",
            textDecoration: complete ? "line-through" : "none",
            fontSize: 12,
            flex: 1,
          }}
        >
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
  onExpanded,
}: {
  node: LeafNode;
  onHeightChange?: (height: number) => void;
  onSelect?: (node: LeafNode) => void;
  onExpanded?: (expanded: boolean) => void;
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

  const leafButtonRef = useRef<HTMLDivElement>(null);
  const [leafButtonHeight, setLeafButtonHeight] = useState(36);
  useEffect(() => {
    if (!leafButtonRef.current) return;
    const observer = new ResizeObserver(() => {
      setLeafButtonHeight(leafButtonRef.current?.offsetHeight ?? 36);
    });
    observer.observe(leafButtonRef.current);
    return () => observer.disconnect();
  }, []);

  const [taskHeights, setTaskHeights] = useState<number[]>(
    () => new Array(node.tasks.length).fill(32)
  );
  const updateTaskHeight = useCallback((i: number, h: number) => {
    setTaskHeights((prev) => {
      if (prev[i] === h) return prev;
      const next = [...prev];
      next[i] = h;
      return next;
    });
  }, []);

  const totalTaskHeight =
    taskHeights.reduce((s, h) => s + h, 0) + GAP_TASK * (taskHeights.length - 1);
  const leafTopOffset = Math.max(0, (totalTaskHeight - leafButtonHeight) / 2);

  return (
    <div ref={containerRef} className="flex items-start">
      {/* Leaf button */}
      <div
        ref={leafButtonRef}
        className="flex-shrink-0"
        style={{ paddingTop: expanded ? leafTopOffset : 0, transition: "padding-top 0.2s ease" }}
      >
        <button
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            onExpanded?.(next);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            width: NODE_WIDTHS.leaf,
            minWidth: NODE_WIDTHS.leaf,
            backgroundColor: expanded ? T.bgCardHover : T.bgCard,
            borderColor: expanded ? T.borderHover : T.border,
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: `conic-gradient(${node.color} ${pct}%, rgba(255,255,255,0.08) 0%)` }}
          >
            <div
              className="w-3.5 h-3.5 flex-shrink-0 rounded-full flex items-center justify-center"
              style={{ background: T.bgCard }}
            >
              <span style={{ color: node.color, fontSize: pct === 100 ? 5 : 7, fontWeight: 700 }}>
                {pct}%
              </span>
            </div>
          </div>
          <span className="text-xs font-medium flex-1 text-left" style={{ color: T.textSub }}>
            {node.label}
          </span>
          <span
            className="text-xs transition-transform duration-200 flex-shrink-0"
            style={{ color: T.textMuted, transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </button>
      </div>

      {/* Task list with bezier connectors */}
      {expanded && (
        <div className="flex items-start self-start" style={{ marginLeft: CURVE_GAP_TASK }}>
          {/* SVG bezier curves: leaf button → each task */}
          <div style={{ position: "relative", width: 0, height: 0 }}>
            <BezierConnectors
              gapWidth={CURVE_GAP_TASK}
              parentButtonHeight={leafButtonHeight}
              parentTopOffset={leafTopOffset}
              childHeights={taskHeights}
              childGap={GAP_TASK}
              color={node.color}
              totalChildrenHeight={totalTaskHeight}
            />
          </div>
          <div className="flex flex-col" style={{ gap: GAP_TASK }}>
            {node.tasks.map((task, i) => (
              <TaskNodeWrapper
                key={task.id}
                task={task}
                allTasks={node.tasks}
                color={node.color}
                onHeightChange={(h) => updateTaskHeight(i, h)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskNodeWrapper({
  task,
  allTasks,
  color,
  onHeightChange,
}: {
  task: Task;
  allTasks: Task[];
  color: string;
  onHeightChange: (h: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(() => {
      onHeightChange(ref.current?.offsetHeight ?? 32);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div ref={ref}>
      <TaskNode task={task} allTasks={allTasks} color={color} />
    </div>
  );
}

// ─── Branch Node ──────────────────────────────────────────────────────────────

function BranchNodeComponent({
  branch,
  onSelect,
  onExpanded,
  onLeafExpand,
}: {
  branch: BranchNode;
  onSelect?: (node: LeafNode) => void;
  onExpanded?: (expanded: boolean) => void;
  onLeafExpand?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { getBranchProgress } = useProgressContext();
  const { pct } = getBranchProgress(branch.children);
  const branchButtonRef = useRef<HTMLDivElement>(null);
  const [branchButtonHeight, setBranchButtonHeight] = useState(44);
  const [anyLeafExpanded, setAnyLeafExpanded] = useState(false);

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
    childHeights.reduce((sum, h) => sum + h, 0) + GAP_LEAF * (childHeights.length - 1);
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
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            onExpanded?.(next);
          }}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            width: NODE_WIDTHS.branch,
            minWidth: NODE_WIDTHS.branch,
            backgroundColor: expanded ? "#1e1714" : T.bgCard,
            borderColor: expanded ? T.borderHover : T.border,
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: `conic-gradient(${branch.color} ${pct}%, rgba(255,255,255,0.08) 0%)` }}
          >
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: T.bgCard }}>
              <span style={{ color: branch.color, fontSize: pct === 100 ? 5 : 7, fontWeight: 800 }}>
                {pct}%
              </span>
            </div>
          </div>
          <span className="text-sm flex-1 text-left" style={{ color: branch.color }}>
            {branch.label}
          </span>
          <span
            className="text-sm transition-transform duration-200 flex-shrink-0"
            style={{ color: T.textMuted, transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </button>
        <div className="mt-1 mx-1" style={{ width: NODE_WIDTHS.branch - 8 }}>
          <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: T.border }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: branch.color }}
            />
          </div>
        </div>
      </div>

      {/* Leaf nodes with bezier connectors */}
      {expanded && (
        <div className="flex items-start" style={{ marginLeft: CURVE_GAP_LEAF }}>
          {/* SVG bezier curves: branch button → each leaf */}
          <div style={{ position: "relative", width: 0, height: 0 }}>
            <BezierConnectors
              gapWidth={CURVE_GAP_LEAF}
              parentButtonHeight={branchButtonHeight}
              parentTopOffset={topOffset}
              childHeights={childHeights}
              childGap={GAP_LEAF}
              color={branch.color}
              totalChildrenHeight={totalChildrenHeight}
            />
          </div>
          <div className="flex flex-col" style={{ gap: GAP_LEAF }}>
            {branch.children.map((leaf, i) => (
              <LeafNodeComponent
                key={leaf.id}
                node={leaf}
                onHeightChange={(h) => updateChildHeight(i, h)}
                onSelect={onSelect}
                onExpanded={(isExpanded) => {
                  setAnyLeafExpanded(isExpanded);
                  if (isExpanded) onLeafExpand?.();
                }}
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
  onExpanded,
  onLeafExpand,
}: {
  branch: BranchNode;
  index: number;
  branchHeights: number[];
  onHeightChange: (index: number, height: number) => void;
  onSelect?: (node: LeafNode) => void;
  onExpanded?: (expanded: boolean) => void;
  onLeafExpand?: () => void;
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

  return (
    <div ref={ref} className="flex items-start">
      <BranchNodeComponent
        branch={branch}
        onSelect={onSelect}
        onExpanded={onExpanded}
        onLeafExpand={onLeafExpand}
      />
    </div>
  );
}

// ─── Mind Map ─────────────────────────────────────────────────────────────────

function MindMap({
  onSelectLeaf,
  onBranchExpand,
  onLeafExpand,
}: {
  onSelectLeaf?: (node: LeafNode) => void;
  onBranchExpand?: () => void;
  onLeafExpand?: () => void;
}) {
  const data = roadmap as RoadmapData;
  const { getOverallProgress } = useProgressContext();
  const { done, total, pct } = getOverallProgress(data.children);
  const [anyBranchExpanded, setAnyBranchExpanded] = useState(false);
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
    branchHeights.reduce((sum, h) => sum + h, 0) + GAP_BRANCH * (branchHeights.length - 1);
  const rootHeight = 90;
  const rootTopOffset = Math.max(0, (totalBranchHeight - rootHeight) / 2);

  return (
    <div className="flex items-start p-12">
      {/* Root node */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ paddingTop: rootTopOffset, transition: "padding-top 0.2s ease" }}
      >
        <div className="flex flex-col items-center gap-1" style={{ width: NODE_WIDTHS.root }}>
          <div
            className="w-full px-5 py-3 rounded-2xl border-2 font-bold"
            style={{
              backgroundColor: "#180a0c",
              borderColor: "#7a1520",
              color: T.accent,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800 }}>Financial</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Freedom</div>
            <div style={{ fontSize: 10, color: "#9a4a5480", marginTop: 4 }}>{pct}% complete</div>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden mt-1" style={{ backgroundColor: T.border }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, #e8394c)` }}
            />
          </div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{done} / {total} tasks</div>
        </div>
      </div>

      {/* Bezier curves: root → each branch */}
      <div style={{ position: "relative", width: 0, height: 0 }}>
        <BezierConnectors
          gapWidth={CURVE_GAP_BRANCH}
          parentButtonHeight={rootHeight}
          parentTopOffset={rootTopOffset}
          childHeights={branchHeights}
          childGap={GAP_BRANCH}
          color={T.connector}
          totalChildrenHeight={totalBranchHeight}
        />
      </div>

      {/* Branches */}
      <div
        className="flex flex-col"
        style={{ gap: GAP_BRANCH, marginLeft: CURVE_GAP_BRANCH }}
      >
        {data.children.map((branch, i) => (
          <BranchHeightWrapper
            key={branch.id}
            branch={branch}
            index={i}
            branchHeights={branchHeights}
            onHeightChange={updateBranchHeight}
            onSelect={onSelectLeaf}
            onExpanded={(expanded) => {
              setAnyBranchExpanded(expanded);
              if (expanded) onBranchExpand?.();
            }}
            onLeafExpand={onLeafExpand}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialMindMapPage() {
  const [zoom, setZoom] = useState(1.33);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoomIn  = () => setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(1))));
  const zoomOut = () => setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))));
  const resetZoom = () => setZoom(1);

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
      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ background: T.bg, fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}
      >
        {/* ── Navbar ── */}
        <header
          className="flex items-center justify-between px-6 py-3 z-10 flex-shrink-0"
          style={{
            borderBottom: `1px solid ${T.border}`,
            background: `${T.bg}cc`,
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm transition-colors" style={{ color: T.textMuted }}>
              ← Back
            </Link>
            <span className="font-bold tracking-[0.22em] text-sm" style={{ color: T.textPrimary }}>
              YUTH
            </span>
            <span style={{ color: T.textFaint, fontSize: 13 }}>/ Financial Roadmap</span>
          </div>

          <OverallProgressBar />

          <div className="flex items-center gap-2">
            {([["−", zoomOut], [`${Math.round(zoom * 100)}%`, resetZoom], ["+", zoomIn]] as const).map(
              ([label, action], i) => (
                <button
                  key={i}
                  onClick={action}
                  className="transition-colors flex items-center justify-center"
                  style={{
                    height: 28,
                    width: i === 1 ? undefined : 28,
                    minWidth: i === 1 ? 48 : undefined,
                    paddingInline: i === 1 ? 8 : undefined,
                    fontSize: i === 1 ? 12 : 14,
                    borderRadius: 6,
                    border: `1px solid ${T.border}`,
                    background: "rgba(255,255,255,0.03)",
                    color: T.textSub,
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </header>

        {/* ── Canvas + Sidebar ── */}
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
              <MindMap
                onSelectLeaf={setSelectedLeaf}
                onBranchExpand={() => setZoom(1)}
                onLeafExpand={() => setZoom(1.33)}
              />
            </div>
          </div>

          {selectedLeaf && (
            <div
              className="flex-shrink-0 overflow-y-auto"
              style={{
                width: 300,
                borderLeft: `1px solid ${T.border}`,
                background: T.bgCard,
                animation: "slideIn 0.2s ease",
              }}
            >
              <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold" style={{ color: selectedLeaf.color }}>
                    {selectedLeaf.label}
                  </h2>
                  <button
                    onClick={() => setSelectedLeaf(null)}
                    className="text-sm transition-colors"
                    style={{ color: T.textMuted }}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs" style={{ color: T.textMuted }}>Detailed view coming soon.</p>
              </div>
            </div>
          )}
        </div>

        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
          style={{ color: T.textMuted }}
        >
          Ctrl + scroll to zoom · use +/− buttons or click % to reset
        </div>
      </div>
    </ProgressProvider>
  );
}

// ─── Overall Progress Bar ─────────────────────────────────────────────────────

function OverallProgressBar() {
  const { getOverallProgress } = useProgressContext();
  const data = roadmap as RoadmapData;
  const { done, total, pct } = getOverallProgress(data.children);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs" style={{ color: T.textMuted }}>Overall progress</span>
      <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.border }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, #e8394c)` }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color: T.textSub }}>{pct}%</span>
      <span className="text-xs" style={{ color: T.textMuted }}>{done}/{total}</span>
    </div>
  );
}