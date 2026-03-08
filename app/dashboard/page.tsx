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
import type { UserProfile } from "@/types/profile";

const priorityClasses: Record<ActionPriority, string> = {
  high: "bg-[#ffe8e3] text-[#b4422c]",
  medium: "bg-[#eef6ef] text-[#2f7a47]",
  low: "bg-[#edf3f9] text-[#345d81]",
};

const categoryClasses: Record<BenefitCategory, string> = {
  tax_credit: "bg-[#eef6ef] text-[#2f7a47]",
  education: "bg-[#edf3f9] text-[#345d81]",
  savings_account: "bg-[#f9efe3] text-[#9b5e1a]",
  housing: "bg-[#f6ece8] text-[#9d4f3c]",
  financial_support: "bg-[#efe8f8] text-[#62448d]",
};

const categoryLabels: Record<BenefitCategory, string> = {
  tax_credit: "Tax Credit",
  education: "Education",
  savings_account: "Savings",
  housing: "Housing",
  financial_support: "Financial Support",
};

const scoreTierClasses: Record<AdultScoreTier, string> = {
  "Starting Out": "bg-[#fff2ef] text-[#b14634]",
  Progressing: "bg-[#f8f1e8] text-[#9b5e1a]",
  Strong: "bg-[#edf5ee] text-[#2f7a47]",
  Optimized: "bg-[#e8f0fb] text-[#345d81]",
};

function formatPriority(priority: ActionPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function SourceCue({ label, url }: { label?: string; url?: string }) {
  if (!label) {
    return null;
  }

  if (!url) {
    return <span className="text-xs text-[#8a8580]">Source: {label}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[#6f6a64] underline-offset-4 transition hover:text-[#1c1b19] hover:underline"
    >
      Source: {label}
    </a>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [actionCompletion, setActionCompletion] = useState<ActionCompletionMap>({});
  const [isActionStateLoading, setIsActionStateLoading] = useState(true);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [actionSaveError, setActionSaveError] = useState<string | null>(null);

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

  if (isLoading || profile === undefined || isActionStateLoading) {
    return (
      <AppShell activePath="/dashboard">
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 text-lg shadow-sm">
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
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 text-lg shadow-sm">
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
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">
          <Link
            href="/onboarding"
            className="rounded-2xl bg-[#f04d2d] px-7 py-3 text-center font-semibold text-white transition hover:opacity-90"
          >
            Start onboarding
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/dashboard" maxWidthClassName="max-w-7xl">
      <AppPageHeader
        eyebrow="Dashboard"
        title="Your personalized plan"
        description="A focused monthly view of money opportunities, execution steps, and profile health."
      />

      <section className="mb-6 rounded-[26px] border border-[#e7dfd5] bg-white p-6 shadow-[0_10px_26px_rgba(35,31,26,0.07)]">
        <p className="text-xs uppercase tracking-[0.14em] text-[#8a8580]">Top insight</p>
        <h2 className="mt-2 text-2xl font-bold text-[#163320]">{recommendations.topInsight.title}</h2>
        <p className="mt-3 max-w-4xl text-base text-[#5e5953]">{recommendations.topInsight.body}</p>
        {recommendations.topInsight.sourceUrl ? (
          <a
            href={recommendations.topInsight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-xl border border-[#d9d1c8] bg-[#fbf8f4] px-3 py-1.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
          >
            {recommendations.topInsight.sourceLabel ?? "Source"}
          </a>
        ) : null}
      </section>

      <div className="mb-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="relative overflow-hidden rounded-[30px] border border-[#163320]/10 bg-gradient-to-r from-[#163320] to-[#1f4a33] p-8 text-white shadow-[0_22px_40px_rgba(22,51,32,0.25)]">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Money you may be missing</p>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">{recommendations.estimatedValueRange.label}</h2>
            <p className="mt-3 max-w-2xl text-base text-white/75 md:text-lg">
              Estimated annual opportunity from {recommendations.matchedBenefits.length} matched programs.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:max-w-sm">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/70">Benefits</p>
                <p className="mt-2 text-3xl font-bold">{recommendations.matchedBenefits.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/70">Actions</p>
                <p className="mt-2 text-3xl font-bold">{recommendations.matchedActions.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e8e1d9] bg-white p-7 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8a8580]">Adult Score</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-5xl font-bold text-[#163320]">{adultScore.score}</p>
            <p
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${scoreTierClasses[adultScore.tier]}`}
            >
              {adultScore.tier}
            </p>
          </div>
          <div className="mt-5 h-2 rounded-full bg-[#efe9e2]">
            <div className="h-2 rounded-full bg-[#163320]" style={{ width: `${adultScore.score}%` }} aria-hidden />
          </div>
          <p className="mt-4 text-sm text-[#6f6a64]">
            {adultScore.completedActions}/{adultScore.totalActions} actions completed
          </p>
          <p className="mt-1 text-sm text-[#6f6a64]">
            Signals: taxes, emergency savings, debt load, renter/student status, employer benefits, and action follow-through.
          </p>
        </section>
      </div>

      <div className="mb-8 grid gap-8 xl:grid-cols-[1.45fr_1fr]">
        <section>
          <div className="mb-4">
            <h3 className="text-2xl font-bold">Benefits for you</h3>
            <p className="mt-1 text-sm text-[#6f6a64]">Programs MapleMind matched to your profile today.</p>
          </div>

          {recommendations.matchedBenefits.length === 0 ? (
            <div className="rounded-2xl border border-[#e9e2da] bg-white p-6 text-[#6f6a64] shadow-sm">
              No benefits matched yet. Add more profile details in onboarding for tighter matching.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.matchedBenefits.map((benefit) => (
                <article
                  key={benefit.id}
                  className="rounded-2xl border border-[#ebe4dc] bg-white p-5 shadow-[0_10px_25px_rgba(35,31,26,0.06)]"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${categoryClasses[benefit.category]}`}
                    >
                      {categoryLabels[benefit.category]}
                    </span>
                    <SourceCue label={benefit.sourceLabel} url={benefit.sourceUrl} />
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-semibold">{benefit.name}</h4>
                      <p className="mt-2 max-w-2xl text-[#615c56]">{benefit.description}</p>
                    </div>
                    <span className="rounded-xl bg-[#eef6ef] px-3 py-2 text-sm font-semibold text-[#2f7a47]">
                      {benefit.estimated_value.display}
                    </span>
                  </div>

                  {benefit.sourceUrl ? (
                    <div className="mt-4">
                      <a
                        href={benefit.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-xl border border-[#d9d1c8] bg-[#fbf8f4] px-3 py-1.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
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

        <aside>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold">Actions this month</h3>
              <p className="mt-1 text-sm text-[#6f6a64]">Practical next steps ordered by priority.</p>
            </div>
            <p className="rounded-full bg-[#edf5ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f7a47]">
              {completedActionCount}/{recommendations.matchedActions.length} done
            </p>
          </div>

          {actionSaveError ? (
            <p className="mb-4 rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-3 py-2 text-sm text-[#b14634]">
              {actionSaveError}
            </p>
          ) : null}

          {recommendations.matchedActions.length === 0 ? (
            <div className="rounded-2xl border border-[#e9e2da] bg-white p-6 text-[#6f6a64] shadow-sm">
              No immediate actions right now. Re-run onboarding when your situation changes.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.matchedActions.map((action) => {
                const isCompleted = Boolean(actionCompletion[action.id]);

                return (
                  <article
                    key={action.id}
                    className={`rounded-2xl border p-5 shadow-[0_10px_25px_rgba(35,31,26,0.06)] ${
                      isCompleted ? "border-[#d8e8dc] bg-[#f4faf4]" : "border-[#ebe4dc] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className={`text-lg font-semibold ${isCompleted ? "text-[#2f7a47]" : ""}`}>{action.title}</h4>
                        <p className="mt-2 text-sm text-[#615c56]">{action.description}</p>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${priorityClasses[action.priority]}`}
                      >
                        {formatPriority(action.priority)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <SourceCue label={action.sourceLabel} url={action.sourceUrl} />
                        <button
                          type="button"
                          disabled={savingActionId === action.id}
                          onClick={() => {
                            void handleSetActionCompletion(action.id, !isCompleted);
                          }}
                          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            isCompleted
                              ? "border border-[#d5e6d8] bg-[#eaf5ec] text-[#2f7a47]"
                              : "border border-[#d9d1c8] bg-[#fbf8f4] text-[#1c1b19] hover:border-[#cfc5ba]"
                          }`}
                        >
                          {savingActionId === action.id
                            ? "Saving..."
                            : isCompleted
                              ? "Completed"
                              : "Mark complete"}
                        </button>
                      </div>

                      {action.externalLink ? (
                        <a
                          href={action.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-[#d9d1c8] bg-[#fbf8f4] px-3 py-1.5 text-sm font-medium text-[#1c1b19] transition hover:border-[#cfc5ba]"
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
        </aside>
      </div>

      <section className="mb-8">
  <div className="mb-4">
    <h3 className="text-2xl font-bold">Tools</h3>
    <p className="mt-1 text-sm text-[#6f6a64]">
      Add personal documents and expand what MapleMind can help you understand.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    <Link
      href="/documents"
      className="group rounded-2xl border border-[#ebe4dc] bg-white p-5 shadow-[0_8px_20px_rgba(35,31,26,0.05)] transition hover:-translate-y-[1px] hover:border-[#ddd4cb]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">New</p>
          <h4 className="mt-2 text-xl font-semibold text-[#1c1b19]">Documents</h4>
          <p className="mt-2 text-sm text-[#615c56]">
            Upload files like tax forms, letters, notes, and documents so MapleMind can answer
            questions using your own materials.
          </p>
        </div>

        <div className="rounded-2xl bg-[#fff2ef] p-3 text-[#b14634]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M14 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V7L14 3Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 3V7H18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#e4ddd5] bg-[#faf7f3] px-2.5 py-1 text-[11px] font-medium text-[#5e5852]">
            PDF
          </span>
          <span className="rounded-full border border-[#e4ddd5] bg-[#faf7f3] px-2.5 py-1 text-[11px] font-medium text-[#5e5852]">
            DOCX
          </span>
          <span className="rounded-full border border-[#e4ddd5] bg-[#faf7f3] px-2.5 py-1 text-[11px] font-medium text-[#5e5852]">
            TXT
          </span>
        </div>

        <span className="text-sm font-medium text-[#1c1b19] transition group-hover:text-[#f04d2d]">
          Open →
        </span>
      </div>
    </Link>
  </div>
</section>

<section>
  <div className="mb-4">
    <h3 className="text-2xl font-bold">Personalized insights</h3>
    <p className="mt-1 text-sm text-[#6f6a64]">Short guidance based on your current profile and action readiness.</p>
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    {insightCards.map((card, index) => (
      <article
        key={`${card.title}-${index}`}
        className="rounded-2xl border border-[#ebe4dc] bg-white p-5 shadow-[0_8px_20px_rgba(35,31,26,0.05)]"
      >
        <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">{card.title}</p>
        <p className="mt-3 text-lg">{card.body}</p>
      </article>
    ))}
  </div>
</section>
    </AppShell>
  );
}
