"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import {
  loadPersistedActionCompletion,
  setPersistedActionCompletion,
  type ActionCompletionMap,
} from "@/lib/persistence/action-store";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { recordWeeklyMetrics } from "@/lib/persistence/weekly-metrics-store";
import {
  calculateAdultScore,
  getRecommendations,
  type AdultScoreTier,
} from "@/lib/recommendations/engine";
import type { ActionPriority } from "@/types/action";
import type { BenefitCategory } from "@/types/benefit";
import type {
  ExtensionDecision,
  ExtensionDecisionsResponse,
  Recommendation,
} from "@/types/extension";
import type { UserProfile } from "@/types/profile";

/* ── Visual tokens ── */

const priorityClasses: Record<ActionPriority, string> = {
  high: "bg-[#fff1f2] text-[#c82233] border-[#f5d0d4]",
  medium: "bg-[#fef8ec] text-[#92620a] border-[#eed9a8]",
  low: "bg-[#edf3f9] text-[#345d81] border-[#c8daea]",
};

const categoryClasses: Record<BenefitCategory, string> = {
  tax_credit: "bg-[#eef6ef] text-[#2f7a47]",
  education: "bg-[#edf3f9] text-[#345d81]",
  savings_account: "bg-[#fef8ec] text-[#92620a]",
  housing: "bg-[#fff1f2] text-[#c82233]",
  financial_support: "bg-[#f3eef8] text-[#62448d]",
};

const categoryLabels: Record<BenefitCategory, string> = {
  tax_credit: "Tax Credit",
  education: "Education",
  savings_account: "Savings",
  housing: "Housing",
  financial_support: "Financial Support",
};

const scoreTierColors: Record<AdultScoreTier, string> = {
  "Starting Out": "#c82233",
  Progressing: "#92620a",
  Strong: "#2f7a47",
  Optimized: "#345d81",
};

const scoreTierClasses: Record<AdultScoreTier, string> = {
  "Starting Out": "bg-[#fff1f2] text-[#c82233]",
  Progressing: "bg-[#fef8ec] text-[#92620a]",
  Strong: "bg-[#eef6ef] text-[#2f7a47]",
  Optimized: "bg-[#edf3f9] text-[#345d81]",
};

const extensionRecommendationLabels: Record<Recommendation, string> = {
  buy_now: "On Track",
  wait: "Pause",
  find_cheaper_option: "Cheaper Option",
  save_for_later: "Save for Later",
  review_budget: "Review Budget",
};

const extensionRecommendationClasses: Record<Recommendation, string> = {
  buy_now: "bg-[#eef6ef] text-[#2f7a47]",
  wait: "bg-[#fef8ec] text-[#92620a]",
  find_cheaper_option: "bg-[#fef8ec] text-[#92620a]",
  save_for_later: "bg-[#fff1f2] text-[#c82233]",
  review_budget: "bg-[#edf3f9] text-[#345d81]",
};

function formatPriority(priority: ActionPriority): string {
  return priority.toUpperCase();
}

function formatDecisionTimestamp(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatDecisionMerchant(merchant: string): string {
  if (merchant.toLowerCase() === "bestbuy") {
    return "Best Buy";
  }

  return merchant.charAt(0).toUpperCase() + merchant.slice(1);
}

function formatDecisionCategory(category: string): string {
  return category
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (value) => value.toUpperCase());
}

/* ── Score ring ── */

const RING_SIZE = 160;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score, tier }: { score: number; tier: AdultScoreTier }) {
  const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
  const ringColor = scoreTierColors[tier];

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#e2dbd4"
          strokeWidth={RING_STROKE}
        />
        {/* Fill */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          className="score-ring-animated"
          style={
            {
              "--ring-circumference": RING_CIRCUMFERENCE,
              "--ring-offset": offset,
            } as React.CSSProperties
          }
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[#151311]">{score}</span>
        <span
          className={`mt-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${scoreTierClasses[tier]}`}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}

/* ── Source cue ── */

function SourceCue({ label, url }: { label?: string; url?: string }) {
  if (!label) {
    return null;
  }

  if (!url) {
    return <span className="text-xs text-[#9a7b72]">Source: {label}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[#9a7b72] underline-offset-4 transition hover:text-[#151311] hover:underline"
    >
      Source: {label}
    </a>
  );
}

/* ── Dashboard page ── */

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [actionCompletion, setActionCompletion] = useState<ActionCompletionMap>({});
  const [isActionStateLoading, setIsActionStateLoading] = useState(true);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [actionSaveError, setActionSaveError] = useState<string | null>(null);
  const [recentExtensionDecisions, setRecentExtensionDecisions] = useState<ExtensionDecision[]>([]);
  const [isDecisionHistoryLoading, setIsDecisionHistoryLoading] = useState(true);
  const [decisionHistoryStorage, setDecisionHistoryStorage] = useState<"supabase" | "local">("local");
  const [decisionHistoryError, setDecisionHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) {
        setProfile(null);
      }

      return;
    }

    let isCancelled = false;

    const loadProfile = async () => {
      const nextProfile = await loadPersistedUserProfile(userId);
      if (!isCancelled) {
        setProfile(nextProfile);
      }
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) {
        setIsActionStateLoading(false);
      }

      return;
    }

    let isCancelled = false;

    const loadActionState = async () => {
      const completionMap = await loadPersistedActionCompletion(userId);
      if (!isCancelled) {
        setActionCompletion(completionMap);
        setIsActionStateLoading(false);
      }
    };

    void loadActionState();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) {
        setRecentExtensionDecisions([]);
        setIsDecisionHistoryLoading(false);
      }

      return;
    }

    let isCancelled = false;

    const loadDecisionHistory = async () => {
      setDecisionHistoryError(null);
      setIsDecisionHistoryLoading(true);

      try {
        const params = new URLSearchParams({
          userId,
          limit: "5",
        });

        const response = await fetch(`/api/extension/decisions?${params.toString()}`, {
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | Partial<ExtensionDecisionsResponse>
          | null;

        if (!response.ok || !payload?.ok || !Array.isArray(payload.decisions)) {
          throw new Error(payload?.error ?? "Could not load recent extension decisions.");
        }

        if (!isCancelled) {
          setRecentExtensionDecisions(payload.decisions as ExtensionDecision[]);
          if (payload.storage === "supabase" || payload.storage === "local") {
            setDecisionHistoryStorage(payload.storage);
          }
        }
      } catch {
        if (!isCancelled) {
          setRecentExtensionDecisions([]);
          setDecisionHistoryError("Could not load recent browser decisions.");
        }
      } finally {
        if (!isCancelled) {
          setIsDecisionHistoryLoading(false);
        }
      }
    };

    void loadDecisionHistory();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (isAuthenticated && profile === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, profile, router]);

  const recommendations = useMemo(() => {
    if (!profile) {
      return null;
    }

    return getRecommendations(profile);
  }, [profile]);

  const completedActionCount = useMemo(() => {
    if (!recommendations) {
      return 0;
    }

    return recommendations.matchedActions.filter((action) => actionCompletion[action.id]).length;
  }, [actionCompletion, recommendations]);

  const adultScore = useMemo(() => {
    if (!profile || !recommendations) {
      return null;
    }

    return calculateAdultScore(profile, completedActionCount, recommendations.matchedActions.length);
  }, [completedActionCount, profile, recommendations]);

  const insightCards = useMemo(() => {
    if (!recommendations) {
      return [];
    }

    return recommendations.insights.map((insight, index) => ({
      title: `Insight ${index + 1}`,
      body: insight,
    }));
  }, [recommendations]);

  useEffect(() => {
    if (!userId || !adultScore || !recommendations) {
      return;
    }

    recordWeeklyMetrics(userId, {
      completedActionCount,
      adultScore: adultScore.score,
      benefitIds: recommendations.matchedBenefits.map((benefit) => benefit.id),
    });
  }, [adultScore, completedActionCount, recommendations, userId]);

  const handleSetActionCompletion = async (actionId: string, completed: boolean) => {
    if (!userId) {
      return;
    }

    setActionSaveError(null);
    setSavingActionId(actionId);

    const previousValue = Boolean(actionCompletion[actionId]);
    setActionCompletion((currentState) => ({
      ...currentState,
      [actionId]: completed,
    }));

    try {
      await setPersistedActionCompletion(userId, actionId, completed);
    } catch {
      setActionCompletion((currentState) => ({
        ...currentState,
        [actionId]: previousValue,
      }));
      setActionSaveError("Could not save action progress. Please try again.");
    } finally {
      setSavingActionId((currentActionId) => (currentActionId === actionId ? null : currentActionId));
    }
  };

  /* ── Loading / auth states (unchanged logic) ── */

  if (isLoading || profile === undefined || isActionStateLoading) {
    return (
      <AppShell activePath="/dashboard">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-base text-[#5f5953]">
          Loading your recommendations...
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  if (profile === null) {
    return (
      <AppShell activePath="/dashboard">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-base text-[#5f5953]">
          Redirecting to onboarding...
        </div>
      </AppShell>
    );
  }

  if (!profile || !recommendations || !adultScore) {
    return (
      <AppShell activePath="/dashboard">
        <AppPageHeader
          eyebrow="Dashboard"
          title="No profile yet"
          description="Complete onboarding so MapleMind can personalize your benefits, actions, and financial next steps."
        />
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8">
          <Link
            href="/onboarding"
            className="rounded-xl bg-[#c82233] px-7 py-3 text-center font-semibold text-white shadow-[0_0_20px_rgba(200,34,51,0.25)] transition hover:bg-[#b01e2d]"
          >
            Start onboarding
          </Link>
        </div>
      </AppShell>
    );
  }

  /* ── Main dashboard ── */

  return (
    <AppShell activePath="/dashboard" maxWidthClassName="max-w-7xl">
      <AppPageHeader
        eyebrow="Dashboard"
        title="Your personalized plan"
        description="Benefits, actions, and financial clarity matched to your Canadian profile."
      />

      {/* ── Row 1: Adult Score + Top Insight ── */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Score ring card */}
        <section className="flex flex-col items-center rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-white px-8 py-6 shadow-[0_4px_16px_rgba(20,15,12,0.06)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">
            Adult Score
          </p>
          <ScoreRing score={adultScore.score} tier={adultScore.tier} />
          <p className="mt-3 text-sm font-medium text-[#151311]">
            {adultScore.completedActions}/{adultScore.totalActions} actions completed
          </p>
          <p className="mt-1 max-w-[220px] text-center text-xs leading-relaxed text-[#9a7b72]">
            Taxes, savings, debt, housing, employer benefits, and follow-through.
          </p>
        </section>

        {/* Top insight card */}
        <section className="rounded-2xl border border-[#e2dbd4] border-l-[#c82233] border-l-4 bg-gradient-to-br from-[#faf8f6] to-white p-6 shadow-[0_4px_16px_rgba(20,15,12,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">
            Top insight
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-snug text-[#151311]">
            {recommendations.topInsight.title}
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-[#5f5953]">
            {recommendations.topInsight.body}
          </p>
          {recommendations.topInsight.sourceUrl ? (
            <a
              href={recommendations.topInsight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-lg border border-[#e2dbd4] bg-white px-3.5 py-1.5 text-sm font-medium text-[#151311] transition hover:border-[#d0c9c1]"
            >
              {recommendations.topInsight.sourceLabel ?? "Source"}
            </a>
          ) : null}
        </section>
      </div>

      {/* ── Row 2: Priority Actions ── */}
      <section className="mb-5 rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-[#f5f2ee] p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#151311]">Priority Actions</h3>
            <p className="mt-0.5 text-sm text-[#5f5953]">
              Practical next steps ordered by priority.
            </p>
          </div>
          <p className="rounded-full bg-[#eef6ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f7a47]">
            {completedActionCount}/{recommendations.matchedActions.length} done
          </p>
        </div>

        {actionSaveError ? (
          <p className="mb-3 rounded-lg border border-[#f0cfd3] bg-[#fff1f2] px-3 py-2 text-sm text-[#c82233]">
            {actionSaveError}
          </p>
        ) : null}

        {recommendations.matchedActions.length === 0 ? (
          <div className="rounded-xl bg-white p-5 text-sm text-[#5f5953]">
            No immediate actions right now. Re-run onboarding when your situation changes.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.matchedActions.map((action) => {
              const isCompleted = Boolean(actionCompletion[action.id]);

              return (
                <article
                  key={action.id}
                  className={`rounded-xl border p-4 transition hover:shadow-[0_4px_12px_rgba(20,15,12,0.08)] ${
                    isCompleted
                      ? "border-[#c8e2cd] bg-[#f4faf4]"
                      : "border-[#e2dbd4] bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4
                      className={`text-sm font-semibold leading-snug ${
                        isCompleted ? "text-[#2f7a47]" : "text-[#151311]"
                      }`}
                    >
                      {action.title}
                    </h4>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${priorityClasses[action.priority]}`}
                    >
                      {formatPriority(action.priority)}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-[#5f5953]">{action.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SourceCue label={action.sourceLabel} url={action.sourceUrl} />
                    <button
                      type="button"
                      disabled={savingActionId === action.id}
                      onClick={() => {
                        void handleSetActionCompletion(action.id, !isCompleted);
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        isCompleted
                          ? "border border-[#c8e2cd] bg-[#eaf5ec] text-[#2f7a47]"
                          : "border border-[#e2dbd4] bg-white text-[#151311] hover:border-[#d0c9c1]"
                      }`}
                    >
                      {savingActionId === action.id
                        ? "Saving..."
                        : isCompleted
                          ? "Done"
                          : "Mark complete"}
                    </button>

                    {action.externalLink ? (
                      <a
                        href={action.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#e2dbd4] bg-white px-3 py-1 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
                      >
                        {action.externalLinkLabel ?? "Get started"}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Row 3: MapleMind Chrome Extension ── */}
      <section className="mb-5 rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-[#f5f2ee] p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#151311]">Chrome Extension</h3>
            <p className="mt-0.5 text-sm text-[#5f5953]">
              MapleMind in your browser for quick purchase decisions while shopping.
            </p>
          </div>
          <p className="rounded-full bg-[#fef8ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#92620a]">
            Preview
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-xl border border-[#e2dbd4] bg-white p-4">
            <h4 className="text-base font-semibold text-[#151311]">
              Decision support while you browse
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-[#5f5953]">
              On supported product pages, MapleMind checks budget fit, category pressure, and
              deadline risk before you buy.
            </p>

            <ul className="mt-3 space-y-1.5 text-sm text-[#5f5953]">
              <li>Instant recommendation directly in the browser side panel.</li>
              <li>Budget context tied to MapleMind spending rules.</li>
              <li>Guidance you can bring back into Ask AI for deeper decisions.</li>
            </ul>

            <p className="mt-3 rounded-lg border border-[#efe1c4] bg-[#fff8eb] px-3 py-2 text-xs text-[#7f5a1a]">
              Current sprint mode: preview uses a MapleMind demo spending profile. Real account
              sync is the next integration step.
            </p>
          </article>

          <article className="rounded-xl border border-[#e2dbd4] bg-white p-4">
            <h4 className="text-base font-semibold text-[#151311]">Supported pages (preview)</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Amazon", "Best Buy", "Sephora"].map((merchant) => (
                <span
                  key={merchant}
                  className="rounded-full border border-[#e2dbd4] bg-[#faf8f6] px-2.5 py-1 text-xs font-semibold text-[#5f5953]"
                >
                  {merchant}
                </span>
              ))}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#5f5953]">
              Use it for fast buy-or-wait checks, then return here to track actions and open Ask AI
              when the decision needs more context.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/ask-ai"
                className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-1.5 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
              >
                Open Ask AI
              </Link>
              <Link
                href="/profile"
                className="rounded-lg border border-[#e2dbd4] bg-white px-3 py-1.5 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
              >
                Update profile
              </Link>
            </div>
          </article>
        </div>

        <article className="mt-3 rounded-xl border border-[#e2dbd4] bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-semibold text-[#151311]">Recent browser decisions</h4>
              <p className="mt-0.5 text-xs text-[#5f5953]">
                Your latest extension purchase checks tied to this account when available.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                decisionHistoryStorage === "supabase"
                  ? "bg-[#eef6ef] text-[#2f7a47]"
                  : "bg-[#fef8ec] text-[#92620a]"
              }`}
            >
              {decisionHistoryStorage === "supabase" ? "Supabase" : "Local fallback"}
            </span>
          </div>

          {isDecisionHistoryLoading ? (
            <p className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-2 text-sm text-[#5f5953]">
              Loading recent extension activity...
            </p>
          ) : decisionHistoryError ? (
            <p className="rounded-lg border border-[#f0cfd3] bg-[#fff1f2] px-3 py-2 text-sm text-[#c82233]">
              {decisionHistoryError}
            </p>
          ) : recentExtensionDecisions.length === 0 ? (
            <p className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-2 text-sm text-[#5f5953]">
              No browser decisions yet. Open the MapleMind extension on a supported product page
              to start building decision history.
            </p>
          ) : (
            <div className="space-y-2">
              {recentExtensionDecisions.map((decision) => (
                <article
                  key={decision.id}
                  className="rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#151311]">
                        {decision.pageTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-[#5f5953]">
                        {formatDecisionMerchant(decision.merchant)} ·{" "}
                        {formatDecisionCategory(decision.detectedCategory)} ·{" "}
                        {formatDecisionTimestamp(decision.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${extensionRecommendationClasses[decision.recommendation]}`}
                    >
                      {extensionRecommendationLabels[decision.recommendation]}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5f5953]">
                    <span className="rounded-full bg-white px-2 py-0.5">
                      {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                      }).format(decision.purchaseAmount)}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5">
                      Deadline: {decision.deadlineRisk}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5">
                      Goal impact: {decision.goalImpact}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* ── Row 4: Benefits You May Qualify For ── */}
      <section className="mb-5 rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-[#f5f2ee] p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#151311]">Benefits You May Qualify For</h3>
            <p className="mt-0.5 text-sm text-[#5f5953]">
              {recommendations.matchedBenefits.length} programs matched · estimated{" "}
              {recommendations.estimatedValueRange.label} annually.
            </p>
          </div>
        </div>

        {recommendations.matchedBenefits.length === 0 ? (
          <div className="rounded-xl bg-white p-5 text-sm text-[#5f5953]">
            No benefits matched yet. Add more profile details in onboarding for tighter matching.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recommendations.matchedBenefits.map((benefit) => (
              <article
                key={benefit.id}
                className="rounded-xl border border-[#e2dbd4] bg-white p-4 transition hover:shadow-[0_4px_12px_rgba(20,15,12,0.08)]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${categoryClasses[benefit.category]}`}
                  >
                    {categoryLabels[benefit.category]}
                  </span>
                  <SourceCue label={benefit.sourceLabel} url={benefit.sourceUrl} />
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold leading-snug text-[#151311]">
                      {benefit.name}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5f5953]">
                      {benefit.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-[#eef6ef] px-2.5 py-1 text-sm font-semibold text-[#2f7a47]">
                    {benefit.estimated_value.display}
                  </span>
                </div>

                {benefit.sourceUrl ? (
                  <div className="mt-3">
                    <a
                      href={benefit.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-1 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
                    >
                      Learn more
                    </a>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Row 5: Personalized Insights ── */}
      <section className="rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-[#f5f2ee] p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#151311]">Personalized Insights</h3>
          <p className="mt-0.5 text-sm text-[#5f5953]">
            Short guidance based on your current profile and action readiness.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {insightCards.map((card, index) => (
            <article
              key={`${card.title}-${index}`}
              className="rounded-xl border border-[#e2dbd4] bg-white p-4"
            >
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#c82233] text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                {card.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#5f5953]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
