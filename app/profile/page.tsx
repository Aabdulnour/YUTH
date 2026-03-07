export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Profile</p>
        <h1 className="mt-2 text-4xl font-bold">Your situation</h1>
        <p className="mt-2 text-sm text-[#6f6a64]">
          Help us personalize your financial guidance.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Age</label>
            <input
              type="number"
              placeholder="Enter your age"
              className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Province or Territory</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Ontario</option>
              <option>Quebec</option>
              <option>British Columbia</option>
              <option>Alberta</option>
              <option>Manitoba</option>
              <option>Saskatchewan</option>
              <option>Nova Scotia</option>
              <option>New Brunswick</option>
              <option>Newfoundland and Labrador</option>
              <option>Prince Edward Island</option>
              <option>Northwest Territories</option>
              <option>Yukon</option>
              <option>Nunavut</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Student status</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Student</option>
              <option>Not a student</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Employment status</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Employed</option>
              <option>Self-employed</option>
              <option>Unemployed</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Annual income range</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Under $20,000</option>
              <option>$20,000 - $40,000</option>
              <option>$40,000 - $60,000</option>
              <option>$60,000 - $100,000</option>
              <option>$100,000+</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Housing status</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Rent</option>
              <option>Own</option>
              <option>Live with parents</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Planning to buy a home?</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Do you have student loans?</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Do you have other debt?</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Registered accounts</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>None</option>
              <option>TFSA</option>
              <option>RRSP</option>
              <option>FHSA</option>
              <option>Multiple</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Did you file taxes last year?</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Do you have children or dependents?</label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Do you identify as Indigenous (First Nations, Métis, or Inuit)?
            </label>
            <select className="w-full rounded-2xl border border-[#e7dfd6] bg-[#faf7f3] p-4 outline-none focus:border-[#c8b8a6]">
              <option>Prefer not to say</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <button className="mt-8 rounded-2xl bg-[#1c1b19] px-6 py-3 text-white transition hover:opacity-90">
          Save profile
        </button>
      </div>
    </main>
  );
}