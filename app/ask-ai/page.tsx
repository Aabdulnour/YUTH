import Link from "next/link";

export default function AskAIPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">AI Assistant</p>
            <h1 className="mt-2 text-4xl font-bold">Ask about my situation</h1>
          </div>
          <Link href="/dashboard" className="rounded-2xl border border-[#d8d1c8] bg-white px-5 py-3 font-medium">
            Back to dashboard
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div className="max-w-xl rounded-2xl bg-[#f4f4f2] p-4">
              Hey Anthony, based on your profile, you may qualify for student-related benefits and should likely file taxes if you have not already.
            </div>

            <div className="ml-auto max-w-xl rounded-2xl bg-[#163320] p-4 text-white">
              Should I open an FHSA or a TFSA first?
            </div>

            <div className="max-w-xl rounded-2xl bg-[#f4f4f2] p-4">
              For many young adults with moderate income, a TFSA is usually the better first step for flexibility. If buying a first home is a real goal, FHSA is extremely valuable too.
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <input
              className="flex-1 rounded-2xl border border-[#ddd6cf] bg-[#faf7f3] px-5 py-4 outline-none"
              placeholder="Ask anything about benefits, taxes, housing, or savings..."
            />
            <button className="rounded-2xl bg-[#163320] px-6 py-4 font-semibold text-white">
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}