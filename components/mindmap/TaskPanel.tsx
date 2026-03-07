"use client";

import { useState } from "react";
import { useProgressContext } from "@/hooks/useProgress";
import type { BranchNode, LeafNode, Task } from "@/hooks/useProgress";
import roadmap from "@/data/roadmap.json";

type RoadmapData = {
  id: string;
  label: string;
  children: BranchNode[];
};

// ─── Task Node ────────────────────────────────────────────────────────────────

function TaskNode({ task, allTasks, color }: { task: Task; allTasks: Task[]; color: string }) {
  const { smartToggle, isTaskUnlocked, isComplete } = useProgressContext();
  const unlocked = isTaskUnlocked(task);
  const complete = isComplete(task.id);

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, opacity: unlocked ? 1 : 0.3 }} />
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

function LeafNodeComponent({ node }: { node: LeafNode }) {
  const [expanded, setExpanded] = useState(false);
  const { getNodeProgress } = useProgressContext();
  const { done, total, pct } = getNodeProgress(node.tasks);

  return (
    <div className="flex items-start gap-0">
      <div className="flex flex-col items-center mr-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: expanded ? `${node.color}22` : "rgba(255,255,255,0.05)",
            borderColor: expanded ? `${node.color}60` : "rgba(255,255,255,0.1)",
            minWidth: "160px",
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: `conic-gradient(${node.color} ${pct}%, rgba(255,255,255,0.1) 0%)` }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#0d0d14] flex items-center justify-center">
              <span style={{ color: node.color, fontSize: 7, fontWeight: 700 }}>{pct}%</span>
            </div>
          </div>
          <span className="text-xs font-medium text-white/80">{node.label}</span>
          <span className="ml-auto text-white/30 text-xs transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            ›
          </span>
        </button>
      </div>

      {expanded && (
        <div className="flex items-start ml-3">
          <div className="flex items-center">
            <div className="w-5 h-px" style={{ backgroundColor: `${node.color}40` }} />
          </div>
          <div className="flex flex-col gap-2 relative">
            <div className="absolute left-0 top-3 bottom-3 w-px" style={{ backgroundColor: `${node.color}30`, left: "-2px" }} />
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

  return (
    <div className="flex items-start">
      <div className="flex flex-col items-start">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: expanded ? `${branch.color}25` : "rgba(255,255,255,0.07)",
            borderColor: expanded ? `${branch.color}50` : "rgba(255,255,255,0.12)",
            minWidth: "150px",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: `conic-gradient(${branch.color} ${pct}%, rgba(255,255,255,0.10) 0%)` }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "rgba(13,13,20,0.85)" }}>
              <span style={{ color: "#566e60", fontSize: 8, fontWeight: 800 }}>{pct}%</span>
            </div>
          </div>
          <span className="text-sm" style={{ color: branch.color }}>{branch.label}</span>
          <span className="ml-2 text-white/30 text-sm transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            ›
          </span>
        </button>
        <div className="mt-1 mx-1" style={{ width: "calc(100% - 8px)" }}>
          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: "branch.color" }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="flex items-start ml-4">
          <div className="flex items-center self-stretch">
            <div className="w-4 h-px self-center" style={{ backgroundColor: `${branch.color}40` }} />
          </div>
          <div className="flex flex-col gap-3 relative pl-2">
            <div className="absolute left-0 w-px" style={{ backgroundColor: `${branch.color}30`, top: "16px", bottom: "16px" }} />
            {branch.children.map((leaf) => (
              <div key={leaf.id} className="flex items-center gap-0">
                <div className="w-3 h-px mr-1" style={{ backgroundColor: `${branch.color}40` }} />
                <LeafNodeComponent node={leaf} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function MindMap() {
  const data = roadmap as RoadmapData;
  const { getOverallProgress } = useProgressContext();
  const { done, total, pct } = getOverallProgress(data.children);

  return (
    <div className="flex items-start gap-0 p-8 overflow-auto min-h-screen bg-[#0f2618]">
      {/* Root node */}
      <div className="flex items-center flex-shrink-0 mr-4">
        <div className="flex flex-col items-center gap-1">
          <div className="px-5 py-3 rounded-2xl border-2 font-bold text-base"
            style={{ backgroundColor: "#0f2618", borderColor: "#f0c04060", color: "#f0c040", minWidth: "140px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Financial</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Freedom</div>
            <div style={{ fontSize: 10, color: "#f0c04080", marginTop: 4 }}>{pct}% complete</div>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #f0c040, #E7E9E7)" }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{done} / {total} tasks</div>
        </div>
        <div className="w-6 h-px bg-white/20 mx-2" />
      </div>

      {/* Branch nodes */}
      <div className="flex flex-col gap-5 relative">
        <div className="absolute left-0 w-px" style={{ backgroundColor: "rgba(255,255,255,0.08)", top: "20px", bottom: "20px" }} />
        {data.children.map((branch) => (
          <div key={branch.id} className="flex items-center">
            <div className="w-4 h-px mr-1" style={{ backgroundColor: "rgb(62,81,70)" }} />
            <BranchNodeComponent branch={branch} />
          </div>
        ))}
      </div>
    </div>
  );
}