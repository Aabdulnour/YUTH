import Link from "next/link";

const HOW_IT_WORKS = [
  {
    title: "Tell us where you are now",
    description: "Answer a short onboarding flow about your work, school, housing, and financial context.",
  },
  {
    title: "See what applies to you",
    description: "MapleMind matches you to relevant benefits and savings opportunities across Canada.",
  },
  {
    title: "Take clear next steps",
    description: "Follow practical actions in priority order so you can move forward with confidence.",
  },
];

const VALUE_POINTS = [
  {
    title: "Built for real decisions",
    description: "Get practical guidance for what to do next, not generic financial content.",
  },
  {
    title: "Personalized from day one",
    description: "Recommendations are shaped by your life stage, province, and current priorities.",
  },
  {
    title: "Made to reduce overwhelm",
    description: "One focused plan replaces scattered tabs, guesswork, and missed opportunities.",
  },
];

const TRUST_POINTS = [
  "Guidance grounded in curated Canadian program data",
  "Transparent matching logic designed for clarity",
  "Action paths tied to official or trusted sources",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0d2216] text-[#f7f0e1]">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-6 md:px-8">
        <header className="flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[0.16em] text-[#dcebd3] md:text-base">MAPLEMIND</p>
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="rounded-lg border border-[#dcebd3]/30 px-4 py-2 text-sm font-medium text-[#f7f0e1] transition hover:bg-[#f7f0e1]/8"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-lg bg-[#f26a2c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ea7a45]"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="mt-12 rounded-[32px] border border-[#dcebd3]/16 bg-gradient-to-b from-[#143121] to-[#10271a] px-8 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#9fbea7]">AI-powered adulthood assistant for Canada</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.06] md:text-6xl xl:text-7xl">
                A clearer way to
                <br />
                navigate money,
                <br />
                benefits, and next steps.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d6e4d1] md:text-xl">
                MapleMind helps young adults in Canada find relevant support, make smarter financial moves, and act on a plan that fits real life.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="rounded-xl bg-[#f26a2c] px-7 py-3 text-center text-base font-semibold text-white transition hover:bg-[#ea7a45]"
                >
                  Get started free
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-xl border border-[#dcebd3]/28 px-7 py-3 text-center text-base font-medium text-[#f7f0e1] transition hover:bg-[#f7f0e1]/8"
                >
                  See how it works
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-[#dcebd3]/18 bg-[#f7f0e1]/6 p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[#a7c4ae]">What you get</p>
              <ul className="mt-4 space-y-4 text-sm text-[#d7e5d1]">
                <li className="border-b border-[#dcebd3]/14 pb-4">Personalized benefit matching based on your situation</li>
                <li className="border-b border-[#dcebd3]/14 pb-4">Prioritized action steps you can actually follow</li>
                <li className="pb-1">Context-aware AI guidance for practical follow-up questions</li>
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#dcebd3]/16 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#9fbea7]">Setup</p>
                  <p className="mt-2 text-2xl font-semibold text-[#f7f0e1]">~3 min</p>
                </div>
                <div className="rounded-xl border border-[#dcebd3]/16 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#9fbea7]">Focus</p>
                  <p className="mt-2 text-2xl font-semibold text-[#f7f0e1]">Real outcomes</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="how-it-works" className="mt-20">
          <p className="text-xs uppercase tracking-[0.16em] text-[#9fbea7]">How it works</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-[#f7f0e1] md:text-5xl">
            Three steps to a plan you can trust.
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {HOW_IT_WORKS.map((item, index) => (
              <article key={item.title} className="rounded-2xl border border-[#dcebd3]/15 bg-[#11291b] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9fbea7]">Step {index + 1}</p>
                <h3 className="mt-3 text-2xl font-semibold text-[#f7f0e1]">{item.title}</h3>
                <p className="mt-3 text-[#d5e3d0]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#9fbea7]">Why MapleMind</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#f7f0e1] md:text-5xl">
              Most people do not need more advice.
              <br />
              They need better direction.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#d4e2cf]">
              MapleMind turns complexity into clear priorities so you can focus on what matters now and make steady progress over time.
            </p>
          </div>

          <div className="space-y-4">
            {VALUE_POINTS.map((point) => (
              <article key={point.title} className="rounded-2xl border border-[#dcebd3]/15 bg-[#11291b] p-6">
                <h3 className="text-xl font-semibold text-[#f7f0e1]">{point.title}</h3>
                <p className="mt-2 text-[#d5e3d0]">{point.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[28px] border border-[#dcebd3]/15 bg-[#11291b] p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.16em] text-[#9fbea7]">Trust</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#f7f0e1] md:text-4xl">
            Built for practical, credible guidance.
          </h2>
          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="rounded-xl border border-[#dcebd3]/15 bg-[#f7f0e1]/5 px-5 py-4 text-[#d4e2cf]">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 rounded-[28px] border border-[#dcebd3]/20 bg-[#f7f0e1] px-8 py-10 text-[#122619] lg:px-10 lg:py-12">
          <p className="text-xs uppercase tracking-[0.16em] text-[#2f5b3d]">Start now</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Build your MapleMind plan in minutes.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-[#21422d]">
            Create your profile, see what applies to you, and take the next financial step with clarity.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="rounded-xl bg-[#f26a2c] px-7 py-3 text-center text-base font-semibold text-white transition hover:bg-[#ea7a45]"
            >
              Sign up free
            </Link>
            <Link
              href="/onboarding"
              className="rounded-xl border border-[#2f5b3d]/30 px-7 py-3 text-center text-base font-medium text-[#173222] transition hover:bg-[#173222]/5"
            >
              Log in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
