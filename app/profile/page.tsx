export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#1c1b19]">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a8580]">Profile</p>
        <h1 className="mt-2 text-4xl font-bold">Your situation</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#faf7f3] p-4">Age: 24</div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">Province: Ontario</div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">Student: Yes</div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">Employed: Yes</div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">Renter: Yes</div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">Has debt: Yes</div>
        </div>
      </div>
    </main>
  );
}