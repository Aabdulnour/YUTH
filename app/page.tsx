"use client";

import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Build your profile",
    body: "Add your age, province, and a few details about your current setup. Most people finish in under two minutes.",
  },
  {
    number: "02",
    title: "Get your personalized plan",
    body: "YUTH surfaces the tax credits, benefits, and action steps that actually apply to you, not a generic checklist.",
  },
  {
    number: "03",
    title: "Stay on track",
    body: "Come back when life shifts. New job, new province, new priorities. YUTH keeps pace with you.",
  },
];

const CAPABILITIES = [
  {
    label: "Tax credits and deductions",
    detail: "GST/HST credit, tuition support, CWB, and provincial credits matched to your profile.",
  },
  {
    label: "Benefits and programs",
    detail: "OSAP, EI, rental assistance, and newcomer support surfaced before you miss the window.",
  },
  {
    label: "Financial clarity",
    detail: "Debt, savings, and benefits gaps prioritized so you know what matters this week.",
  },
];

const TRUST_PILLARS = [
  {
    eyebrow: "Grounded",
    title: "Curated Canadian program data",
    detail: "Federal and provincial programs are reviewed before they show up in your plan.",
  },
  {
    eyebrow: "Matched",
    title: "Recommendations tied to your profile",
    detail: "YUTH responds to your province, life stage, and financial context instead of handing you generic advice.",
  },
  {
    eyebrow: "Transparent",
    title: "Clear paths to official sources",
    detail: "Every action points back to the source so you can verify details and move with confidence.",
  },
];

const UNLOCK_ITEMS = [
  "Tax credits and deductions matched to your situation",
  "Province-specific benefits you are likely missing",
  "A prioritized action plan that updates as life changes",
  "AI guidance grounded in your profile and real Canadian programs",
];

function MapleLeafAccent({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex h-14 w-14 items-center justify-center rounded-full border border-[#ff7f8d]/20 bg-[#f13d52]/10 text-[#ff5d70] shadow-[0_0_34px_rgba(232,57,76,0.22)] backdrop-blur-sm ${className}`}
    >
      <svg viewBox="0 0 48 48" className="h-7 w-7 fill-current">
        <path d="M24 4.5l3.8 7.5 8.3-2.9-3.4 7.6h8.2l-6.4 5.5 5.2 6.5-8-1.3-.8 9.1-6.9-5.1-6.9 5.1-.8-9.1-8 1.3 5.2-6.5-6.4-5.5h8.2l-3.4-7.6 8.3 2.9L24 4.5z" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0c0a09] font-sans text-[#151311]">
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
        <header className="flex items-center justify-between py-5">
          <span className="text-sm font-bold tracking-[0.22em] text-white">YUTH</span>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth?mode=signup"
              className="rounded-lg border border-[#3a3530] px-4 py-2 text-sm font-semibold text-[#c8c0b8] transition hover:border-[#57504a] hover:text-white"
            >
              Sign up
            </Link>
            <Link
              href="/auth?mode=login"
              className="rounded-lg bg-[#c82233] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b01e2d]"
            >
              Log in
            </Link>
          </nav>
        </header>
      </div>

      <section className="relative overflow-hidden bg-[#0c0a09]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[620px] w-[620px] rounded-full bg-[#c82233] opacity-[0.1] blur-[140px]" />
          <div className="absolute right-[-120px] top-20 h-[360px] w-[360px] rounded-full bg-[#ff8953] opacity-[0.08] blur-[130px]" />
          <div className="absolute bottom-[-80px] left-[-40px] h-[320px] w-[320px] rounded-full bg-[#f5c36b] opacity-[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1200px] px-6 pb-24 pt-14 md:px-10 md:pt-20 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b98e87]">
                Your life. Organized. Over time.
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-[68px]">
                Built by YUTH,
                <br className="hidden sm:block" /> For youth.
                <br />
                Your next steps.
                <br />
                <span className="text-[#e8394c]">All in one place.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#b4aba2] md:text-xl">
                The life assistant for young Canadians navigating taxes, benefits, and financial adulthood.
                Personalized, updated, and built to make the next step feel{" "}
                <span className="font-semibold text-[#e8394c]">easy</span>.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth?mode=signup"
                  className="rounded-xl bg-[#c82233] px-7 py-3.5 text-center text-base font-bold text-white shadow-[0_0_28px_rgba(200,34,51,0.45)] transition hover:bg-[#af1d2d] hover:shadow-[0_0_36px_rgba(200,34,51,0.55)]"
                >
                  Get Started Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-xl border border-[#3a3530] px-7 py-3.5 text-center text-base font-semibold text-[#c8c0b8] transition hover:border-[#57504a] hover:text-white"
                >
                  See How It Works
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-[#2e2824] bg-[linear-gradient(180deg,#171310_0%,#110f0d_100%)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#6a222e] to-transparent" />
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#8f8178]">
                What you unlock
              </p>
              <ul className="mt-4 space-y-3.5">
                {UNLOCK_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#c2b8af]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c82233] text-[10px] font-bold text-white">
                      +
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[#432128] bg-[linear-gradient(180deg,#251517_0%,#1b1213_100%)] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b55a67]">
                  Quick setup
                </p>
                <p className="mt-1.5 text-2xl font-bold text-white">~ 2 minutes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#91827a]">
                  A few details about your life stage, province, and priorities, then YUTH does the matching.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f1ea_0%,#fbf7f2_100%)]"
        id="what-it-does"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-120px] top-14 h-[280px] w-[280px] rounded-full bg-[#ffcc78] opacity-[0.16] blur-[120px]" />
          <div className="absolute bottom-[-120px] right-[-40px] h-[320px] w-[320px] rounded-full bg-[#f36a79] opacity-[0.12] blur-[140px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">What YUTH does</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#0f0c0a] md:text-4xl">
                Adulting in a Dashboard
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5f5953] md:text-lg">
                Government credits, benefit programs, and financial priorities are spread across dozens of sites.
                YUTH reads your profile, surfaces what applies, and keeps your plan current as life changes.
              </p>
            </div>
            <div className="grid gap-4">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.label}
                  className="rounded-[22px] border border-[#e6ddd5] bg-white/85 px-6 py-5 shadow-[0_10px_30px_rgba(20,15,12,0.05)] backdrop-blur-sm transition hover:border-[#d9cdc3]"
                >
                  <p className="font-semibold text-[#151311]">{cap.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5f5953]">{cap.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fffdf9]" id="how-it-works">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-12 h-[240px] w-[240px] -translate-x-1/2 rounded-full bg-[#ffb86b] opacity-[0.08] blur-[90px]" />
          <div className="absolute bottom-[-80px] right-10 h-[220px] w-[220px] rounded-full bg-[#ef6677] opacity-[0.08] blur-[110px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">How it works</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-[#0f0c0a] md:text-4xl">
              Three steps. Real clarity.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#6a625b] md:text-md">
              A short setup, a matched plan, and one place to keep up with what matters next.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex min-h-[240px] flex-col items-center rounded-[24px] border border-[#ebe4dd] bg-[linear-gradient(180deg,#fffdfa_0%,#faf6f1_100%)] px-6 py-7 text-center shadow-[0_10px_28px_rgba(20,15,12,0.04)]"
              >
                <div className="mb-5 inline-flex items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c82233] text-xs font-black text-white shadow-[0_10px_22px_rgba(200,34,51,0.22)]">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#151311]">{step.title}</h3>
                <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-[#5f5953]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ece4_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-80px] top-16 h-[260px] w-[260px] rounded-full bg-[#f5c36b] opacity-[0.12] blur-[120px]" />
          <div className="absolute right-[-120px] bottom-0 h-[340px] w-[340px] rounded-full bg-[#eb6777] opacity-[0.1] blur-[140px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="rounded-[28px] bg-[linear-gradient(160deg,#0c0a09_0%,#1a1212_100%)] p-8 shadow-[0_18px_48px_rgba(0,0,0,0.2)] md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a7a72]">The problem</p>
              <blockquote className="mt-5 text-2xl font-bold leading-snug text-white md:text-3xl">
                Young Canadians do not miss out because they are lazy. They miss out because the system is{" "}
                <span className="text-[#e8394c]">fragmented</span>,{" "}
                <span className="text-[#e8394c]">confusing</span>, and{" "}
                <span className="text-[#e8394c]">never personalized</span>.
              </blockquote>
              <p className="mt-6 text-sm leading-relaxed text-[#8e8179]">
                Tax credits, benefit programs, and financial next steps are buried across dozens of government
                portals with different rules, deadlines, and application flows.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#151311]">Support is fragmented by design</h3>
                <p className="mt-2 text-base leading-relaxed text-[#5f5953]">
                  Programs live across federal, provincial, and municipal systems with no single discovery layer.
                  YUTH becomes that layer.
                </p>
              </div>
              <div className="h-px bg-[#e2dbd4]" />
              <div>
                <h3 className="text-xl font-bold text-[#151311]">Every situation is different</h3>
                <p className="mt-2 text-base leading-relaxed text-[#5f5953]">
                  A 24-year-old renter in BC filing taxes for the first time has a very different priority list from
                  a newcomer in Alberta with dependents. Generic advice misses both.
                </p>
              </div>
              <div className="h-px bg-[#e2dbd4]" />
              <div>
                <h3 className="text-xl font-bold text-[#151311]">Clarity compounds over time</h3>
                <p className="mt-2 text-base leading-relaxed text-[#5f5953]">
                  One filed credit, one claimed benefit, one better financial decision. These gains stack. YUTH helps
                  you start and keep going.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f6efe8]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10">
          <div className="relative overflow-hidden rounded-[30px] border border-[#2d2623] bg-[radial-gradient(circle_at_top_right,#4c1e25_0%,#181110_50%,#0c0a09_100%)] px-8 py-10 shadow-[0_18px_52px_rgba(0,0,0,0.22)] md:px-10">
            <MapleLeafAccent className="absolute right-8 top-8 hidden md:flex" />
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f8178]">Built on real data</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-white md:text-3xl">
                Reliable guidance, matched to real life.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#b6aba2] md:text-base">
                YUTH is explicit about why something appears, where it comes from, and what you can do next.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {TRUST_PILLARS.map((pillar) => (
                <div
                  key={pillar.eyebrow}
                  className="rounded-[22px] border border-white/10 bg-white/6 p-5 backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ef7b8a]">
                    {pillar.eyebrow}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#b6aba2]">{pillar.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fffaf6]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-10 top-10 h-[220px] w-[220px] rounded-full bg-[#f4c56d] opacity-[0.08] blur-[100px]" />
          <div className="absolute right-0 top-0 h-[280px] w-[280px] rounded-full bg-[#ef6778] opacity-[0.08] blur-[120px]" />
        </div>

      
      </section>

      <footer className="bg-[#0c0a09]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <span className="text-sm font-bold tracking-[0.22em] text-white">YUTH</span>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6a6460]">
                The AI-powered life assistant for young Canadians navigating taxes, benefits, and financial adulthood.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a6e68]">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-[#9a9590]">
                <li>
                  <Link href="/auth?mode=signup" className="transition hover:text-white">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="transition hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#what-it-does" className="transition hover:text-white">
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a6e68]">About</p>
              <ul className="mt-3 space-y-2 text-sm text-[#9a9590]">
                <li>Built for Canadian youth</li>
                <li>Hackathon project</li>
                <li>yuth.app</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[#1e1c1a] pt-6 text-xs text-[#6a6460] sm:flex-row">
            <span className="font-bold tracking-[0.18em] text-[#a09890]">YUTH</span>
            <span>&copy; 2026 YUTH. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
