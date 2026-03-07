"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import {
  ONBOARDING_AGE_MAX,
  ONBOARDING_AGE_MIN,
  ONBOARDING_OPTION_GROUPS,
  PROVINCE_OPTIONS,
  buildProfileFromOnboarding,
  validateOnboardingAgeInput,
} from "@/lib/onboarding";
import { loadPersistedUserProfile, savePersistedUserProfile } from "@/lib/persistence/profile-store";
import { PROFILE_FLAG_KEYS, type UserProfileFlagKey } from "@/types/profile";

const SECTION_META: { letter: string; label: string }[] = [
  { letter: "A", label: "Basics" },
  { letter: "B", label: "Life Situation" },
  { letter: "C", label: "Financial Signals" },
  { letter: "D", label: "Context Signals" },
];

interface FieldErrors {
  age?: string;
  province?: string;
}

function isNumericAge(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,3}$/.test(value.trim());
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [selectedFlags, setSelectedFlags] = useState<UserProfileFlagKey[]>([]);
  const [ageInput, setAgeInput] = useState("");
  const [province, setProvince] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (!isLoading) {
        setIsInitializing(false);
      }

      return;
    }

    let isCancelled = false;

    const hydrateFromSavedProfile = async () => {
      const profile = await loadPersistedUserProfile(userId);
      if (isCancelled) {
        return;
      }

      if (profile) {
        setSelectedFlags(PROFILE_FLAG_KEYS.filter((key) => profile[key]));

        if (typeof profile.age === "number" && Number.isFinite(profile.age)) {
          setAgeInput(String(Math.round(profile.age)));
        } else if (isNumericAge(profile.age)) {
          setAgeInput(profile.age.trim());
        }

        setProvince(profile.province ?? "");
      }

      setIsInitializing(false);
    };

    void hydrateFromSavedProfile();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

  const profileSignalCount = useMemo(() => {
    return selectedFlags.length;
  }, [selectedFlags]);

  const totalSignalCount = useMemo(() => {
    return ONBOARDING_OPTION_GROUPS.reduce((count, group) => count + group.options.length, 0);
  }, []);

  const progressPercent = useMemo(() => {
    // Basics (age + province) count as 2 signals worth
    const basicsComplete = (ageInput.trim() ? 1 : 0) + (province.trim() ? 1 : 0);
    const total = totalSignalCount + 2;
    const filled = profileSignalCount + basicsComplete;
    return Math.round((filled / total) * 100);
  }, [ageInput, province, profileSignalCount, totalSignalCount]);

  const toggleOption = (flag: UserProfileFlagKey) => {
    setSelectedFlags((currentFlags) =>
      currentFlags.includes(flag)
        ? currentFlags.filter((currentFlag) => currentFlag !== flag)
        : [...currentFlags, flag]
    );
  };

  const handleContinue = async () => {
    if (!userId || isSaving) {
      return;
    }

    const nextErrors: FieldErrors = {};
    const validatedAge = validateOnboardingAgeInput(ageInput);
    if (validatedAge.error) {
      nextErrors.age = validatedAge.error;
    }

    if (!province.trim()) {
      nextErrors.province = "Province or territory is required.";
    }

    setFieldErrors(nextErrors);
    setSaveError(null);

    if (Object.keys(nextErrors).length > 0 || validatedAge.age === undefined) {
      return;
    }

    setIsSaving(true);

    try {
      const profile = buildProfileFromOnboarding({
        selectedFlags,
        ageInput: String(validatedAge.age),
        province,
      });

      await savePersistedUserProfile(userId, profile);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save profile", error);
      setSaveError("Could not save your profile right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || (isAuthenticated && isInitializing)) {
    return (
      <main className="min-h-screen bg-[#faf8f6] px-6 py-10 text-[#151311]" style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}>
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#e2dbd4] bg-white p-8 text-[#5f5953]">
          Loading your account…
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  return (
    <main
      className="min-h-screen bg-[#faf8f6] px-6 py-10 text-[#151311]"
      style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}
    >
      <div className="mx-auto max-w-5xl">
        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#151311]">YUTH</p>
          <p className="rounded-full bg-[#fff1f2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#c82233]">
            Profile setup
          </p>
        </header>

        {/* ── Progress bar ── */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[#9a7b72]">
            <span>{progressPercent}% complete</span>
            <span>{profileSignalCount + (ageInput.trim() ? 1 : 0) + (province.trim() ? 1 : 0)}/{totalSignalCount + 2} fields</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#ebe4dd]">
            <div
              className="h-1 rounded-full bg-[#c82233] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Main card ── */}
        <section className="mt-6 rounded-2xl border border-[#e2dbd4] bg-white p-7 shadow-[0_12px_36px_rgba(20,15,12,0.06)] sm:p-8 lg:p-10">
          <h1 className="text-3xl font-bold leading-tight text-[#151311] sm:text-4xl">
            Set up your YUTH profile
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#5f5953]">
            This takes about two minutes. Your answers personalize recommendations, action priorities, and AI guidance.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.65fr_0.95fr]">
            <div className="space-y-6">
              {/* ── Section A: Basics ── */}
              <section className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c82233] text-xs font-bold text-white">
                    A
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">
                      Section A
                    </p>
                    <h2 className="text-xl font-bold text-[#151311]">Basics</h2>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[#322d28]">Age</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ageInput}
                      onChange={(event) => {
                        const nextAge = event.target.value.replace(/\D/g, "").slice(0, 3);
                        setAgeInput(nextAge);
                        if (fieldErrors.age) {
                          setFieldErrors((current) => ({ ...current, age: undefined }));
                        }
                      }}
                      placeholder="24"
                      className="mt-2 w-full rounded-xl border border-[#d8d1c9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#c82233] focus:ring-1 focus:ring-[#c82233]/20"
                    />
                    <p className="mt-2 text-xs text-[#9a7b72]">
                      Required. Enter a number between {ONBOARDING_AGE_MIN} and {ONBOARDING_AGE_MAX}.
                    </p>
                    {fieldErrors.age ? (
                      <p className="mt-2 text-sm font-medium text-[#c82233]">{fieldErrors.age}</p>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-[#322d28]">Province or territory</span>
                    <select
                      value={province}
                      onChange={(event) => {
                        setProvince(event.target.value);
                        if (fieldErrors.province) {
                          setFieldErrors((current) => ({ ...current, province: undefined }));
                        }
                      }}
                      className="mt-2 w-full rounded-xl border border-[#d8d1c9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#c82233] focus:ring-1 focus:ring-[#c82233]/20"
                    >
                      <option value="">Select province or territory</option>
                      {PROVINCE_OPTIONS.map((provinceOption) => (
                        <option key={provinceOption} value={provinceOption}>
                          {provinceOption}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[#9a7b72]">
                      Required for province-specific programs and tax credits.
                    </p>
                    {fieldErrors.province ? (
                      <p className="mt-2 text-sm font-medium text-[#c82233]">{fieldErrors.province}</p>
                    ) : null}
                  </label>
                </div>
              </section>

              {/* ── Sections B, C, D ── */}
              {ONBOARDING_OPTION_GROUPS.map((group, index) => {
                const meta = SECTION_META[index + 1];

                return (
                  <section key={group.id} className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c82233] text-xs font-bold text-white">
                        {meta.letter}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">
                          Section {meta.letter}
                        </p>
                        <h2 className="text-xl font-bold text-[#151311]">{group.title}</h2>
                      </div>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-[#5f5953]">{group.description}</p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.options.map((option) => {
                        const active = selectedFlags.includes(option.key);

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => toggleOption(option.key)}
                            className={`group relative rounded-xl border px-4 py-3.5 text-left transition ${
                              active
                                ? "border-[#c82233] bg-[#fff1f2] shadow-[0_0_0_1px_rgba(200,34,51,0.15)]"
                                : "border-[#e2dbd4] bg-white hover:border-[#d0c9c1] hover:shadow-[0_2px_8px_rgba(20,15,12,0.04)]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox indicator */}
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                  active
                                    ? "border-[#c82233] bg-[#c82233] text-white"
                                    : "border-[#d8d1c9] bg-white"
                                }`}
                              >
                                {active ? (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : null}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-[#151311]">{option.label}</p>
                                <p className="mt-0.5 text-sm leading-relaxed text-[#5f5953]">{option.helperText}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {/* ── Error / CTA ── */}
              {saveError ? (
                <p className="rounded-xl border border-[#f0cfd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#c82233]">
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    void handleContinue();
                  }}
                  disabled={isSaving}
                  className="rounded-xl bg-[#c82233] px-8 py-3 text-center text-base font-semibold text-white shadow-[0_0_20px_rgba(200,34,51,0.25)] transition hover:bg-[#b01e2d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving…" : "Continue to dashboard"}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#e2dbd4] bg-white px-8 py-3 text-center text-base font-medium text-[#151311] transition hover:border-[#d0c9c1]"
                >
                  Back
                </Link>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#e2dbd4] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">
                  Profile snapshot
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#5f5953]">Age</dt>
                    <dd className="font-semibold text-[#151311]">{ageInput || "Required"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#5f5953]">Province</dt>
                    <dd className="font-semibold text-[#151311]">{province || "Required"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#5f5953]">Signals selected</dt>
                    <dd className="font-semibold text-[#151311]">
                      {profileSignalCount}/{totalSignalCount}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[#e2dbd4] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">
                  Trust and privacy
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#5f5953]">
                  YUTH uses this information to tailor guidance. You can update your profile any time in settings.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
