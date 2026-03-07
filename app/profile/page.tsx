"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadUserProfile } from "@/lib/profile-storage";
import { PROFILE_FLAG_KEYS, PROFILE_FIELD_LABELS, type UserProfile } from "@/types/profile";

function formatBooleanValue(value: boolean): string {
  return value ? "Yes" : "No";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProfile(loadUserProfile());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (profile === undefined) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          Loading profile...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Profile</p>
          <h1 className="mt-2 text-4xl font-bold">No profile found</h1>
          <p className="mt-4 text-lg text-[#6f6a64]">
            Complete onboarding to save your situation and unlock personalized recommendations.
          </p>
          <div className="mt-8">
            <Link
              href="/onboarding"
              className="rounded-2xl bg-[#f04d2d] px-8 py-4 text-center text-lg font-semibold text-white"
            >
              Go to onboarding
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Profile</p>
        <h1 className="mt-2 text-4xl font-bold">Your situation</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#faf7f3] p-4">
            {PROFILE_FIELD_LABELS.age}: {profile.age ?? "Not provided"}
          </div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">
            {PROFILE_FIELD_LABELS.province}: {profile.province ?? "Not provided"}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PROFILE_FLAG_KEYS.map((key) => (
            <div key={key} className="rounded-2xl bg-[#faf7f3] p-4">
              {PROFILE_FIELD_LABELS[key]}: {formatBooleanValue(profile[key])}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
