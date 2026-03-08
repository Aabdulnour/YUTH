"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { loadPersistedUserProfile } from "@/lib/persistence/profile-store";
import { PROFILE_FIELD_LABELS, PROFILE_FLAG_KEYS, type UserProfile } from "@/types/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function formatProfileValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim() !== "") return value;
  return "—";
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) setProfile(null);
      return;
    }

    let isCancelled = false;

    const loadProfile = async () => {
      const p = await loadPersistedUserProfile(userId);
      if (!isCancelled) setProfile(p);
    };

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    if (isAuthenticated && profile === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, profile, router]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    const flags = PROFILE_FLAG_KEYS;
    const filled = flags.filter((k) => profile[k]).length + (profile.age !== undefined ? 1 : 0) + (profile.province ? 1 : 0);
    return Math.round((filled / (flags.length + 2)) * 100);
  }, [profile]);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/");
    } catch {
      setIsSigningOut(false);
    }
  };

  if (isLoading || profile === undefined) {
    return (
      <AppShell activePath="/profile">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">
          Loading profile...
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId || profile === null) {
    return null;
  }

  return (
    <AppShell activePath="/profile">
      <div className="mx-auto max-w-4xl">
        <AppPageHeader
          eyebrow="Profile"
          title="Your YUTH profile"
          description="Update the profile information YUTH uses for recommendations and AI guidance."
        />

        {/* ── Profile completeness (inline) ── */}
        {profileCompletion < 100 && (
          <div className="mb-5 rounded-xl border border-[#e2dbd4] bg-gradient-to-r from-[#faf8f6] to-white px-5 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#151311]">Profile {profileCompletion}% complete</p>
              <p className="text-xs text-[#5f5953]">More complete profiles get better recommendations.</p>
            </div>
            <Link
              href="/onboarding"
              className="shrink-0 rounded-lg border border-[#e2dbd4] bg-white px-3 py-1.5 text-xs font-medium text-[#151311] transition hover:border-[#d0c9c1]"
            >
              Update
            </Link>
          </div>
        )}

        {profileCompletion >= 100 && (
          <div className="mb-5 rounded-xl border border-[#c8e2cd] bg-[#f4faf4] px-5 py-3 flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2f7a47] text-xs text-white">✓</span>
            <p className="text-sm font-semibold text-[#2f7a47]">Profile complete — recommendations are fully personalized.</p>
          </div>
        )}

        {/* ── Core details ── */}
        <section className="mb-5 rounded-2xl border border-[#e2dbd4] bg-white p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
          <h3 className="mb-4 text-lg font-bold text-[#151311]">Core Details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#faf8f6] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">Age</p>
              <p className="mt-1 text-base font-semibold text-[#151311]">
                {profile.age !== undefined ? String(profile.age) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-[#faf8f6] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">Province</p>
              <p className="mt-1 text-base font-semibold text-[#151311]">
                {profile.province ?? "—"}
              </p>
            </div>
          </div>
        </section>

        {/* ── Life signals ── */}
        <section className="mb-5 rounded-2xl border border-[#e2dbd4] bg-white p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
          <h3 className="mb-4 text-lg font-bold text-[#151311]">Life Signals</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILE_FLAG_KEYS.map((key) => (
              <div
                key={key}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  profile[key]
                    ? "border border-[#c82233]/10 bg-[#fff1f2]"
                    : "border border-[#e2dbd4] bg-[#faf8f6]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                    profile[key]
                      ? "bg-[#c82233] text-white"
                      : "border border-[#d8d1c9] bg-white text-[#d8d1c9]"
                  }`}
                >
                  {profile[key] ? "✓" : ""}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#151311]">
                    {PROFILE_FIELD_LABELS[key] ?? key}
                  </p>
                  <p className="text-xs text-[#9a7b72]">
                    {formatProfileValue(profile[key])}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            className="rounded-xl bg-[#c82233] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b01e2d]"
          >
            Edit profile
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#e2dbd4] bg-white px-6 py-2.5 text-sm font-medium text-[#151311] transition hover:border-[#d0c9c1]"
          >
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isSigningOut}
            className="rounded-xl border border-[#e2dbd4] bg-white px-6 py-2.5 text-sm font-medium text-[#c82233] transition hover:border-[#d0c9c1] disabled:opacity-60"
          >
            {isSigningOut ? "Signing out..." : "Log out"}
          </button>
        </div>

        {/* ── Persistence note (subtle) ── */}
        <p className="mt-8 text-center text-xs text-[#b8b0a8]">
          Your profile is synced to Supabase and persisted across sessions.
        </p>
      </div>
    </AppShell>
  );
}
