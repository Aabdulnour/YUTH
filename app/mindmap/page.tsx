"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import {
  loadPersistedActionCompletion,
  type ActionCompletionMap,
} from "@/lib/persistence/action-store";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { getRecommendations } from "@/lib/recommendations/engine";
import {
  ALL_NODES,
  CHILD_NODES,
  DOMAIN_NODES,
  ROOT_NODE,
  computeNodeStatus,
  getChildNodes,
  NODE_STATUS_COLORS,
  NODE_STATUS_LABELS,
  type MindMapNode,
  type MindMapNodeStatus,
} from "@/data/mindmap";
import type { UserProfile } from "@/types/profile";
import type { ActionItem } from "@/types/action";
import type { Benefit } from "@/types/benefit";

/* ── Layout constants ── */

const CANVAS_W = 1600;
const CANVAS_H = 1200;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;
const DOMAIN_RADIUS = 300;
const CHILD_RADIUS = 180;
const ROOT_R = 42;
const DOMAIN_R = 34;
const CHILD_R = 24;

/* ── Position helpers ── */

interface NodePosition {
  x: number;
  y: number;
  r: number;
}

function computePositions(): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();

  // Root node at center
  positions.set(ROOT_NODE.id, { x: CENTER_X, y: CENTER_Y, r: ROOT_R });

  // Domain nodes in a circle around the root
  const domainCount = DOMAIN_NODES.length;
  DOMAIN_NODES.forEach((domain, i) => {
    const angle = (2 * Math.PI * i) / domainCount - Math.PI / 2;
    positions.set(domain.id, {
      x: CENTER_X + DOMAIN_RADIUS * Math.cos(angle),
      y: CENTER_Y + DOMAIN_RADIUS * Math.sin(angle),
      r: DOMAIN_R,
    });

    // Child nodes fanning out from each domain
    const children = getChildNodes(domain.id);
    const childCount = children.length;
    const spread = Math.PI * 0.55; // fan spread angle
    const startAngle = angle - spread / 2;

    children.forEach((child, j) => {
      const childAngle = childCount === 1 ? angle : startAngle + (spread * j) / (childCount - 1);
      const domPos = positions.get(domain.id)!;
      positions.set(child.id, {
        x: domPos.x + CHILD_RADIUS * Math.cos(childAngle),
        y: domPos.y + CHILD_RADIUS * Math.sin(childAngle),
        r: CHILD_R,
      });
    });
  });

  return positions;
}

const NODE_POSITIONS = computePositions();

/* ── Detail panel ── */

function DetailPanel({
  node,
  status,
  matchedActions,
  matchedBenefits,
  actionCompletion,
  onClose,
}: {
  node: MindMapNode;
  status: MindMapNodeStatus;
  matchedActions: ActionItem[];
  matchedBenefits: Benefit[];
  actionCompletion: ActionCompletionMap;
  onClose: () => void;
}) {
  const relatedActions = node.relatedActionIds
    .map((id) => matchedActions.find((a) => a.id === id))
    .filter(Boolean) as ActionItem[];

  const relatedBenefits = node.relatedBenefitIds
    .map((id) => matchedBenefits.find((b) => b.id === id))
    .filter(Boolean) as Benefit[];

  const statusColor = NODE_STATUS_COLORS[status];

  return (
    <div className="mindmap-panel-animated absolute right-0 top-0 z-30 flex h-full w-[380px] flex-col border-l border-[#e2dbd4] bg-white/97 shadow-[-8px_0_32px_rgba(20,15,12,0.08)] backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e2dbd4] p-5">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{node.icon}</span>
            <h2 className="text-xl font-bold text-[#151311]">{node.label}</h2>
          </div>
          <span
            className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {NODE_STATUS_LABELS[status]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] p-1.5 text-xs text-[#5f5953] transition hover:border-[#d0c9c1]"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Description */}
        <section className="mb-5">
          <p className="text-sm leading-relaxed text-[#5f5953]">{node.description}</p>
        </section>

        {/* Why it matters */}
        <section className="mb-5 rounded-xl border border-[#e2dbd4] bg-[#faf8f6] p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9a7b72]">
            Why It Matters
          </p>
          <p className="text-sm leading-relaxed text-[#151311]">{node.whyItMatters}</p>
        </section>

        {/* Next step */}
        {node.nextStep && (
          <section className="mb-5 rounded-xl border border-l-4 border-[#e2dbd4] border-l-[#c82233] bg-white p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9a7b72]">
              Suggested Next Step
            </p>
            <p className="text-sm font-medium leading-relaxed text-[#151311]">{node.nextStep}</p>
          </section>
        )}

        {/* Related actions */}
        {relatedActions.length > 0 && (
          <section className="mb-5">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9a7b72]">
              Related Actions
            </p>
            <div className="space-y-2">
              {relatedActions.map((action) => {
                const isDone = Boolean(actionCompletion[action.id]);
                return (
                  <div
                    key={action.id}
                    className={`rounded-lg border p-3 text-sm ${
                      isDone
                        ? "border-[#c8e2cd] bg-[#f4faf4] text-[#2f7a47]"
                        : "border-[#e2dbd4] bg-white text-[#151311]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{isDone ? "✓" : "○"}</span>
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <p className="mt-1 pl-5 text-xs text-[#5f5953]">{action.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Related benefits */}
        {relatedBenefits.length > 0 && (
          <section className="mb-5">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9a7b72]">
              Related Benefits
            </p>
            <div className="space-y-2">
              {relatedBenefits.map((benefit) => (
                <div key={benefit.id} className="rounded-lg border border-[#e2dbd4] bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[#151311]">{benefit.name}</span>
                    <span className="shrink-0 rounded-md bg-[#eef6ef] px-2 py-0.5 text-[10px] font-semibold text-[#2f7a47]">
                      {benefit.estimated_value.display}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#5f5953]">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ask AI */}
        <section>
          <Link
            href={`/ask-ai`}
            className="flex items-center gap-2 rounded-xl border border-[#e2dbd4] bg-gradient-to-r from-[#faf8f6] to-white px-4 py-3 text-sm font-medium text-[#151311] transition hover:border-[#d0c9c1] hover:shadow-[0_2px_8px_rgba(200,34,51,0.08)]"
          >
            <span className="rounded-lg bg-[#fff1f2] px-2 py-1 text-xs">🤖</span>
            <div>
              <p className="font-semibold">Ask AI about this</p>
              <p className="text-xs text-[#5f5953]">{node.askAiPrompt}</p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}

/* ── SVG Node component ── */

function MapNode({
  node,
  pos,
  status,
  isSelected,
  onClick,
}: {
  node: MindMapNode;
  pos: NodePosition;
  status: MindMapNodeStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusColor = NODE_STATUS_COLORS[status];
  const isRoot = node.id === "you";
  const isDomain = node.parentId === "you";

  const fontSize = isRoot ? 13 : isDomain ? 11 : 9.5;
  const iconSize = isRoot ? 22 : isDomain ? 17 : 13;
  const labelOffset = pos.r + 14;

  return (
    <g
      className="mindmap-node-animated cursor-pointer"
      onClick={onClick}
      style={{ "--node-delay": `${Math.random() * 0.4}s` } as React.CSSProperties}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={pos.r + 6}
          fill="none"
          stroke="#c82233"
          strokeWidth={3}
          opacity={0.7}
          className="mindmap-pulse"
        />
      )}

      {/* Status ring */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={pos.r + 2}
        fill="none"
        stroke={statusColor.ring}
        strokeWidth={2}
        opacity={0.5}
      />

      {/* Node circle */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={pos.r}
        fill={isSelected ? statusColor.bg : "white"}
        stroke={isSelected ? statusColor.ring : "#e2dbd4"}
        strokeWidth={isSelected ? 2.5 : 1.5}
        className="transition-all duration-200"
      />

      {/* Relevant-now pulse */}
      {status === "relevant_now" && !isSelected && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={pos.r + 4}
          fill="none"
          stroke={statusColor.ring}
          strokeWidth={1.5}
          className="mindmap-pulse"
          opacity={0.35}
        />
      )}

      {/* Icon */}
      <text
        x={pos.x}
        y={pos.y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={iconSize}
        className="pointer-events-none select-none"
      >
        {node.icon}
      </text>

      {/* Label */}
      <text
        x={pos.x}
        y={pos.y + labelOffset}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={isDomain || isRoot ? 700 : 500}
        fill={isSelected ? statusColor.text : "#151311"}
        className="pointer-events-none select-none"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {node.label}
      </text>
    </g>
  );
}

/* ── Connection lines ── */

function ConnectionLines({ nodes }: { nodes: MindMapNode[] }) {
  const lines: Array<{ from: NodePosition; to: NodePosition; isDomain: boolean }> = [];

  for (const node of nodes) {
    if (!node.parentId) continue;
    const fromPos = NODE_POSITIONS.get(node.parentId);
    const toPos = NODE_POSITIONS.get(node.id);
    if (!fromPos || !toPos) continue;

    lines.push({
      from: fromPos,
      to: toPos,
      isDomain: node.parentId === "you",
    });
  }

  return (
    <g>
      {lines.map((line, i) => {
        const dx = line.to.x - line.from.x;
        const dy = line.to.y - line.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;

        const x1 = line.from.x + nx * (line.from.r + 2);
        const y1 = line.from.y + ny * (line.from.r + 2);
        const x2 = line.to.x - nx * (line.to.r + 2);
        const y2 = line.to.y - ny * (line.to.r + 2);

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={line.isDomain ? "#d4c9c0" : "#e2dbd4"}
            strokeWidth={line.isDomain ? 2 : 1.2}
            strokeLinecap="round"
            opacity={line.isDomain ? 0.8 : 0.5}
          />
        );
      })}
    </g>
  );
}

/* ── Zoom controls ── */

function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-xl border border-[#e2dbd4] bg-white/95 p-1 shadow-[0_4px_16px_rgba(20,15,12,0.08)] backdrop-blur">
      <button
        type="button"
        onClick={onZoomOut}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#151311] transition hover:bg-[#faf8f6]"
      >
        −
      </button>
      <span className="min-w-[48px] text-center text-xs font-medium text-[#5f5953]">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#151311] transition hover:bg-[#faf8f6]"
      >
        +
      </button>
      <div className="mx-0.5 h-4 w-px bg-[#e2dbd4]" />
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#5f5953] transition hover:bg-[#faf8f6]"
      >
        Reset
      </button>
    </div>
  );
}

/* ── Legend ── */

function Legend() {
  const items: Array<{ status: MindMapNodeStatus; label: string }> = [
    { status: "relevant_now", label: "Relevant Now" },
    { status: "in_progress", label: "In Progress" },
    { status: "completed", label: "Completed" },
    { status: "explore_later", label: "Explore Later" },
  ];

  return (
    <div className="absolute left-5 top-5 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-[#e2dbd4] bg-white/95 px-4 py-2.5 shadow-[0_4px_16px_rgba(20,15,12,0.08)] backdrop-blur">
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: NODE_STATUS_COLORS[item.status].ring }}
          />
          <span className="text-[11px] font-medium text-[#5f5953]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── MindMap page ── */

export default function MindMapPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [actionCompletion, setActionCompletion] = useState<ActionCompletionMap>({});
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDrag = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Load data ── */

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) {
        setProfile(null);
        setIsDataLoading(false);
      }
      return;
    }

    let cancelled = false;

    const load = async () => {
      const [loadedProfile, completionMap] = await Promise.all([
        loadPersistedUserProfile(userId),
        loadPersistedActionCompletion(userId),
      ]);
      if (!cancelled) {
        setProfile(loadedProfile);
        setActionCompletion(completionMap);
        setIsDataLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (isAuthenticated && profile === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, profile, router]);

  /* ── Recommendations ── */

  const recommendations = useMemo(() => {
    if (!profile) return null;
    return getRecommendations(profile);
  }, [profile]);

  const matchedActions = useMemo(() => recommendations?.matchedActions ?? [], [recommendations]);
  const matchedBenefits = useMemo(() => recommendations?.matchedBenefits ?? [], [recommendations]);

  /* ── Node statuses ── */

  const nodeStatuses = useMemo(() => {
    const map = new Map<string, MindMapNodeStatus>();
    for (const node of ALL_NODES) {
      map.set(
        node.id,
        computeNodeStatus(node, profile ?? null, actionCompletion, matchedActions, matchedBenefits)
      );
    }
    return map;
  }, [profile, actionCompletion, matchedActions, matchedBenefits]);

  /* ── Selected node ── */

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return ALL_NODES.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId]);

  /* ── Node click handler (called from SVG <g> onClick) ── */

  const handleNodeClick = useCallback((nodeId: string) => {
    // Only select if the user didn't drag
    if (didDrag.current) return;
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  /* ── Pan & Zoom handlers ── */

  const DRAG_THRESHOLD = 5;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      didDrag.current = false;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        didDrag.current = true;
      }
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  }, []);

  /* ── Loading states ── */

  if (isLoading || profile === undefined || isDataLoading) {
    return (
      <AppShell activePath="/mindmap">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-base text-[#5f5953]">
          Loading your mind map...
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId) return null;

  if (profile === null) {
    return (
      <AppShell activePath="/mindmap">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-base text-[#5f5953]">
          Redirecting to onboarding...
        </div>
      </AppShell>
    );
  }

  /* ── Determine which nodes to show ── */
  const visibleNodes = ALL_NODES;

  return (
    <AppShell activePath="/mindmap" maxWidthClassName="max-w-[1440px]">
      <AppPageHeader
        eyebrow="MindMap"
        title="Your adult-life map"
        description="Explore the domains of Canadian adulthood. Click nodes to learn more, see related actions, and get guidance."
      />

      <div className="relative overflow-hidden rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-[#f5f2ee] shadow-[0_4px_24px_rgba(20,15,12,0.06)]" style={{ height: "calc(100vh - 240px)", minHeight: 520 }}>
        <Legend />
        <ZoomControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.15))}
          onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.15))}
          onReset={handleReset}
        />

        {/* Canvas container */}
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isPanning ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* Subtle radial grid (decorative) */}
            <circle cx={CENTER_X} cy={CENTER_Y} r={DOMAIN_RADIUS} fill="none" stroke="#e8e2db" strokeWidth={1} strokeDasharray="4 6" opacity={0.4} />
            <circle cx={CENTER_X} cy={CENTER_Y} r={DOMAIN_RADIUS + CHILD_RADIUS} fill="none" stroke="#ede7e0" strokeWidth={0.8} strokeDasharray="3 8" opacity={0.25} />

            {/* Connection lines */}
            <ConnectionLines nodes={visibleNodes} />

            {/* Nodes */}
            {visibleNodes.map((node) => {
              const pos = NODE_POSITIONS.get(node.id);
              if (!pos) return null;

              return (
                <MapNode
                  key={node.id}
                  node={node}
                  pos={pos}
                  status={nodeStatuses.get(node.id) ?? "explore_later"}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => handleNodeClick(node.id)}
                />
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            status={nodeStatuses.get(selectedNode.id) ?? "explore_later"}
            matchedActions={matchedActions}
            matchedBenefits={matchedBenefits}
            actionCompletion={actionCompletion}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
