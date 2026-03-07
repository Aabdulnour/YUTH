"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader, AppShell } from "@/components/layout/AppShell";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { PROVINCE_OPTIONS } from "@/lib/onboarding";
import { loadPersistedUserProfile, savePersistedUserProfile } from "@/lib/persistence/profile-store";
import { PROFILE_FIELD_LABELS, PROFILE_FLAG_KEYS, type UserProfile } from "@/types/profile";

function fieldValueClass(value: boolean): string {
  return value ? "border-[#d7eadc] bg-[#eef6ef] text-[#2f7a47]" : "border-[#e8e1d9] bg-[#f7f3ee] text-[#7a746e]";
}

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
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">Loading profile...</div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  if (!profile) {
    return (
      <AppShell activePath="/profile">
        <div className="rounded-3xl border border-[#e8e1d9] bg-white p-8 shadow-sm">
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
        description="Update the profile information MapleMind uses for recommendations and AI guidance."
        actions={
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving}
            className="rounded-2xl bg-[#f04d2d] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-[#e9e2da] bg-white p-7 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
          <h2 className="text-2xl font-bold">Profile data</h2>
          <p className="mt-2 text-sm text-[#6f6a64]">Core details used for recommendation matching.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-[#eee7df] bg-[#faf7f3] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">{PROFILE_FIELD_LABELS.age}</p>
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
                className="mt-2 w-full rounded-xl border border-[#ddd6cf] bg-white px-3 py-2 outline-none focus:border-[#f04d2d]"
              />
            </label>

            <label className="rounded-2xl border border-[#eee7df] bg-[#faf7f3] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a8580]">{PROFILE_FIELD_LABELS.province}</p>
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
                className="mt-2 w-full rounded-xl border border-[#ddd6cf] bg-white px-3 py-2 outline-none focus:border-[#f04d2d]"
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

          <h3 className="mt-8 text-xl font-semibold">Life signals</h3>
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
                  className={`rounded-2xl border p-4 text-left transition ${fieldValueClass(value)}`}
                >
                  <p className="text-sm">{PROFILE_FIELD_LABELS[key]}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em]">{value ? "Yes" : "No"}</p>
                </button>
              );
            })}
          </div>

          {saveError ? (
            <p className="mt-5 rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-3 py-2 text-sm text-[#b14634]">{saveError}</p>
          ) : null}

          {saveMessage ? (
            <p className="mt-5 rounded-xl border border-[#d9e6db] bg-[#f2f8f3] px-3 py-2 text-sm text-[#2f7a47]">{saveMessage}</p>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#e9e2da] bg-white p-6 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a8580]">Profile completeness</p>
            <p className="mt-2 text-4xl font-bold">{completion}%</p>
            <div className="mt-4 h-2 rounded-full bg-[#efe9e2]">
              <div className="h-2 rounded-full bg-[#163320]" style={{ width: `${completion}%` }} aria-hidden />
            </div>
            <p className="mt-3 text-sm text-[#6f6a64]">
              Keep this updated to improve recommendation quality and AI guidance relevance.
            </p>
          </div>

          <div className="rounded-3xl border border-[#e9e2da] bg-white p-6 shadow-[0_12px_30px_rgba(35,31,26,0.06)]">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a8580]">Persistence status</p>
            <p className="mt-3 text-sm text-[#6f6a64]">
              Profile changes save to your account and stay available across sessions.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
