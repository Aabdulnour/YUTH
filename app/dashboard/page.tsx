"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadUserProfile } from "@/lib/profile-storage";
import { getRecommendations } from "@/lib/recommendation";
import type { ActionPriority } from "@/types/action";
import type { UserProfile } from "@/types/profile";

const priorityClasses: Record<ActionPriority, string> = {
  high: "bg-[#ffe8e3] text-[#b4422c]",
  medium: "bg-[#eef6ef] text-[#2f7a47]",
  low: "bg-[#edf3f9] text-[#345d81]",
};

function formatPriority(priority: ActionPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProfile(loadUserProfile());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const recommendations = useMemo(() => {
    if (!profile) {
      return null;
    }

    return getRecommendations(profile);
  }, [profile]);

  if (profile === undefined) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] text-[#1c1b19]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-8 text-lg shadow-sm">Loading your recommendations...</div>
        </div>
      </main>
    );
  }

  if (!profile || !recommendations) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] text-[#1c1b19]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">No profile yet</h1>
            <p className="mt-4 max-w-2xl text-lg text-[#6f6a64]">
              Complete onboarding so MapleMind can generate benefits, actions, and savings opportunities
              based on your situation.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                className="rounded-2xl bg-[#f04d2d] px-8 py-4 text-center text-lg font-semibold text-white"
              >
                Go to onboarding
              </Link>
              <Link
                href="/"
                className="rounded-2xl border border-[#d8d1c8] bg-white px-8 py-4 text-center text-lg font-medium text-[#1c1b19]"
              >
                Back home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#1c1b19]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">Your personalized plan</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="rounded-2xl border border-[#d8d1c8] bg-white px-5 py-3 font-medium text-[#1c1b19]"
            >
              View profile
            </Link>
            <Link href="/ask-ai" className="rounded-2xl bg-[#163320] px-6 py-3 font-semibold text-white">
              Ask AI
            </Link>
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-[#163320] p-8 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">Money you may be missing</p>
          <h2 className="mt-3 text-5xl font-bold">{recommendations.estimatedValueRange.label}</h2>
          <p className="mt-3 text-lg text-white/70">
            Based on {recommendations.matchedBenefits.length} matched programs tied to your current profile.
          </p>
        </div>

        <div className="mb-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section>
            <h3 className="mb-4 text-2xl font-bold">Benefits for you</h3>
            {recommendations.matchedBenefits.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-[#6f6a64] shadow-sm">
                No benefits matched yet. Add more profile details in onboarding for better matching.
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.matchedBenefits.map((benefit) => (
                  <div key={benefit.id} className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-semibold">{benefit.name}</h4>
                        <p className="mt-2 text-[#6f6a64]">{benefit.description}</p>
                      </div>
                      <span className="rounded-xl bg-[#eef6ef] px-3 py-2 text-sm font-semibold text-[#2f7a47]">
                        {benefit.estimated_value.display}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside>
            <h3 className="mb-4 text-2xl font-bold">Actions this month</h3>
            {recommendations.matchedActions.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-[#6f6a64] shadow-sm">
                No immediate actions right now. Re-run onboarding whenever your situation changes.
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <ul className="space-y-4">
                  {recommendations.matchedActions.map((action) => (
                    <li key={action.id} className="rounded-xl border border-[#f0ebe5] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">{action.title}</p>
                          <p className="mt-1 text-sm text-[#6f6a64]">{action.description}</p>
                        </div>
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${
                            priorityClasses[action.priority]
                          }`}
                        >
                          {formatPriority(action.priority)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <section>
          <h3 className="mb-4 text-2xl font-bold">Insights</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.insights.map((insight) => (
              <div key={insight} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.12em] text-[#8a8580]">Insight</p>
                <p className="mt-3 text-lg">{insight}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
