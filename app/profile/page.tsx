"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { PROVINCE_OPTIONS } from "@/lib/onboarding";
import { loadPersistedUserProfile, savePersistedUserProfile } from "@/lib/persistence/profile-store";
import { PROFILE_FIELD_LABELS, PROFILE_FLAG_KEYS, type UserProfile } from "@/types/profile";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [draftProfile, setDraftProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        setDraftProfile(nextProfile);
      }
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

  const completion = useMemo(() => {
    if (!draftProfile) {
      return 0;
    }

    const completedFlags = PROFILE_FLAG_KEYS.filter((key) => draftProfile[key]).length;
    const completedOptional = Number(draftProfile.age !== undefined) + Number(Boolean(draftProfile.province));
    const totalFields = PROFILE_FLAG_KEYS.length + 2;
    return Math.round(((completedFlags + completedOptional) / totalFields) * 100);
  }, [draftProfile]);

  const handleSave = async () => {
    if (!userId || !draftProfile || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const saved = await savePersistedUserProfile(userId, draftProfile);
      setProfile(saved);
      setDraftProfile(saved);
      setSaveMessage("Profile saved.");
    } catch (error) {
      console.error("Failed to save profile", error);
      setSaveError("Could not save your profile right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || profile === undefined || (profile !== null && draftProfile === null)) {
    return (
      <AppShell activePath="/profile">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">Loading profile...</div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  if (!profile) {
    return (
      <AppShell activePath="/profile">
        <div className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-8 text-[#5f5953]">
          Redirecting to onboarding...
        </div>
      </AppShell>
    );
  }

  const editableProfile = draftProfile ?? profile;

  return (
    <AppShell activePath="/profile">
      <AppPageHeader
        eyebrow="Settings"
        title="Profile and preferences"
        description="Update the profile information YUTH uses for recommendations and AI guidance."
        actions={
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving}
            className="rounded-xl bg-[#c82233] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(200,34,51,0.2)] transition hover:bg-[#b01e2d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* ── Main profile content ── */}
        <div className="space-y-5">
          {/* Core fields */}
          <section className="rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-white p-6 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
            <h2 className="text-lg font-bold text-[#151311]">Core details</h2>
            <p className="mt-0.5 text-sm text-[#5f5953]">Used for recommendation matching.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block rounded-xl border border-[#e2dbd4] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">{PROFILE_FIELD_LABELS.age}</p>
                <input
                  value={editableProfile.age !== undefined ? String(editableProfile.age) : ""}
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    setDraftProfile((current) =>
                      current
                        ? {
                            ...current,
                            age: value ? value : undefined,
                          }
                        : current
                    );
                  }}
                  placeholder="24 or 18-24"
                  className="mt-2 w-full rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-2 text-sm outline-none transition focus:border-[#c82233] focus:ring-1 focus:ring-[#c82233]/20"
                />
              </label>

              <label className="block rounded-xl border border-[#e2dbd4] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7b72]">{PROFILE_FIELD_LABELS.province}</p>
                <select
                  value={editableProfile.province ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraftProfile((current) =>
                      current
                        ? {
                            ...current,
                            province: value || undefined,
                          }
                        : current
                    );
                  }}
                  className="mt-2 w-full rounded-lg border border-[#e2dbd4] bg-[#faf8f6] px-3 py-2 text-sm outline-none transition focus:border-[#c82233] focus:ring-1 focus:ring-[#c82233]/20"
                >
                  <option value="">Select province or territory</option>
                  {PROVINCE_OPTIONS.map((provinceOption) => (
                    <option key={provinceOption} value={provinceOption}>
                      {provinceOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Life signals */}
          <section className="rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-white p-6 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
            <h2 className="text-lg font-bold text-[#151311]">Life signals</h2>
            <p className="mt-0.5 text-sm text-[#5f5953]">Toggle signals that apply to your current situation.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PROFILE_FLAG_KEYS.map((key) => {
                const value = editableProfile[key];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDraftProfile((current) =>
                        current
                          ? {
                              ...current,
                              [key]: !current[key],
                            }
                          : current
                      );
                    }}
                    className={`group flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                      value
                        ? "border-[#c82233] bg-[#fff1f2] shadow-[0_0_0_1px_rgba(200,34,51,0.1)]"
                        : "border-[#e2dbd4] bg-white hover:border-[#d0c9c1]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        value
                          ? "border-[#c82233] bg-[#c82233] text-white"
                          : "border-[#d8d1c9] bg-white"
                      }`}
                    >
                      {value ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#151311]">{PROFILE_FIELD_LABELS[key]}</p>
                      <p className="text-xs text-[#9a7b72]">{value ? "Active" : "Inactive"}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {saveError ? (
              <p className="mt-4 rounded-lg border border-[#f0cfd3] bg-[#fff1f2] px-3 py-2 text-sm text-[#c82233]">{saveError}</p>
            ) : null}

            {saveMessage ? (
              <p className="mt-4 rounded-lg border border-[#c8e2cd] bg-[#eef6ef] px-3 py-2 text-sm text-[#2f7a47]">{saveMessage}</p>
            ) : null}
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-white p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">Profile completeness</p>
            <p className="mt-2 text-4xl font-bold text-[#151311]">{completion}%</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e2dbd4]">
              <div
                className="h-1.5 rounded-full bg-[#c82233] transition-all duration-500"
                style={{ width: `${completion}%` }}
                aria-hidden
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#5f5953]">
              Keep this updated to improve recommendation quality and AI guidance relevance.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dbd4] bg-gradient-to-b from-[#faf8f6] to-white p-5 shadow-[0_4px_16px_rgba(20,15,12,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">Persistence</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5f5953]">
              Profile changes save to your account and stay available across sessions.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
