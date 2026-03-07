"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrivateRoute } from "@/lib/auth/usePrivateRoute";
import { ONBOARDING_OPTIONS, PROVINCE_OPTIONS, buildProfileFromOnboarding } from "@/lib/onboarding";
import { loadPersistedUserProfile, savePersistedUserProfile } from "@/lib/persistence/profile-store";
import { PROFILE_FLAG_KEYS, type UserProfileFlagKey } from "@/types/profile";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId } = usePrivateRoute();

  const [selectedFlags, setSelectedFlags] = useState<UserProfileFlagKey[]>([]);
  const [ageInput, setAgeInput] = useState("");
  const [province, setProvince] = useState("");
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
        setAgeInput(profile.age !== undefined ? String(profile.age) : "");
        setProvince(profile.province ?? "");
      }

      setIsInitializing(false);
    };

    void hydrateFromSavedProfile();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isLoading, userId]);

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

    setIsSaving(true);
    setSaveError(null);

    try {
      const profile = buildProfileFromOnboarding({
        selectedFlags,
        ageInput,
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
      <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#e6dfd8] bg-white p-8 shadow-sm">
          Loading your account...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !userId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a8580]">MapleMind</p>

        <h1 className="mt-4 text-4xl font-bold">Tell us about your situation</h1>
        <p className="mt-3 text-lg text-[#6f6a64]">Select everything that applies to you right now.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="rounded-2xl border border-[#e6dfd8] bg-white p-5">
            <span className="block text-sm font-semibold uppercase tracking-[0.08em] text-[#8a8580]">Age (optional)</span>
            <input
              value={ageInput}
              onChange={(event) => setAgeInput(event.target.value)}
              placeholder="24 or 18-24"
              className="mt-3 w-full rounded-xl border border-[#ddd6cf] bg-[#faf7f3] px-4 py-3 outline-none focus:border-[#f04d2d]"
            />
          </label>

          <label className="rounded-2xl border border-[#e6dfd8] bg-white p-5">
            <span className="block text-sm font-semibold uppercase tracking-[0.08em] text-[#8a8580]">
              Province (optional)
            </span>
            <select
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              className="mt-3 w-full rounded-xl border border-[#ddd6cf] bg-[#faf7f3] px-4 py-3 outline-none focus:border-[#f04d2d]"
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

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ONBOARDING_OPTIONS.map((option) => {
            const active = selectedFlags.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleOption(option.key)}
                className={`rounded-2xl border p-5 text-left text-lg font-semibold transition ${
                  active
                    ? "border-[#f04d2d] bg-[#fff0eb] text-[#1c1b19]"
                    : "border-[#e6dfd8] bg-white hover:border-[#d6cec6]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {saveError ? (
          <p className="mt-6 rounded-xl border border-[#f2d4cd] bg-[#fff2ef] px-4 py-3 text-sm text-[#b14634]">{saveError}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              void handleContinue();
            }}
            disabled={isSaving}
            className="rounded-2xl bg-[#f04d2d] px-8 py-4 text-center text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Continue to dashboard"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-[#d8d1c8] bg-white px-8 py-4 text-center text-lg font-medium text-[#1c1b19]"
          >
            Back
          </Link>
        </div>
      </div>
    </main>
  );
}
