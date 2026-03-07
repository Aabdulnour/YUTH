"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { loadUserProfile } from "@/lib/profile-storage";
import { PROFILE_FIELD_LABELS, PROFILE_FLAG_KEYS, type UserProfile } from "@/types/profile";

function formatBooleanValue(value: boolean): string {
  return value ? "Yes" : "No";
}

function fieldValueClass(value: boolean): string {
  return value ? "bg-[#eef6ef] text-[#2f7a47]" : "bg-[#f1ece6] text-[#7a746e]";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProfile(loadUserProfile());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const completion = useMemo(() => {
    if (!profile) {
      return 0;
    }

    const completedFlags = PROFILE_FLAG_KEYS.filter((key) => profile[key]).length;
    const completedOptional = Number(profile.age !== undefined) + Number(Boolean(profile.province));
    const totalFields = PROFILE_FLAG_KEYS.length + 2;
    return Math.round(((completedFlags + completedOptional) / totalFields) * 100);
  }, [profile]);

  if (profile === undefined) {
    return (
      <AppShell activePath="/profile">
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">Loading profile...</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell activePath="/profile">
        <AppPageHeader
          eyebrow="Settings"
          title="No profile found"
          description="Create your profile data to unlock personalized recommendations."
        />
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">
          <Link
            href="/onboarding"
            className="rounded-2xl border border-[#d8d1c8] bg-[#fbf8f4] px-6 py-3 font-medium text-[#1c1b19]"
          >
            Update profile
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/profile">
      <AppPageHeader
        eyebrow="Settings"
        title="Profile and preferences"
        description="Manage the profile information MapleMind uses to personalize recommendations and AI guidance."
        actions={
          <>
            <Link
              href="/onboarding"
              className="rounded-2xl border border-[#d8d1c8] bg-[#fbf8f4] px-5 py-3 font-medium text-[#1c1b19]"
            >
              Edit information
            </Link>
            <Link
              href="/onboarding"
              className="rounded-2xl border border-[#d8d1c8] bg-white px-5 py-3 font-medium text-[#1c1b19]"
            >
              Update profile
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-[#e9e2da] bg-white p-7 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
          <h2 className="text-2xl font-bold">Profile data</h2>
          <p className="mt-2 text-sm text-[#6f6a64]">Core details currently stored for recommendation matching.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#eee7df] bg-[#faf7f3] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">{PROFILE_FIELD_LABELS.age}</p>
              <p className="mt-2 text-lg font-semibold">{profile.age ?? "Not provided"}</p>
            </div>
            <div className="rounded-2xl border border-[#eee7df] bg-[#faf7f3] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">{PROFILE_FIELD_LABELS.province}</p>
              <p className="mt-2 text-lg font-semibold">{profile.province ?? "Not provided"}</p>
            </div>
          </div>

          <h3 className="mt-8 text-xl font-semibold">Life signals</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PROFILE_FLAG_KEYS.map((key) => (
              <div key={key} className="rounded-2xl border border-[#eee7df] bg-white p-4">
                <p className="text-sm text-[#6f6a64]">{PROFILE_FIELD_LABELS[key]}</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${fieldValueClass(
                    profile[key]
                  )}`}
                >
                  {formatBooleanValue(profile[key])}
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#e9e2da] bg-white p-6 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a8580]">Profile completeness</p>
            <p className="mt-2 text-4xl font-bold">{completion}%</p>
            <div className="mt-4 h-2 rounded-full bg-[#efe9e2]">
              <div
                className="h-2 rounded-full bg-[#163320]"
                style={{ width: `${completion}%` }}
                aria-hidden
              />
            </div>
            <p className="mt-3 text-sm text-[#6f6a64]">
              Keep this updated to improve recommendation quality and AI guidance relevance.
            </p>
          </div>

          <div className="rounded-3xl border border-[#e9e2da] bg-white p-6 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a8580]">Storage status</p>
            <p className="mt-3 text-sm text-[#6f6a64]">
              Your current Sprint setup stores profile data in local browser storage. This page is structured for future account persistence.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
