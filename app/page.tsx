"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f2618] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-6 inline-flex w-fit items-center rounded-full border border-[#ff7a59]/30 bg-[#ff7a59]/10 px-4 py-2 text-sm text-[#ff9a82]">
          🍁 Made for Canadians 18 to 30
        </div>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
          Your AI guide to <span className="text-[#ff6b4a]">adulting</span> in Canada.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl">
          Discover benefits, savings, and financial next steps tailored to your life situation.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/onboarding" className="rounded-2xl bg-[#f04d2d] px-8 py-4 text-center text-lg font-semibold text-white transition hover:opacity-90">
            Get started
          </Link>
          <Link href="/dashboard" className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-center text-lg font-medium text-white/80 transition hover:bg-white/10">
            View demo dashboard
          </Link>
        </div>

        <div className="mt-16 grid max-w-3xl grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          <div>
            <p className="text-3xl font-bold">$2K+</p>
            <p className="mt-2 text-sm text-white/60">Potential value users may be missing</p>
          </div>
          <div>
            <p className="text-3xl font-bold">3 min</p>
            <p className="mt-2 text-sm text-white/60">To personalize your results</p>
          </div>
          <div>
            <p className="text-3xl font-bold">AI</p>
            <p className="mt-2 text-sm text-white/60">Guidance based on your situation</p>
          </div>
        </div>
      </section>
    </main>
  );
}