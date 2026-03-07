import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Build your profile",
    body: "Share your age, province, life situation, and financial context in about two minutes.",
  },
  {
    number: "02",
    title: "See what applies to you",
    body: "MapleMind surfaces the Canadian credits, benefits, and programs matched to your situation.",
  },
  {
    number: "03",
    title: "Take clear next steps",
    body: "Follow prioritized actions and ask AI follow-up questions when you need more depth.",
  },
];

const CAPABILITIES = [
  {
    label: "Tax credits and deductions",
    detail: "GST/HST credit, tuition, CWB, provincial credits. Matched to your province and profile.",
  },
  {
    label: "Benefits and programs",
    detail: "EI, OSAP, rental assistance, newcomer support. Surfaced before you miss the window.",
  },
  {
    label: "Financial clarity",
    detail: "Debt, savings, and benefits gaps. Prioritized so you know what to do this week.",
  },
];

const TRUST_SIGNALS = [
  "Grounded in curated federal and provincial program data",
  "Matched to your profile, not generic advice",
  "Action links point to official Canadian sources",
];

export default function HomePage() {
  return (
    <main
      className="min-h-screen text-[#151311]"
      style={{ fontFamily: "'Inter', 'Avenir Next', 'Segoe UI', sans-serif", background: "#0c0a09" }}
    >

      {/* ── NAV (dark, flush with hero) ── */}
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
        <header className="flex items-center justify-between py-5">
          <span className="text-sm font-bold tracking-[0.22em] text-white">MAPLEMIND</span>
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

      {/* ── HERO (continuous with nav, same dark bg) ── */}
      <section className="relative overflow-hidden bg-[#0c0a09]">
        {/* Ambient red glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-[#c82233] opacity-[0.08] blur-[130px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-[#c82233] opacity-[0.05] blur-[110px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1200px] px-6 pb-24 pt-14 md:px-10 md:pt-20 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            {/* Left: headline */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6b74]">
                AI adulthood assistant · Canada
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-[68px]">
                Your benefits, taxes,{" "}
                <br className="hidden sm:block" />
                and next steps.{" "}
                <span className="text-[#e8394c]">All in one place.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#a09890] md:text-xl">
                MapleMind matches your Canadian profile to the programs, credits, and actions that matter for your life right now.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth?mode=signup"
                  className="rounded-xl bg-[#c82233] px-7 py-3.5 text-center text-base font-bold text-white shadow-[0_0_28px_rgba(200,34,51,0.45)] transition hover:bg-[#af1d2d] hover:shadow-[0_0_36px_rgba(200,34,51,0.55)]"
                >
                  Start free. 2 min setup.
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-xl border border-[#3a3530] px-7 py-3.5 text-center text-base font-semibold text-[#c8c0b8] transition hover:border-[#57504a] hover:text-white"
                >
                  How it works
                </Link>
              </div>
            </div>

            {/* Right: proof panel */}
            <div className="rounded-2xl border border-[#2e2824] bg-[#141210] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#7a6e68]">
                What you unlock
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Matched tax credits and deductions",
                  "Province-specific program eligibility",
                  "Priority action list for this week",
                  "Context-aware AI follow-up chat",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#b8b0a8]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#c82233] text-[9px] font-bold text-white">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl border border-[#3d1a20] bg-[#1e1214] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9f4a57]">Setup time</p>
                <p className="mt-1 text-2xl font-bold text-white">About 2 minutes</p>
                <p className="mt-1 text-xs text-[#7a6e68]">Age, province, situation. That's it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom edge fade into off-white */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#f5f2ee]" />
      </section>

      {/* ── WHAT IT DOES (warm off-white) ── */}
      <section className="bg-[#f5f2ee]" id="what-it-does">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">What MapleMind does</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#0f0c0a] md:text-4xl">
                One dashboard for the adult stuff nobody taught you.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#5f5953] md:text-lg">
                Government credits, benefit programs, and financial priorities are spread across dozens of sites. MapleMind reads your profile and surfaces what applies to you.
              </p>
            </div>
            <div className="grid gap-3">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.label}
                  className="rounded-2xl border border-[#e2dbd4] bg-white px-5 py-4 shadow-[0_2px_12px_rgba(20,15,12,0.04)] transition hover:border-[#d0c9c1]"
                >
                  <p className="font-semibold text-[#151311]">{cap.label}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#5f5953]">{cap.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (white, center-aligned) ── */}
      <section className="bg-white" id="how-it-works">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7b72]">How it works</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-[#0f0c0a] md:text-4xl">
              From uncertainty to action in three steps.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-[#ebe4dd] bg-[#faf8f6] p-6"
              >
                {/* Red-tinted step number */}
                <div className="mb-5 inline-flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c82233] text-xs font-black text-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#151311]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5f5953]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS (warm off-white, matching What it does) ── */}
      <section className="bg-[#f5f2ee]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Dark quote block */}
            <div className="rounded-2xl bg-[#0c0a09] p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6e68]">The problem</p>
              <blockquote className="mt-5 text-2xl font-bold leading-snug text-white md:text-3xl">
                Most young Canadians miss programs they qualify for. Not from lack of effort. From lack of{" "}
                <span className="text-[#e8394c]">clarity.</span>
              </blockquote>
              <p className="mt-6 text-sm leading-relaxed text-[#7a6e68]">
                Federal and provincial programs each have different eligibility rules, deadlines, and portals. Without a single view, most people miss what applies to them.
              </p>
            </div>
            {/* Right points */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#151311]">Support is fragmented by design</h3>
                <p className="mt-2 text-base text-[#5f5953]">
                  Programs live across federal, provincial, and municipal systems with no single discovery layer. MapleMind is that layer.
                </p>
              </div>
              <div className="h-px bg-[#e2dbd4]" />
              <div>
                <h3 className="text-xl font-bold text-[#151311]">Every situation is different</h3>
                <p className="mt-2 text-base text-[#5f5953]">
                  A 24-year-old renter in BC filing their first taxes has a completely different priority list than a newcomer in Alberta with dependents. Generic advice misses both.
                </p>
              </div>
              <div className="h-px bg-[#e2dbd4]" />
              <div>
                <h3 className="text-xl font-bold text-[#151311]">Clarity compounds</h3>
                <p className="mt-2 text-base text-[#5f5953]">
                  Filing one credit, claiming one benefit, making one better financial decision. These stack. MapleMind helps you start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST (dark strip) ── */}
      <section className="bg-[#0c0a09]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-14 md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6e68]">Built on real data</p>
              <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                Grounded. Matched. Transparent.
              </h2>
            </div>
            <ul className="flex flex-col gap-3 md:flex-row md:gap-8">
              {TRUST_SIGNALS.map((signal) => (
                <li key={signal} className="flex items-start gap-2.5 text-sm text-[#a09890]">
                  <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c82233]" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (white bg, red panel inside) ── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
          <div className="relative overflow-hidden rounded-[24px] bg-[#c82233] px-10 py-16 text-center md:px-16 md:py-20">
            {/* Subtle top-left highlight */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white opacity-[0.04] blur-[60px]" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-[#f5c0c7]">Get started</p>
            <h2 className="relative mt-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-[46px]">
              Know what you're entitled to in Canada.
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-base text-[#f5c0c7]">
              Create a free account, complete your profile, and see your personalized dashboard in minutes.
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth?mode=signup"
                className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#c82233] shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:bg-[#fff5f5]"
              >
                Create free account
              </Link>
              <Link
                href="/auth?mode=login"
                className="rounded-xl border border-white/25 px-8 py-3.5 text-base font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0c0a09]">
        <div className="mx-auto w-full max-w-[1200px] border-t border-[#1e1c1a] px-6 py-6 md:px-10">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-[#6a6460] sm:flex-row">
            <span className="font-bold tracking-[0.18em] text-[#a09890]">MAPLEMIND</span>
            <span>Built for young adults navigating Canada.</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
