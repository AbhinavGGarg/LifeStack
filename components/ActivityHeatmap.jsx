"use client";

function intensityClass(score) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 55) return "bg-emerald-400";
  if (score >= 30) return "bg-emerald-300";
  if (score > 0) return "bg-emerald-200";
  return "bg-slate-200";
}

export default function ActivityHeatmap({ data = [], title = "Consistency Heatmap" }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">{title}</p>
      <p className="mt-1 text-sm text-slate-600">
        Each square reflects task completion + focus effort for that day.
      </p>

      <div className="mt-4 grid grid-cols-12 gap-1 sm:grid-cols-20">
        {data.map((day) => (
          <div
            key={day.dateKey}
            title={`${day.dateKey}: ${day.completedTasks} tasks, ${day.focusMinutes} focus min`}
            className={`h-3 rounded-sm ${intensityClass(day.activityScore)}`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
        <span>Low</span>
        <span className="h-2 w-5 rounded bg-slate-200" />
        <span className="h-2 w-5 rounded bg-emerald-200" />
        <span className="h-2 w-5 rounded bg-emerald-300" />
        <span className="h-2 w-5 rounded bg-emerald-400" />
        <span className="h-2 w-5 rounded bg-emerald-500" />
        <span>High</span>
      </div>
    </section>
  );
}
