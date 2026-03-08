"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ProgressProvider, useProgressContext } from "@/hooks/useProgress";
import roadmapRaw from "@/data/roadmap.json";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type RawTask = {
  id: string;
  label: string;
  description?: string;
  prerequisite?: string;
  learn?: boolean;
  sourceUrl?: string;
  sourceLabel?: string;
};

type RawGroup = {
  id: string;
  label: string;
  icon: string;
  color: string;
  tasks: RawTask[];
};

type RawSection = {
  id: string;
  label: string;
  type: "setup" | "maintenance";
  icon: string;
  color: string;
  half: "top" | "bottom";
  groups: RawGroup[];
};

type RoadmapData = {
  id: string;
  label: string;
  sections: RawSection[];
};

const roadmap = roadmapRaw as unknown as RoadmapData;

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg:           "#faf8f6",
  bgCard:       "#ffffff",
  border:       "#e2dbd4",
  accent:       "#c82233",
  textPrime:    "#151311",
  textSub:      "#5f5953",
  textMuted:    "#9a7b72",
  textFaint:    "#c8bdb6",
  connector:    "rgba(180,168,158,0.35)",
  locked:       "#f5f2ee",
  lockedBorder: "#d0c9c1",
  lockedText:   "#c8bdb6",
};

// ─── Canvas constants ─────────────────────────────────────────────────────────

const W            = 900;
const H            = 900;
const CX           = W / 2;
const CY           = H / 2;
const ROOT_R       = 68;
const GROUP_R      = 54;
const GROUP_RADIUS = 240;   // root → group directly

// ─── Layout ───────────────────────────────────────────────────────────────────

interface NodePos { x: number; y: number }

function computeLayout(sections: RawSection[]): Map<string, NodePos> {
  const m = new Map<string, NodePos>();
  m.set("root", { x: CX, y: CY });

  const topGroups    = sections.filter((s) => s.half === "top").flatMap((s) => s.groups);
  const bottomGroups = sections.filter((s) => s.half === "bottom").flatMap((s) => s.groups);

  const placeGroups = (groups: RawGroup[], centerAngle: number) => {
    // Fixed step of 55° between nodes so spacing is always equal regardless of count
    const step = (55 * Math.PI) / 180;
    const totalSpread = step * (groups.length - 1);
    const startAngle  = centerAngle - totalSpread / 2;
    groups.forEach((group, i) => {
      const angle = groups.length === 1 ? centerAngle : startAngle + step * i;
      m.set(group.id, {
        x: CX + GROUP_RADIUS * Math.cos(angle),
        y: CY + GROUP_RADIUS * Math.sin(angle),
      });
    });
  };

  placeGroups(topGroups,    -Math.PI / 2);
  placeGroups(bottomGroups,  Math.PI / 2);

  return m;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTaskMap(sections: RawSection[]): Map<string, RawTask> {
  const m = new Map<string, RawTask>();
  for (const s of sections)
    for (const g of s.groups)
      for (const t of g.tasks) m.set(t.id, t);
  return m;
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function Ring({ cx, cy, r, pct, color, width = 3 }: {
  cx: number; cy: number; r: number; pct: number; color: string; width?: number;
}) {
  const c    = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const gap  = Math.max(c - dash, 0.001);
  return (
    <circle cx={cx} cy={cy} r={r}
      fill="none" stroke={color} strokeWidth={width}
      strokeDasharray={`${dash} ${gap}`}
      strokeDashoffset={c / 4}
      strokeLinecap="round" opacity={0.9}
    />
  );
}

// ─── Connection lines ─────────────────────────────────────────────────────────

function Lines({ layout, sections, focusGroupId, isGroupLocked }: {
  layout: Map<string, NodePos>;
  sections: RawSection[];
  focusGroupId: string | null;
  isGroupLocked: (group: RawGroup) => boolean;
}) {
  const root = layout.get("root")!;
  return (
    <g>
      {sections.flatMap((section) =>
        section.groups.map((group) => {
          const gp     = layout.get(group.id)!;
          const active = focusGroupId === group.id;
          const locked = isGroupLocked(group);
          const mx = (root.x + gp.x) / 2;
          const my = (root.y + gp.y) / 2;
          return (
            <path key={group.id}
              d={`M${root.x},${root.y} Q${mx},${my} ${gp.x},${gp.y}`}
              fill="none"
              stroke={locked ? T.lockedBorder : active ? group.color : T.connector}
              strokeWidth={active ? 2 : 1}
              strokeOpacity={active ? 0.65 : locked ? 0.15 : 0.25}
              strokeDasharray={locked ? "4 8" : undefined}
              strokeLinecap="round"
            />
          );
        })
      )}
    </g>
  );
}

// ─── Root node ────────────────────────────────────────────────────────────────

function RootSVGNode({ pos, pct, done, total, onClick, showBack }: {
  pos: NodePos; pct: number; done: number; total: number; onClick: () => void; showBack: boolean;
}) {
  return (
    <g className={showBack ? "cursor-pointer" : undefined} onClick={showBack ? onClick : undefined}>
      <circle cx={pos.x} cy={pos.y} r={ROOT_R + 18} fill="none" stroke="#c82233" strokeWidth={1} opacity={showBack ? 0.22 : 0.06} />
      <circle cx={pos.x} cy={pos.y} r={ROOT_R + 9}  fill="none" stroke="#c82233" strokeWidth={showBack ? 1.5 : 1} opacity={showBack ? 0.22 : 0.08} />
      <circle cx={pos.x} cy={pos.y} r={ROOT_R} fill="#fff1f2" stroke="#c82233" strokeWidth={2} />
      <Ring cx={pos.x} cy={pos.y} r={ROOT_R - 5} pct={pct} color={T.accent} width={3.5} />
      <text x={pos.x} y={pos.y - 11} textAnchor="middle" fontSize={18} fontWeight={800} fill={T.accent}
        style={{ fontFamily: "var(--font-sans)" }}>Financial</text>
      <text x={pos.x} y={pos.y + 10} textAnchor="middle" fontSize={18} fontWeight={800} fill={T.accent}
        style={{ fontFamily: "var(--font-sans)" }}>Freedom</text>
      <text x={pos.x} y={pos.y + 30} textAnchor="middle" fontSize={12} fill={T.textMuted}
        style={{ fontFamily: "var(--font-sans)" }}>{done}/{total}</text>
    </g>
  );
}


// ─── Wrapping SVG label ───────────────────────────────────────────────────────

function LabelText({ x, y, text, fill, maxWidth }: {
  x: number; y: number; text: string; fill: string; maxWidth: number;
}) {
  // Split at spaces to fit within maxWidth chars (~14 chars per line at font 11)
  const words   = text.split(" ");
  const maxChars = Math.floor(maxWidth / 6.5);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  const lineH  = 13;
  const startY = y - ((lines.length - 1) * lineH) / 2;
  return (
    <text textAnchor="middle" fontSize={11} fontWeight={600} fill={fill}
      style={{ fontFamily: "var(--font-sans)" }}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} y={startY + i * lineH}>{l}</tspan>
      ))}
    </text>
  );
}

// ─── Group node ───────────────────────────────────────────────────────────────

function GroupSVGNode({ group, section, pos, pct, locked, isSelected, isVisible, onClick }: {
  group: RawGroup; section: RawSection; pos: NodePos; pct: number;
  locked: boolean; isSelected: boolean; isVisible: boolean; onClick: () => void;
}) {
  const color  = locked ? T.lockedBorder : group.color;
  const fill   = locked ? T.locked : isSelected ? `${group.color}28` : T.bgCard;

  return (
    <g className={locked ? "cursor-not-allowed" : "cursor-pointer"} onClick={onClick}>
      <circle cx={pos.x} cy={pos.y} r={GROUP_R + 10} fill="transparent" />
      {isSelected && !locked && (
        <circle cx={pos.x} cy={pos.y} r={GROUP_R + 10}
          fill="none" stroke={group.color} strokeWidth={1.5} opacity={0.2} />
      )}
      <circle cx={pos.x} cy={pos.y} r={GROUP_R}
        fill={fill} stroke={color}
        strokeWidth={isSelected && !locked ? 2 : 1}
        strokeDasharray={locked ? "4 6" : undefined}
      />
      {!locked && pct > 0 && (
        <Ring cx={pos.x} cy={pos.y} r={GROUP_R - 4} pct={pct} color={group.color} width={2.5} />
      )}
      {locked ? (
        <LabelText x={pos.x} y={pos.y} text={group.label.replace(/^(Phase \d+: |The )/, "")}
          fill={T.lockedText} maxWidth={GROUP_R * 1.6} />
      ) : (
        <LabelText x={pos.x} y={pos.y} text={group.label.replace(/^(Phase \d+: |The )/, "")}
          fill={isSelected ? "#ffffff" : group.color} maxWidth={GROUP_R * 1.6} />
      )}
    </g>
  );
}

// ─── Task panel ───────────────────────────────────────────────────────────────

function TaskPanel({ group, section, onClose }: {
  group: RawGroup; section: RawSection; onClose: () => void;
}) {
  const { smartToggle, isTaskUnlocked, isComplete, getNodeProgress } = useProgressContext();
  const { done, total, pct } = getNodeProgress(group.tasks);

  return (
    <div className="absolute right-0 top-0 h-full flex flex-col z-30"
      style={{ width: 360, borderLeft: `1px solid ${T.border}`, background: T.bgCard, animation: "slideIn 0.22s ease" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{group.icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-semibold mb-0.5 tracking-wide" style={{ color: section.color }}>
              {section.label}
            </div>
            <h2 className="text-sm font-bold leading-tight" style={{ color: T.textPrime }}>
              {group.label}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{done}/{total} tasks</p>
          </div>
        </div>
        <button onClick={onClose} style={{ color: T.textMuted, fontSize: 16, padding: "4px 8px", flexShrink: 0 }}>✕</button>
      </div>

      {/* Progress */}
      <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: T.textMuted }}>Progress</span>
          <span className="text-xs font-bold" style={{ color: group.color }}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: T.border }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: group.color }} />
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {group.tasks.map((task) => {
          const unlocked = isTaskUnlocked(task);
          const complete  = isComplete(task.id);
          return (
            <>{task.learn ? (
              /* ── Research task: link to learn page ── */
              <Link key={task.id} href={`/learn/${task.id}`}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: complete ? `${group.color}15` : unlocked ? `${group.color}08` : "rgba(255,255,255,0.01)",
                  borderColor: complete ? `${group.color}55` : unlocked ? `${group.color}40` : T.textFaint,
                  opacity: unlocked ? 1 : 0.35,
                  pointerEvents: unlocked ? "auto" : "none",
                  textDecoration: "none",
                  display: "flex",
                }}>
                {/* Read icon / checkmark */}
                <div className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    borderColor: complete ? group.color : unlocked ? `${group.color}70` : "#3a3530",
                    backgroundColor: complete ? group.color : "transparent",
                  }}>
                  {complete
                    ? <span style={{ fontSize: 8, color: "#fff", fontWeight: 900 }}>✓</span>
                    : <span style={{ fontSize: 8, color: group.color, fontWeight: 900 }}>→</span>
                  }
                </div>
                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-snug"
                    style={{
                      color: complete ? T.textMuted : unlocked ? group.color : "#57504a",
                      textDecoration: complete ? "line-through" : "none",
                    }}>
                    {task.label}
                  </div>
                  {task.description && (
                    <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: T.textMuted }}>
                      {task.description}
                    </div>
                  )}
                  {!complete && unlocked && (
                    <div className="text-[10px] mt-1 font-semibold tracking-wide" style={{ color: `${group.color}90` }}>
                      TAP TO READ →
                    </div>
                  )}
                  {task.sourceUrl && (
                    <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] mt-0.5 inline-block transition hover:underline hover:text-[#151311]"
                      style={{ color: T.textMuted, textUnderlineOffset: "3px", textDecoration: "underline" }}>
                      {task.sourceLabel ?? "Learn more"} ↗
                    </a>
                  )}
                </div>
                {!unlocked && <span className="text-xs opacity-40 flex-shrink-0 mt-0.5">🔒</span>}
              </Link>
            ) : (
              /* ── Regular task: checkbox ── */
              <button key={task.id}
                onClick={() => unlocked && smartToggle(task, group.tasks)}
                disabled={!unlocked}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-all"
                style={{
                  backgroundColor: complete ? `${group.color}15` : unlocked ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
                  borderColor: complete ? `${group.color}45` : unlocked ? T.border : T.textFaint,
                  opacity: unlocked ? 1 : 0.35,
                  cursor: unlocked ? "pointer" : "not-allowed",
                }}>
                {/* Checkbox */}
                <div className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                  style={{
                    borderColor: complete ? group.color : unlocked ? "#57504a" : "#3a3530",
                    backgroundColor: complete ? group.color : "transparent",
                  }}>
                  {complete && <span style={{ fontSize: 8, color: "#fff", fontWeight: 900 }}>✓</span>}
                </div>
                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-snug"
                    style={{
                      color: complete ? T.textMuted : unlocked ? T.textSub : "#57504a",
                      textDecoration: complete ? "line-through" : "none",
                    }}>
                    {task.label}
                  </div>
                  {task.description && (
                    <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: T.textMuted }}>
                      {task.description}{" "}
                      {task.sourceUrl && (
                        <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="transition hover:underline hover:text-[#151311]"
                          style={{ color: T.textMuted, textUnderlineOffset: "3px", textDecoration: "underline" }}>
                          {task.sourceLabel ?? "Learn more"} ↗
                        </a>
                      )}
                    </div>
                  )}
                  {!task.description && task.sourceUrl && (
                    <div className="text-[10px] mt-0.5">
                      <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="transition hover:underline hover:text-[#151311]"
                        style={{ color: T.textMuted, textUnderlineOffset: "3px", textDecoration: "underline" }}>
                        {task.sourceLabel ?? "Learn more"} ↗
                      </a>
                    </div>
                  )}
                </div>
                {!unlocked && <span className="text-xs opacity-40 flex-shrink-0 mt-0.5">🔒</span>}
              </button>
            )}</>
          );
        })}
      </div>
    </div>
  );
}

// ─── Overall progress bar ─────────────────────────────────────────────────────

function OverallBar() {
  const { getNodeProgress } = useProgressContext();
  const allTasks = useMemo(() =>
    roadmap.sections.flatMap((s) => s.groups.flatMap((g) => g.tasks)), []);
  const { done, total, pct } = getNodeProgress(allTasks);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs" style={{ color: T.textMuted }}>Overall</span>
      <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.border }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, #e8394c)` }} />
      </div>
      <span className="text-xs font-bold" style={{ color: T.textSub }}>{pct}%</span>
      <span className="text-xs" style={{ color: T.textMuted }}>{done}/{total}</span>
    </div>
  );
}

// ─── Map inner ────────────────────────────────────────────────────────────────

function MapInner() {
  const { isComplete, getNodeProgress } = useProgressContext();
  const sections = roadmap.sections;
  const layout   = useMemo(() => computeLayout(sections), [sections]);


  const isGroupLocked = useCallback((group: RawGroup): boolean => {
    // A group is locked only if every task has an unmet prerequisite
    // (i.e. there is no free entry point into the group)
    const hasFreeTask = group.tasks.some((t) => !t.prerequisite || isComplete(t.prerequisite));
    return !hasFreeTask;
  }, [isComplete]);

  const getGroupPct = useCallback((group: RawGroup): number =>
    getNodeProgress(group.tasks).pct, [getNodeProgress]);

  const getSectionPct = useCallback((section: RawSection): number => {
    const all = section.groups.flatMap((g) => g.tasks);
    return getNodeProgress(all).pct;
  }, [getNodeProgress]);

  const allTasks = useMemo(() =>
    sections.flatMap((s) => s.groups.flatMap((g) => g.tasks)), [sections]);
  const { done: tDone, total: tTotal, pct: tPct } = getNodeProgress(allTasks);

  // View state — groups connect directly to root; clicking a group opens its task panel
  const [selectedGroup, setSelectedGroup] = useState<{ group: RawGroup; section: RawSection } | null>(null);

  // Pan / zoom
  const [zoom,    setZoom   ] = useState(1.0);
  const [pan,     setPan    ] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panRef  = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDrag = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fill screen on mount
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { width: sw, height: sh } = el.getBoundingClientRect();
    const scale = Math.min(sw / W, sh / H);
    setZoom((Math.min(sw, sh) / (Math.min(W, H) * scale)) * 0.9);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.25, z - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, []);

  const getHomeZoom = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return 1.0;
    const { width: sw, height: sh } = el.getBoundingClientRect();
    const scale = Math.min(sw / W, sh / H);
    return (Math.min(sw, sh) / (Math.min(W, H) * scale)) * 0.9;
  }, []);

  const zoomTo = useCallback((svgX: number, svgY: number, targetZoom: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const { width: sw, height: sh } = el.getBoundingClientRect();
    const scale   = Math.min(sw / W, sh / H);
    const offsetX = (sw - W * scale) / 2;
    const offsetY = (sh - H * scale) / 2;
    const px = offsetX + svgX * scale;
    const py = offsetY + svgY * scale;
    setZoom(targetZoom);
    setPan({ x: (sw / 2 - px) * targetZoom, y: (sh / 2 - py) * targetZoom });
  }, []);

  const handleGroupClick = useCallback((group: RawGroup, section: RawSection) => {
    if (didDrag.current || isGroupLocked(group)) return;
    if (selectedGroup?.group.id === group.id) return;
    setSelectedGroup({ group, section });
    zoomTo(layout.get(group.id)!.x, layout.get(group.id)!.y, 1.9);
  }, [isGroupLocked, selectedGroup, layout, zoomTo]);

  const handleBack = useCallback(() => {
    if (selectedGroup) {
      setSelectedGroup(null);
      setZoom(getHomeZoom());
      setPan({ x: 0, y: 0 });
    }
  }, [selectedGroup, getHomeZoom]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    didDrag.current = false;
    setPanning(true);
    panRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panning) return;
    const dx = e.clientX - panRef.current.x;
    const dy = e.clientY - panRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
    setPan({ x: panRef.current.panX + dx, y: panRef.current.panY + dy });
  }, [panning]);

  const onMouseUp = useCallback(() => setPanning(false), []);
  const showBack = selectedGroup !== null;
  const rootPos  = layout.get("root")!;

  return (
    <div className="relative flex-1 overflow-hidden">

      {/* Half labels */}
      <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-10 gap-48">
        {([
          { label: "↑ SETUP",       bg: "rgba(255,241,242,0.92)", border: "1px solid rgba(200,34,51,0.2)",  color: "#c82233" },
          { label: "↓ MAINTENANCE", bg: "rgba(250,248,246,0.92)", border: `1px solid ${T.border}`,         color: T.textMuted },
        ]).map(({ label, bg, border, color }) => (
          <span key={label} className="text-xs font-semibold tracking-[0.18em] px-3 py-1 rounded-full"
            style={{ background: bg, border, color, backdropFilter: "blur(6px)" }}>
            {label}
          </span>
        ))}
      </div>

      {/* Back button */}
      {showBack && (
        <button onClick={handleBack}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold hover:opacity-80 transition-opacity"
          style={{ background: "rgba(250,248,246,0.95)", border: `1px solid ${T.border}`, color: T.textSub, backdropFilter: "blur(8px)" }}>
          ← Back
        </button>
      )}

      {/* Canvas */}
      <div ref={wrapRef} className="w-full h-full"
        style={{ cursor: panning ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: panning ? "none" : "transform 0.38s cubic-bezier(0.4,0,0.2,1)",
          }}>

          {/* Divider line */}
          <line x1={120} y1={CY} x2={W - 120} y2={CY}
            stroke={T.border} strokeWidth={1} strokeDasharray="8 20" opacity={0.7} />

          {/* Guide rings */}
          <circle cx={CX} cy={CY} r={GROUP_RADIUS}
            fill="none" stroke="#e2dbd4" strokeWidth={1} strokeDasharray="4 12" opacity={0.6} />
          <circle cx={CX} cy={CY} r={GROUP_RADIUS + GROUP_R + 18}
            fill="none" stroke="#e2dbd4" strokeWidth={1} strokeDasharray="3 16" opacity={0.35} />

          <Lines layout={layout} sections={sections} focusGroupId={selectedGroup?.group.id ?? null}
            isGroupLocked={isGroupLocked} />

          {/* Group nodes — always visible, top half = setup, bottom half = maintenance */}
          {sections.flatMap((section) =>
            section.groups.map((group) => (
              <GroupSVGNode
                key={group.id}
                group={group} section={section}
                pos={layout.get(group.id)!}
                pct={getGroupPct(group)}
                locked={isGroupLocked(group)}
                isSelected={selectedGroup?.group.id === group.id}
                isVisible={true}
                onClick={() => handleGroupClick(group, section)}
              />
            ))
          )}

          {/* Root */}
          <RootSVGNode pos={rootPos} pct={tPct} done={tDone} total={tTotal} onClick={handleBack} showBack={showBack} />
        </svg>
      </div>

      {/* Task panel */}
      {selectedGroup && (
        <TaskPanel group={selectedGroup.group} section={selectedGroup.section} onClose={handleBack} />
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-0.5 rounded-lg p-0.5"
        style={{ border: `1px solid ${T.border}`, background: T.bgCard, backdropFilter: "blur(8px)" }}>
        {([
          ["−", () => setZoom((z) => Math.max(0.25, +(z - 0.15).toFixed(2)))],
          [`${Math.round(zoom * 100)}%`, () => { setZoom(getHomeZoom()); setPan({ x: 0, y: 0 }); setSelectedGroup(null); }],
          ["+", () => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))],
        ] as [string, () => void][]).map(([label, action], i) => (
          <button key={i} onClick={action}
            style={{
              height: 28, borderRadius: 6, border: "none", cursor: "pointer",
              width: i === 1 ? undefined : 28, minWidth: i === 1 ? 48 : undefined,
              paddingInline: i === 1 ? 8 : undefined,
              fontSize: i === 1 ? 11 : 14, background: "transparent", color: T.textSub,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 px-3 py-2 rounded-lg"
        style={{ border: `1px solid ${T.border}`, background: `${T.bgCard}ee`, backdropFilter: "blur(8px)" }}>
        <span className="text-[10px]" style={{ color: T.textMuted }}>Click section to expand</span>
        <span style={{ color: T.textFaint }}>·</span>
        <span className="text-[10px]" style={{ color: T.lockedText }}>🔒 locked</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialMindMapPage() {
  return (
      <div className="flex flex-col h-screen overflow-hidden"
        style={{ background: T.bg, fontFamily: "'Inter','Avenir Next','Segoe UI',sans-serif" }}
        suppressHydrationWarning>
        <header className="flex items-center justify-between px-6 py-3 z-10 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}`, background: `${T.bg}f0`, backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm transition-colors" style={{ color: T.textMuted }}>← Back</Link>
            <span className="font-bold tracking-[0.22em] text-sm" style={{ color: T.textPrime }}>YUTH</span>
            <span style={{ color: T.textFaint, fontSize: 13 }}>/ Financial Roadmap</span>
          </div>
          <OverallBar />
          <div style={{ width: 80 }} />
        </header>
        <MapInner />
      </div>
  );
}