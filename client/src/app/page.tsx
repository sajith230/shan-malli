import Link from "next/link";

export default function Home() {
  return (
    <section className="page-container space-y-8 py-4">
      <div className="hero-animated animate-fade-in rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 px-8 py-10 text-white shadow-xl">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
              Final Campus Research Project
            </p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">Online AI Job System</h1>
            <p className="mt-4 max-w-3xl text-base text-blue-50 md:text-lg">
              Complete frontend prototype with public website, login, job apply flow, admin
              management, and chatbot support.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/apply" className="rounded-lg bg-white px-5 py-2 font-semibold text-indigo-700">
                Apply Job
              </Link>
              <Link href="/login" className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white">
                Login
              </Link>
              <Link href="/contact" className="rounded-lg border border-white px-5 py-2 font-semibold text-white">
                Contact
              </Link>
            </div>
          </div>
          <div className="animate-float-soft rounded-xl border border-white/30 bg-white/15 p-4 text-sm">
            <p className="font-semibold text-white">Default Admin Account</p>
            <p className="mt-2 text-blue-100">Email: admin@campus.ai</p>
            <p className="text-blue-100">Password: admin123</p>
          </div>
        </div>
      </div>

      <div className="stagger-in grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">1) Login & Register</h2>
          <p className="mt-2 text-sm text-slate-700">
            Users can register and login before applying for jobs.
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">2) Apply Job Form</h2>
          <p className="mt-2 text-sm text-slate-700">
            Apply with position, skills, and introduction message.
          </p>
        </article>
        <article className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">3) Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-700">
            Admin can view all applications and add users manually.
          </p>
        </article>
      </div>

      <div className="stagger-in grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-semibold text-indigo-700">Website Pages</p>
          <p className="mt-1 text-sm text-slate-700">Home, Contact, Apply Job, Settings</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-emerald-700">Admin Features</p>
          <p className="mt-1 text-sm text-slate-700">View applicants and add manual users</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-purple-700">AI Assistant</p>
          <p className="mt-1 text-sm text-slate-700">Floating chatbot for quick help</p>
        </div>
      </div>

      <div className="stagger-in grid gap-4 md:grid-cols-4">
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-indigo-700">4+</p>
          <p className="mt-1 text-sm text-slate-600">Main Website Pages</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-emerald-700">1</p>
          <p className="mt-1 text-sm text-slate-600">Admin Dashboard</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-blue-700">100%</p>
          <p className="mt-1 text-sm text-slate-600">Frontend Prototype</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-purple-700">24/7</p>
          <p className="mt-1 text-sm text-slate-600">Chatbot UI Support</p>
        </div>
      </div>
    </section>
  );
}
