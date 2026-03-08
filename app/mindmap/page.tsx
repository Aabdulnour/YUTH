"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import {
  loadPersistedActionCompletion,
  type ActionCompletionMap,
} from "@/lib/persistence/action-store";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { getRecommendations } from "@/lib/recommendations/engine";
import {
  ALL_NODES,
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

const CANVAS_W = 1800;
const CANVAS_H = 1400;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;
const DOMAIN_RADIUS = 340;
const CHILD_RADIUS = 200;
const ROOT_R = 48;
const DOMAIN_R = 38;
const CHILD_R = 26;
const INITIAL_ZOOM = 0.95;
const INITIAL_PAN = { x: -40, y: 12 };

/* ── Position helpers ── */

interface NodePosition {
  x: number;
  y: number;
  r: number;
}

function computePositions(): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();

  positions.set(ROOT_NODE.id, { x: CENTER_X, y: CENTER_Y, r: ROOT_R });

  const domainCount = DOMAIN_NODES.length;
  DOMAIN_NODES.forEach((domain, i) => {
    const angle = (2 * Math.PI * i) / domainCount - Math.PI / 2;
    positions.set(domain.id, {
      x: CENTER_X + DOMAIN_RADIUS * Math.cos(angle),
      y: CENTER_Y + DOMAIN_RADIUS * Math.sin(angle),
      r: DOMAIN_R,
    });

    const children = getChildNodes(domain.id);
    const childCount = children.length;
    const spread = Math.PI * 0.48;
    const startAngle = angle - spread / 2;

    children.forEach((child, j) => {
      const childAngle =
        childCount === 1
          ? angle
          : startAngle + (spread * j) / (childCount - 1);
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
  const isRoot = node.id === "you";
  const nextAction =
    relatedActions.find((action) => !actionCompletion[action.id]) ?? relatedActions[0] ?? null;
  const featuredBenefit = relatedBenefits[0] ?? null;
  const askAiLabel = isRoot ? "Ask AI about your priorities" : "Ask AI about this";

  return (
    <div className="mindmap-panel-animated absolute right-0 top-0 z-30 flex h-full w-[380px] flex-col border-l border-[#e8e3dd] bg-[linear-gradient(180deg,#fffdfb_0%,#f9f5f1_100%)] shadow-[-10px_0_36px_rgba(20,15,12,0.08)]">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: statusColor.bg }}
          >
            {node.icon}
          </span>
          <div>
            <h2 className="text-[15px] font-bold leading-tight text-[#151311]">
              {node.label}
            </h2>
            <span
              className="mt-0.5 inline-block rounded-md px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: statusColor.text, backgroundColor: statusColor.bg }}
            >
              {NODE_STATUS_LABELS[status]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9a9590] transition-colors hover:bg-[#f0ece7] hover:text-[#5f5953]"
          aria-label="Close panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="mx-6 h-px bg-[#eae5df]" />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="text-[13px] leading-[1.65] text-[#6b655e]">
          {node.description}
        </p>

        <div className="mt-5 rounded-xl bg-[#f7f4f1] px-4 py-3.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09890]">
            Why it matters
          </p>
          <p className="text-[13px] leading-[1.6] text-[#302c28]">
            {node.whyItMatters}
          </p>
        </div>

        {node.nextStep && (
          <div className="mt-4 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09890]">
              Next step
            </p>
            <p className="text-[13px] font-medium leading-[1.55] text-[#151311]">
              {node.nextStep}
            </p>
          </div>
        )}

        {relatedActions.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09890]">
              Actions
            </p>
            <div className="space-y-1.5">
              {relatedActions.map((action) => {
                const isDone = Boolean(actionCompletion[action.id]);
                return (
                  <div
                    key={action.id}
                    className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[13px] ${
                      isDone
                        ? "bg-[#f0f7f1] text-[#357a48]"
                        : "bg-[#f7f4f1] text-[#302c28]"
                    }`}
                  >
                    <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]"
                      style={{
                        backgroundColor: isDone ? "#d4ecd8" : "#e8e3dd",
                        color: isDone ? "#2a6b3a" : "#8a8580",
                      }}
                    >
                      {isDone ? "✓" : "·"}
                    </span>
                    <span className="font-medium leading-snug">{action.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {relatedBenefits.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09890]">
              Benefits you may qualify for
            </p>
            <div className="space-y-1.5">
              {relatedBenefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-center justify-between rounded-lg bg-[#f7f4f1] px-3 py-2.5"
                >
                  <span className="text-[13px] font-medium text-[#302c28]">
                    {benefit.name}
                  </span>
                  <span className="rounded-md bg-[#e8f5ea] px-2 py-0.5 text-[10px] font-bold text-[#357a48]">
                    {benefit.estimated_value.display}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-[#eae5df] pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09890]">
            Next move
          </p>
          <div className="space-y-2.5">
            <Link
              href={`/ask-ai?topic=${encodeURIComponent(node.askAiPrompt)}`}
              className="group flex items-center gap-3 rounded-xl border border-[#f0d8dc] bg-[#fff7f8] px-4 py-3 transition-all hover:border-[#e5b7bf] hover:shadow-[0_2px_12px_rgba(200,34,51,0.08)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1f2] text-sm transition-transform group-hover:scale-105">
                🤖
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#151311]">{askAiLabel}</p>
                <p className="truncate text-[11px] text-[#8a8580]">{node.askAiPrompt}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-[#c4bdb5] transition-colors group-hover:text-[#c82233]" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>

            {nextAction ? (
              nextAction.externalLink ? (
                <a
                  href={nextAction.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3 transition-all hover:border-[#d4cec6] hover:shadow-[0_2px_12px_rgba(20,15,12,0.06)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f2ee] text-sm">↗</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#151311]">
                      {nextAction.externalLinkLabel ?? "View related action"}
                    </p>
                    <p className="truncate text-[11px] text-[#8a8580]">{nextAction.title}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[#c4bdb5] transition-colors group-hover:text-[#151311]" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              ) : (
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-3 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3 transition-all hover:border-[#d4cec6] hover:shadow-[0_2px_12px_rgba(20,15,12,0.06)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f2ee] text-sm">→</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#151311]">Go to dashboard area</p>
                    <p className="truncate text-[11px] text-[#8a8580]">{nextAction.title}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[#c4bdb5] transition-colors group-hover:text-[#151311]" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              )
            ) : (
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3 transition-all hover:border-[#d4cec6] hover:shadow-[0_2px_12px_rgba(20,15,12,0.06)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f2ee] text-sm">→</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[#151311]">Go to dashboard area</p>
                  <p className="truncate text-[11px] text-[#8a8580]">
                    Review the actions and benefits connected to this path.
                  </p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-[#c4bdb5] transition-colors group-hover:text-[#151311]" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            )}

            {featuredBenefit ? (
              featuredBenefit.sourceUrl ? (
                <a
                  href={featuredBenefit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3 transition-all hover:border-[#d4cec6] hover:shadow-[0_2px_12px_rgba(20,15,12,0.06)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef6ef] text-sm">+</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#151311]">Explore benefit</p>
                    <p className="truncate text-[11px] text-[#8a8580]">{featuredBenefit.name}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[#c4bdb5] transition-colors group-hover:text-[#151311]" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              ) : (
                <Link
                  href="/hub"
                  className="group flex items-center gap-3 rounded-xl border border-[#e8e3dd] bg-white px-4 py-3 transition-all hover:border-[#d4cec6] hover:shadow-[0_2px_12px_rgba(20,15,12,0.06)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef6ef] text-sm">+</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#151311]">Explore benefit</p>
                    <p className="truncate text-[11px] text-[#8a8580]">{featuredBenefit.name}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[#c4bdb5] transition-colors group-hover:text-[#151311]" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              )
            ) : null}
          </div>
        </div>
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

  const iconSize = isRoot ? 24 : isDomain ? 18 : 14;
  const fontSize = isRoot ? 14 : isDomain ? 11.5 : 10;
  const labelOffset = pos.r + 16;
  const animationDelay = isRoot ? "0s" : isDomain ? "0.08s" : "0.16s";

  // Softer node fill with a light tint when relevant.
  const baseFill = isRoot
    ? "#fff8f8"
    : status === "relevant_now"
      ? "#fffbfb"
      : status === "completed"
        ? "#f9fdf9"
        : "white";

  const baseStroke = isRoot
    ? "#d4a0a8"
    : isSelected
      ? statusColor.ring
      : status === "explore_later"
        ? "#e0dbd5"
        : `${statusColor.ring}40`;

  return (
    <g
      className="mindmap-node-animated cursor-pointer"
      onClick={onClick}
      style={{ "--node-delay": animationDelay } as React.CSSProperties}
    >
      {/* Larger invisible hover target for easier clicking */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={pos.r + 8}
        fill="transparent"
        className="pointer-events-auto"
      />

      {/* Selection glow */}
      {isSelected && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={pos.r + 8}
          fill="none"
          stroke="#c82233"
          strokeWidth={2}
          opacity={0.25}
        />
      )}

      {/* Subtle status dot in the lower corner */}
      {status !== "explore_later" && !isRoot && (
        <circle
          cx={pos.x + pos.r * 0.65}
          cy={pos.y + pos.r * 0.65}
          r={isDomain ? 5 : 4}
          fill={statusColor.ring}
          stroke="white"
          strokeWidth={2}
          className="pointer-events-none"
        />
      )}

      {/* Node circle */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={pos.r}
        fill={isSelected ? statusColor.bg : baseFill}
        stroke={isSelected ? statusColor.ring : baseStroke}
        strokeWidth={isSelected ? 2 : isRoot ? 2 : 1.2}
        className="mindmap-node-circle"
      />

      {/* Relevant-now subtle pulse */}
      {status === "relevant_now" && !isSelected && isDomain && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={pos.r + 5}
          fill="none"
          stroke={statusColor.ring}
          strokeWidth={1}
          className="mindmap-pulse"
          opacity={0.2}
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
        fontWeight={isDomain || isRoot ? 600 : 500}
        fill={isSelected ? "#151311" : isDomain || isRoot ? "#302c28" : "#7a756f"}
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
  return (
    <g>
      {nodes.map((node) => {
        if (!node.parentId) return null;
        const fromPos = NODE_POSITIONS.get(node.parentId);
        const toPos = NODE_POSITIONS.get(node.id);
        if (!fromPos || !toPos) return null;

        const isDomain = node.parentId === "you";
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;

        const x1 = fromPos.x + nx * (fromPos.r + 3);
        const y1 = fromPos.y + ny * (fromPos.r + 3);
        const x2 = toPos.x - nx * (toPos.r + 3);
        const y2 = toPos.y - ny * (toPos.r + 3);

        // Curved connections for domain lines
        if (isDomain) {
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const perpX = -ny * 15;
          const perpY = nx * 15;
          return (
            <path
              key={node.id}
              d={`M${x1},${y1} Q${mx + perpX},${my + perpY} ${x2},${y2}`}
              fill="none"
              stroke="#ddd7cf"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.6}
            />
          );
        }

        return (
          <line
            key={node.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#e8e3dd"
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.45}
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
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-0.5 rounded-xl border border-white/70 bg-white/85 p-1 shadow-[0_10px_24px_rgba(20,15,12,0.08)] backdrop-blur-sm">
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-[#6b655e] transition-colors hover:bg-[#f5f2ee]"
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="min-w-[38px] text-center text-[10px] font-medium tabular-nums text-[#9a9590]">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-[#6b655e] transition-colors hover:bg-[#f5f2ee]"
        aria-label="Zoom in"
      >
        +
      </button>
      <div className="mx-px h-4 w-px bg-[#e8e3dd]" />
      <button
        type="button"
        onClick={onReset}
        className="flex h-7 items-center justify-center rounded-md px-2 text-[10px] font-medium text-[#9a9590] transition-colors hover:bg-[#f5f2ee] hover:text-[#6b655e]"
      >
        Reset
      </button>
    </div>
  );
}

/* ── Legend ── */

function Legend() {
  const items: Array<{ status: MindMapNodeStatus; label: string }> = [
    { status: "relevant_now", label: "Relevant" },
    { status: "in_progress", label: "In Progress" },
    { status: "completed", label: "Done" },
    { status: "explore_later", label: "Explore" },
  ];

  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-3 rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-[0_10px_24px_rgba(20,15,12,0.08)] backdrop-blur-sm">
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: NODE_STATUS_COLORS[item.status].ring }}
          />
          <span className="text-[10px] font-medium text-[#9a9590]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── MindMap page ── */

export default function MindMapPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [profile, setProfile] = useState<UserProfile | null | undefined>(
    undefined
  );
  const [actionCompletion, setActionCompletion] = useState<ActionCompletionMap>(
    {}
  );
  const [loadedMindMapUserId, setLoadedMindMapUserId] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState(INITIAL_PAN);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDrag = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Load data ── */

  useEffect(() => {
    if (!isAuthenticated || !userId) {
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
        setLoadedMindMapUserId(userId);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
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

  const matchedActions = useMemo(
    () => recommendations?.matchedActions ?? [],
    [recommendations]
  );
  const matchedBenefits = useMemo(
    () => recommendations?.matchedBenefits ?? [],
    [recommendations]
  );

  /* ── Node statuses ── */

  const nodeStatuses = useMemo(() => {
    const map = new Map<string, MindMapNodeStatus>();
    for (const node of ALL_NODES) {
      map.set(
        node.id,
        computeNodeStatus(
          node,
          profile ?? null,
          actionCompletion,
          matchedActions,
          matchedBenefits
        )
      );
    }
    return map;
  }, [profile, actionCompletion, matchedActions, matchedBenefits]);

  /* ── Selected node ── */

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return ALL_NODES.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId]);

  const expandedDomainId = useMemo(() => {
    if (!selectedNode || selectedNode.id === ROOT_NODE.id) {
      return null;
    }

    return selectedNode.parentId === ROOT_NODE.id ? selectedNode.id : selectedNode.parentId;
  }, [selectedNode]);

  /* ── Node click handler ── */

  const handleNodeClick = useCallback((nodeId: string) => {
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
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
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
      setPan({
        x: panStart.current.panX + dx,
        y: panStart.current.panY + dy,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    setSelectedNodeId(null);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(INITIAL_ZOOM);
    setPan(INITIAL_PAN);
  }, []);

  /* ── Loading states ── */

  if (isLoading || (isAuthenticated && userId && loadedMindMapUserId !== userId)) {
    return (
      <AppShell activePath="/mindmap">
        <div className="flex items-center justify-center rounded-2xl border border-[#e8e3dd] bg-[#faf8f6] p-16">
          <div className="text-center">
            <p className="text-sm font-medium text-[#9a9590]">Loading your map…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId) return null;

  if (profile === null) {
    return (
      <AppShell activePath="/mindmap">
        <div className="rounded-2xl border border-[#e8e3dd] bg-[#faf8f6] p-8 text-sm text-[#6b655e]">
          Redirecting to onboarding…
        </div>
      </AppShell>
    );
  }

  /* ── Count relevant nodes for intro ── */
  const relevantCount = Array.from(nodeStatuses.values()).filter(
    (s) => s === "relevant_now"
  ).length;
  const visibleNodes = ALL_NODES.filter((node) => {
    if (node.id === ROOT_NODE.id || node.parentId === ROOT_NODE.id) {
      return true;
    }

    return node.parentId === expandedDomainId;
  });

  return (
    <AppShell activePath="/mindmap" maxWidthClassName="max-w-[1440px]">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">MindMap</p>
        <h1 className="mt-1 text-2xl font-bold text-[#151311]">Your adult life map</h1>
      </div>

      <div
        className="relative overflow-hidden rounded-[28px] border border-[#e8e3dd] bg-[#fdfbf9] shadow-[0_14px_42px_rgba(20,15,12,0.06)]"
        style={{
          height: "calc(100vh - 228px)",
          minHeight: 580,
          backgroundImage: "linear-gradient(180deg, #fffdfa 0%, #f6f0e9 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[12%] top-[10%] h-[320px] w-[320px] rounded-full bg-[#f4be73] opacity-[0.18] blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f2d7bd] opacity-[0.3] blur-[120px]" />
          <div className="absolute right-[8%] top-[18%] h-[300px] w-[300px] rounded-full bg-[#ef7a88] opacity-[0.16] blur-[130px]" />
          <div className="absolute bottom-[-40px] left-[28%] h-[220px] w-[220px] rounded-full bg-[#fff6ea] opacity-[0.8] blur-[80px]" />
        </div>

        <div className="absolute left-4 top-4 z-20 max-w-[280px] rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(20,15,12,0.07)] backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">Focus view</p>
          <p className="mt-1 text-sm font-semibold text-[#151311]">
            {relevantCount > 0
              ? `${relevantCount} area${relevantCount > 1 ? "s are" : " is"} relevant right now`
              : "Explore the domains of Canadian adulthood"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#6b655e]">
            Click one domain at a time for a cleaner path, then drag or zoom to explore the map.
          </p>
        </div>

        <Legend />
        <ZoomControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.15))}
          onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.15))}
          onReset={handleReset}
        />

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
              transition: isPanning ? "none" : "transform 0.18s ease-out",
            }}
          >
            <rect
              x="0"
              y="0"
              width={CANVAS_W}
              height={CANVAS_H}
              fill="transparent"
              onClick={handleCanvasClick}
            />

            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={DOMAIN_RADIUS}
              fill="none"
              stroke="#ece7e0"
              strokeWidth={0.8}
              strokeDasharray="6 10"
              opacity={0.38}
            />

            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={DOMAIN_RADIUS + 70}
              fill="none"
              stroke="#f2dfd3"
              strokeWidth={1}
              opacity={0.32}
            />

            <ConnectionLines nodes={visibleNodes} />

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
