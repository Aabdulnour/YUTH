"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import {
  ONBOARDING_AGE_MAX,
  ONBOARDING_AGE_MIN,
  ONBOARDING_OPTION_GROUPS,
  PROVINCE_OPTIONS,
  buildProfileFromOnboarding,
  validateOnboardingAgeInput,
} from "@/lib/onboarding";
import {
  loadPersistedUserProfile,
  savePersistedUserProfile,
} from "@/lib/persistence/profile-store";
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

  const ageInputRef = useRef<HTMLInputElement | null>(null);
  const provinceSelectRef = useRef<HTMLSelectElement | null>(null);

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
      if (isCancelled) return;

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

  const profileSignalCount = useMemo(() => selectedFlags.length, [selectedFlags]);

  const totalSignalCount = useMemo(() => {
    return ONBOARDING_OPTION_GROUPS.reduce(
      (count, group) => count + group.options.length,
      0
    );
  }, []);

  const completedBasicsCount =
    (ageInput.trim() ? 1 : 0) + (province.trim() ? 1 : 0);

  const progressPercent = useMemo(() => {
    const total = totalSignalCount + 2;
    const filled = profileSignalCount + completedBasicsCount;
    return Math.round((filled / total) * 100);
  }, [completedBasicsCount, profileSignalCount, totalSignalCount]);

  const toggleOption = (flag: UserProfileFlagKey) => {
    setSelectedFlags((currentFlags) =>
      currentFlags.includes(flag)
        ? currentFlags.filter((currentFlag) => currentFlag !== flag)
        : [...currentFlags, flag]
    );
  };

  const scrollToField = (
    field: "age" | "province",
    behavior: ScrollBehavior = "smooth"
  ) => {
    const target =
      field === "age" ? ageInputRef.current : provinceSelectRef.current;

    if (!target) return;

    target.scrollIntoView({
      behavior,
      block: "center",
    });

    window.setTimeout(() => {
      target.focus();
    }, 180);
  };

  const handleContinue = async () => {
    if (!userId || isSaving) return;

    const trimmedAge = ageInput.trim();
    const trimmedProvince = province.trim();

    const nextErrors: FieldErrors = {};
    let firstInvalidField: "age" | "province" | null = null;

    if (!trimmedAge) {
  nextErrors.age = "Required.";
  firstInvalidField = "age";
} else {
  const validatedAge = validateOnboardingAgeInput(trimmedAge);

  if (validatedAge.error) {
    nextErrors.age = validatedAge.error;
    firstInvalidField = "age";
  }
}

if (!trimmedProvince) {
  nextErrors.province = "Required.";

  if (!firstInvalidField) {
    firstInvalidField = "province";
  }
}

    setFieldErrors(nextErrors);
    setSaveError(null);

    if (firstInvalidField) {
      scrollToField(firstInvalidField);
      return;
    }

    const validatedAge = validateOnboardingAgeInput(trimmedAge);

    if (validatedAge.age === undefined) {
      scrollToField("age");
      return;
    }

    setIsSaving(true);

    try {
      const profile = buildProfileFromOnboarding({
        selectedFlags,
        ageInput: String(validatedAge.age),
        province: trimmedProvince,
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
      <main
        className="min-h-screen bg-[#faf8f6] px-6 py-12 text-[#151311]"
        style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}
      >
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#e2dbd4] bg-white p-10 text-[#5f5953]">
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
      className="min-h-screen bg-[#faf8f6] px-6 py-12 text-[#151311]"
      style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif" }}
    >
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#151311]">
            YUTH
          </p>
          <p className="rounded-full bg-[#fff1f2] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#c82233]">
            Profile setup
          </p>
        </header>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-[#9a7b72]">
            <span>{progressPercent}% complete</span>
            <span>
              {profileSignalCount + completedBasicsCount} / {totalSignalCount + 2} fields
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ebe4dd]">
            <div
              className="h-1.5 rounded-full bg-[#c82233] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-[#e2dbd4] bg-white p-8 shadow-[0_12px_36px_rgba(20,15,12,0.06)] sm:p-10 lg:p-12">
          <h1 className="text-3xl font-bold leading-tight text-[#151311] sm:text-4xl">
            Set up your YUTH profile
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#5f5953]">
            This takes about two minutes. Your answers personalize recommendations,
            action priorities, and AI guidance.
          </p>

          <div className="mt-10">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c82233] text-xs font-bold text-white">
                    A
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">
                      Section A
                    </p>
                    <h2 className="text-xl font-bold text-[#151311]">Basics</h2>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#322d28]">Age</span>
                      {fieldErrors.age === "Required." ? (
                        <span className="text-xs font-semibold text-[#c82233]">
                          *Required
                        </span>
                      ) : null}
                    </div>

                    <input
                      ref={ageInputRef}
                      type="text"
                      inputMode="numeric"
                      value={ageInput}
                      onChange={(event) => {
                        const nextAge = event.target.value.replace(/\D/g, "").slice(0, 3);
                        setAgeInput(nextAge);

                        if (fieldErrors.age) {
                          setFieldErrors((current) => ({
                            ...current,
                            age: undefined,
                          }));
                        }
                      }}
                      placeholder="24"
                      aria-describedby="age-hint age-error"
                      aria-invalid={!!fieldErrors.age}
                      className={`mt-2 w-full rounded-xl border bg-white px-4 py-3.5 text-base outline-none transition focus:ring-2 ${
                        fieldErrors.age
                          ? "border-[#c82233] focus:border-[#c82233] focus:ring-[#c82233]/20"
                          : "border-[#d8d1c9] focus:border-[#c82233] focus:ring-[#c82233]/20"
                      }`}
                    />

                    <p id="age-hint" className="mt-2 text-xs leading-relaxed text-[#9a7b72]">
                      Enter a number between {ONBOARDING_AGE_MIN} and{" "}
                      {ONBOARDING_AGE_MAX}.
                    </p>

                  
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#322d28]">
                        Province or territory
                      </span>
                      {fieldErrors.province === "Required." ? (
                        <span className="text-xs font-semibold text-[#c82233]">
                          *Required
                        </span>
                      ) : null}
                    </div>

                    <div className="relative mt-2">
                      <select
                        ref={provinceSelectRef}
                        value={province}
                        onChange={(event) => {
                          setProvince(event.target.value);

                          if (fieldErrors.province) {
                            setFieldErrors((current) => ({
                              ...current,
                              province: undefined,
                            }));
                          }
                        }}
                        aria-describedby="province-hint province-error"
                        aria-invalid={!!fieldErrors.province}
                        className={`w-full appearance-none rounded-xl border bg-white px-4 py-3.5 pr-10 text-base outline-none transition focus:ring-2 ${
                          fieldErrors.province
                            ? "border-[#c82233] focus:border-[#c82233] focus:ring-[#c82233]/20"
                            : "border-[#d8d1c9] focus:border-[#c82233] focus:ring-[#c82233]/20"
                        }`}
                      >
                        <option value="">Select province or territory</option>
                        {PROVINCE_OPTIONS.map((provinceOption) => (
                          <option key={provinceOption} value={provinceOption}>
                            {provinceOption}
                          </option>
                        ))}
                      </select>

                      <svg
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a6e68]"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <p
  id="province-hint"
  className="mt-2 text-xs leading-relaxed text-[#9a7b72]"
>
  Used for province-specific programs and tax credits.
</p>

                    
                  </label>
                </div>
              </section>

              {ONBOARDING_OPTION_GROUPS.map((group, index) => {
                const meta = SECTION_META[index + 1];

                return (
                  <section
                    key={group.id}
                    className="rounded-2xl border border-[#e2dbd4] bg-[#faf8f6] p-6 sm:p-7"
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c82233] text-xs font-bold text-white">
                        {meta.letter}
                      </span>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7b72]">
                          Section {meta.letter}
                        </p>
                        <h2 className="text-xl font-bold text-[#151311]">
                          {group.title}
                        </h2>
                      </div>
                    </div>

                    <p className="mb-5 text-sm leading-relaxed text-[#5f5953]">
                      {group.description}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.options.map((option) => {
                        const active = selectedFlags.includes(option.key);

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => toggleOption(option.key)}
                            aria-pressed={active}
                            className={`group relative rounded-2xl border px-5 py-4 text-left transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
                              active
                                ? "border-[#d92d3f] bg-[#fff7f8] shadow-[0_8px_20px_rgba(200,34,51,0.08)]"
                                : "border-[#e2dbd4] bg-white hover:border-[#d6cec6] hover:bg-[#fdfcfa] hover:shadow-[0_6px_16px_rgba(20,15,12,0.04)]"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <span
                                aria-hidden="true"
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                  active
                                    ? "border-[#c82233] bg-[#c82233] text-white"
                                    : "border-[#d8d1c9] bg-white"
                                }`}
                              >
                                {active ? (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path
                                      d="M2.5 6L5 8.5L9.5 3.5"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : null}
                              </span>

                              <div className="min-w-0">
                                <p className="text-[15px] font-semibold leading-snug text-[#151311]">
                                  {option.label}
                                </p>
                                <p className="mt-1.5 text-sm leading-relaxed text-[#5f5953]">
                                  {option.helperText}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              <div className="space-y-4 border-t border-[#eee7e0] pt-7">
                {saveError ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-[#f3c9cf] bg-[#fff5f6] px-5 py-4"
                  >
                    <p className="text-sm font-medium text-[#b42334]">{saveError}</p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => void handleContinue()}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-xl bg-[#c82233] px-8 py-4 text-center text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#b01e2d] hover:shadow-[0_4px_15px_rgba(200,34,51,0.26)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c82233] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                  >
                    {isSaving ? "Saving…" : "Continue"}
                  </button>

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl border border-[#e2dbd4] bg-white px-8 py-4 text-center text-base font-medium text-[#151311] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:border-[#d0c9c1] hover:bg-[#faf8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151311]"
                  >
                    Back
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}