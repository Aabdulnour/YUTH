"use client";

import { useState } from "react";
import Link from "next/link";

const options = [
  "I have a job",
  "I'm a student",
  "I pay rent",
  "I have a car",
  "I have debt",
  "I live with parents",
  "I file taxes",
  "I don't have employer benefits",
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a8580]">
          MapleMind
        </p>

        <h1 className="mt-4 text-4xl font-bold">Tell us about your situation</h1>
        <p className="mt-3 text-lg text-[#6f6a64]">
          Select everything that applies to you right now.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`rounded-2xl border p-5 text-left text-lg font-semibold transition ${
                  active
                    ? "border-[#f04d2d] bg-[#fff0eb] text-[#1c1b19]"
                    : "border-[#e6dfd8] bg-white hover:border-[#d6cec6]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-[#f04d2d] px-8 py-4 text-center text-lg font-semibold text-white"
          >
            Continue to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-[#d8d1c8] bg-white px-8 py-4 text-center text-lg font-medium text-[#1c1b19]"
          >
            Back
          </Link>
        </div>
      </div>
    </main>
  );
}