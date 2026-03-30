import Link from "next/link";

const productHighlights = [
  {
    title: "Plan Your Day",
    detail: "Turn goals into focused, trackable tasks so you always know what to do next.",
  },
  {
    title: "Find Opportunities",
    detail: "Discover internships, scholarships, hackathons, and programs matched to your path.",
  },
  {
    title: "Execute Consistently",
    detail: "Track momentum with streaks, focus sessions, and an execution score.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.12),transparent_28%),#f4f7fb] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.4)] md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-600/80">LifeStack</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            The Student OS for turning goals into action
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            LifeStack helps students stay consistent, find real opportunities, and move from
            planning to execution.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {productHighlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.4)] md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-600/80">Get Started</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Join LifeStack</h2>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account? Log in. New here? Create an account and set up your stack.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Log In
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
