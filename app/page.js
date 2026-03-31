import Link from "next/link";
import LandingCommandPalette from "@/components/LandingCommandPalette";

const proofPoints = [
  { value: "1", label: "System For School + Life" },
  { value: "4-step", label: "Discover -> Save -> Track -> Apply" },
  { value: "Daily", label: "Execution Feedback Loop" },
];

const coreFeatures = [
  {
    title: "Today's Focus",
    detail: "Keep your day clear with top-priority tasks, quick wins, and focus sessions that build consistency.",
    outcome: "No more \"what should I do now?\" paralysis.",
  },
  {
    title: "Opportunity Engine",
    detail: "Find internships, scholarships, hackathons, and programs matched to your interests and path.",
    outcome: "Higher-quality opportunities, faster.",
  },
  {
    title: "Trajectory + Tracker",
    detail: "See where your habits are taking you with transparent progress scoring based on real execution.",
    outcome: "Actionable direction, not vague motivation.",
  },
];

const loopSteps = [
  {
    step: "01",
    title: "Discover",
    detail: "Surface relevant opportunities and next-best actions.",
  },
  {
    step: "02",
    title: "Save",
    detail: "Capture opportunities you want to pursue before they disappear.",
  },
  {
    step: "03",
    title: "Track",
    detail: "Move from saved -> applying -> applied with clear status.",
  },
  {
    step: "04",
    title: "Apply",
    detail: "Take deadlines seriously and execute with consistency.",
  },
];

const rolloutMoments = [
  { title: "Day 1", detail: "Set goals, profile, and your first weekly plan." },
  { title: "Week 1", detail: "Build streak momentum with task + focus completion." },
  { title: "Week 2+", detail: "Improve trajectory with real execution and opportunity movement." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_6%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_90%_16%,rgba(16,185,129,0.14),transparent_28%),#f4f7fb] px-4 py-8 md:px-8 md:py-12">
      <LandingCommandPalette />

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_95px_-55px_rgba(15,23,42,0.45)] md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-600/80">LifeStack</p>
              <p className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Student OS
              </p>
            </div>

            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Build momentum every day, not just motivation.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              LifeStack is an execution system for students who want to stop drifting and start
              shipping: tasks, opportunities, trajectory, and action in one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login?mode=signup"
                className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-sky-600"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              >
                Log In
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                Press <span className="font-semibold text-slate-700">/</span> for quick navigation
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                Built for students who actually execute
              </span>
            </div>
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_95px_-55px_rgba(15,23,42,0.45)] md:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-600/80">Why People Stay</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">One system, no chaos</h2>
            <p className="mt-2 text-sm text-slate-600">
              LifeStack replaces scattered notes, random tabs, and missed deadlines with one clear
              loop that keeps moving.
            </p>

            <div className="mt-5 space-y-3">
              {proofPoints.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section id="features" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-600/80">Core Features</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
            Built to help students actually follow through
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {coreFeatures.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:bg-white"
              >
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-700/80">
                  {item.outcome}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-600/80">Core Loop</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
            Discover &rarr; Save &rarr; Track &rarr; Apply
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {loopSteps.map((item) => (
              <article key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600/80">{item.step}</p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="trajectory-preview" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-600/80">Progress Journey</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
            See exactly how momentum compounds
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            The system gets smarter as you log real activity. It does not fake progress. You can
            see your direction improve from day one to week two and beyond.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {rolloutMoments.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-slate-100 shadow-[0_35px_95px_-55px_rgba(15,23,42,0.7)] md:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-300/90">Ready To Start?</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
            Turn your goals into a system people can see.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Build consistency, track opportunities, and show real execution progress over time.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Start Free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-500 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-300 hover:bg-slate-800"
            >
              I Already Have An Account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
