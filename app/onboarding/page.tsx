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

const SECTION_LETTERS = ["B", "C", "D"] as const;

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
      <main className="min-h-screen bg-white px-6 py-10 text-[#171412]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#e6e1da] bg-[#faf8f6] p-8">
          Loading your account...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-[#171412]" style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#151311]">MapleMind</p>
          <p className="rounded-full border border-[#dcd6cf] bg-[#f7f5f3] px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6962]">
            Profile setup
          </p>
        </header>

        <section className="mt-8 rounded-[30px] border border-[#e6e1da] bg-white p-7 shadow-[0_16px_48px_rgba(22,19,17,0.07)] sm:p-8 lg:p-10">
          <h1 className="text-4xl font-semibold leading-tight text-[#171412] sm:text-5xl">Set up your MapleMind profile</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#5f5953]">
            This takes about two minutes. Your answers personalize recommendations, action priorities, and AI guidance.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.65fr_0.95fr]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-[#ebe5de] bg-[#fcfaf8] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a837d]">Section A</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#171412]">Basics</h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                      className="mt-2 w-full rounded-xl border border-[#d8d1c9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#c82233]"
                    />
                    <p className="mt-2 text-xs text-[#7a726b]">Required. Enter a number between {ONBOARDING_AGE_MIN} and {ONBOARDING_AGE_MAX}.</p>
                    {fieldErrors.age ? <p className="mt-2 text-sm text-[#b42330]">{fieldErrors.age}</p> : null}
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
                      className="mt-2 w-full rounded-xl border border-[#d8d1c9] bg-white px-4 py-3 text-base outline-none transition focus:border-[#c82233]"
                    >
                      <option value="">Select province or territory</option>
                      {PROVINCE_OPTIONS.map((provinceOption) => (
                        <option key={provinceOption} value={provinceOption}>
                          {provinceOption}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[#7a726b]">Required for province-specific programs and tax credits.</p>
                    {fieldErrors.province ? <p className="mt-2 text-sm text-[#b42330]">{fieldErrors.province}</p> : null}
                  </label>
                </div>
              </section>

              {ONBOARDING_OPTION_GROUPS.map((group, index) => (
                <section key={group.id} className="rounded-2xl border border-[#ebe5de] bg-[#fcfaf8] p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a837d]">Section {SECTION_LETTERS[index]}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#171412]">{group.title}</h2>
                  <p className="mt-2 text-sm text-[#68625b]">{group.description}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {group.options.map((option) => {
                      const active = selectedFlags.includes(option.key);

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => toggleOption(option.key)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${active
                              ? "border-[#c82233] bg-[#fff1f2]"
                              : "border-[#ddd7d0] bg-white hover:border-[#cfc8c0]"
                            }`}
                        >
                          <p className="text-sm font-semibold text-[#171412]">{option.label}</p>
                          <p className="mt-1 text-sm text-[#6a645d]">{option.helperText}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}

              {saveError ? (
                <p className="rounded-xl border border-[#f0cfd3] bg-[#fff3f4] px-4 py-3 text-sm text-[#b42330]">{saveError}</p>
              ) : null}

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    void handleContinue();
                  }}
                  disabled={isSaving}
                  className="rounded-xl bg-[#c82233] px-8 py-3 text-center text-base font-semibold text-white transition hover:bg-[#af1d2d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Continue to dashboard"}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#d5cfc8] bg-white px-8 py-3 text-center text-base font-medium text-[#26221f]"
                >
                  Back
                </Link>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[#e7e1da] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#857f79]">Profile snapshot</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#6f6963]">Age</dt>
                    <dd className="font-semibold text-[#171412]">{ageInput || "Required"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#6f6963]">Province</dt>
                    <dd className="font-semibold text-[#171412]">{province || "Required"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#6f6963]">Signals selected</dt>
                    <dd className="font-semibold text-[#171412]">
                      {profileSignalCount}/{totalSignalCount}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[#e7e1da] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#857f79]">Trust and privacy</p>
                <p className="mt-3 text-sm text-[#5f5953]">
                  MapleMind uses this information to tailor guidance. You can update your profile any time in settings.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
