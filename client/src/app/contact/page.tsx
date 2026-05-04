export default function ContactPage() {
  return (
    <section className="page-container stagger-in space-y-5">
      <div className="card animate-fade-in">
        <h1 className="text-2xl font-bold">Contact</h1>
        <p className="mt-2 text-slate-600">
          Reach the placement team for support, interview schedule, and profile checks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Contact Details</h2>
          <p className="mt-2 text-sm text-slate-600">Email: careers@campusai.edu</p>
          <p className="text-sm text-slate-600">Phone: +91 90000 12345</p>
          <p className="text-sm text-slate-600">Location: Placement Block, Campus</p>
        </div>
        <form className="card space-y-2">
          <h2 className="font-semibold">Quick Message</h2>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Your name" />
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Email" />
          <textarea
            className="min-h-28 w-full rounded-lg border px-3 py-2"
            placeholder="Message"
          />
          <button type="button" className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-white">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
