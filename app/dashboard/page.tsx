import Link from "next/link";

const benefits = [
  { name: "Canada Student Grant", value: "$4,200", desc: "Non-repayable support for eligible students." },
  { name: "GST/HST Credit", value: "$519", desc: "Quarterly payment for eligible Canadians." },
  { name: "FHSA", value: "High impact", desc: "Tax-advantaged savings for a future first home." },
];

const actions = [
  "File your taxes",
  "Open an FHSA",
  "Check your credit score",
  "Register for CRA My Account",
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] text-[#1c1b19]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">Welcome back, Anthony 👋</h1>
          </div>
          <Link
            href="/ask-ai"
            className="rounded-2xl bg-[#163320] px-6 py-3 font-semibold text-white"
          >
            Ask AI
          </Link>
        </div>

        <div className="mb-8 rounded-3xl bg-[#163320] p-8 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">Money you may be missing</p>
          <h2 className="mt-3 text-5xl font-bold">$2,300 to $4,800</h2>
          <p className="mt-3 text-lg text-white/70">
            Based on your current profile and common Canadian programs.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section>
            <h3 className="mb-4 text-2xl font-bold">Benefits for you</h3>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.name} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-semibold">{benefit.name}</h4>
                      <p className="mt-2 text-[#6f6a64]">{benefit.desc}</p>
                    </div>
                    <span className="rounded-xl bg-[#eef6ef] px-3 py-2 text-sm font-semibold text-[#2f7a47]">
                      {benefit.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside>
            <h3 className="mb-4 text-2xl font-bold">Actions this month</h3>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <ul className="space-y-4">
                {actions.map((action) => (
                  <li key={action} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f04d2d]" />
                    <span className="text-lg">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}