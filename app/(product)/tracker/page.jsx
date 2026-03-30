"use client";

import { useMemo, useState } from "react";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { useProductApp } from "@/components/ProductAppProvider";

const STATUS_OPTIONS = ["saved", "applying", "applied"];

function formatDate(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function TrackerPage() {
  const {
    tasks,
    focusSessions,
    activityTimeline,
    executionScore,
    consistencyDelta,
    reflectionToday,
    saveDailyReflection,
    savedOpportunityRows,
    updateSavedStatus,
    removeSavedItem,
  } = useProductApp();

  const [windowFilter, setWindowFilter] = useState("weekly");
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [hasReflectionDraft, setHasReflectionDraft] = useState(false);
  const [reflectionSavedAt, setReflectionSavedAt] = useState("");
  const [reflectionStatus, setReflectionStatus] = useState("idle");
  const reflectionInput = hasReflectionDraft ? reflectionDraft : reflectionToday || "";

  const days = windowFilter === "daily" ? 1 : windowFilter === "weekly" ? 7 : 30;
  const scopedActivity = activityTimeline.slice(-days);

  const metrics = useMemo(() => {
    const completedTasks = scopedActivity.reduce((sum, day) => sum + day.completedTasks, 0);
    const focusMinutes = scopedActivity.reduce((sum, day) => sum + day.focusMinutes, 0);
    const focusSessionsCount = focusSessions.filter((session) =>
      scopedActivity.some((day) => day.dateKey === session.dateKey)
    ).length;

    const windowStartKey = scopedActivity[0]?.dateKey || null;
    const createdTasks = tasks.filter(
      (task) =>
        windowStartKey
          ? String(task.createdAt || "").slice(0, 10) >= windowStartKey
          : true
    ).length;
    const completionRate =
      createdTasks === 0 ? 0 : Math.round((completedTasks / createdTasks) * 100);

    const scoredDays = scopedActivity.filter((day) => day.activityScore > 0).length;
    const consistency = Math.round((scoredDays / Math.max(1, scopedActivity.length)) * 100);

    const bestDay = [...scopedActivity].sort((a, b) => b.activityScore - a.activityScore)[0];
    const weakDay = [...scopedActivity].sort((a, b) => a.activityScore - b.activityScore)[0];

    return {
      completedTasks,
      focusMinutes,
      focusSessionsCount,
      completionRate,
      consistency,
      bestDay: bestDay?.dateKey || "N/A",
      weakDay: weakDay?.dateKey || "N/A",
    };
  }, [focusSessions, scopedActivity, tasks]);

  function handleSaveReflection() {
    setReflectionStatus("saving");
    saveDailyReflection(reflectionInput);
    setHasReflectionDraft(false);
    setReflectionSavedAt(
      new Date().toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    );
    setReflectionStatus("saved");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Tracker</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Behavior and Consistency</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track execution quality, focus effort, and consistency trends.
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            {[
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setWindowFilter(item.id)}
                className={`rounded-lg px-2 py-1 transition ${
                  windowFilter === item.id
                    ? "bg-white font-medium text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tasks Completed"
            value={metrics.completedTasks}
            hint={`${windowFilter} output`}
          />
          <StatCard
            label="Focus Time"
            value={`${metrics.focusMinutes}m`}
            hint={`${metrics.focusSessionsCount} focus sessions`}
          />
          <StatCard
            label="Completion Rate"
            value={`${metrics.completionRate}%`}
            hint="Completed vs created tasks"
          />
          <StatCard
            label="Execution Score"
            value={executionScore}
            hint={`${consistencyDelta >= 0 ? "+" : ""}${consistencyDelta}% vs last week`}
          />
        </div>
      </section>

      <ActivityHeatmap data={activityTimeline.slice(-84)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Weekly Summary</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Consistency trend: {metrics.consistency}% active days</p>
            <p>Best day: {metrics.bestDay}</p>
            <p>Weaker day: {metrics.weakDay}</p>
            <p>Total study/work time: {Math.round(metrics.focusMinutes / 60)} hours</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Reflection Prompt</p>
          <p className="mt-1 text-sm text-slate-600">What got in the way today?</p>
          <textarea
            value={reflectionInput}
            onChange={(event) => {
              setHasReflectionDraft(true);
              setReflectionDraft(event.target.value);
              if (reflectionStatus !== "idle") {
                setReflectionStatus("idle");
              }
            }}
            rows={4}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveReflection}
            className="mt-3 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            {reflectionStatus === "saving" ? "Saving..." : "Save Reflection"}
          </button>

          {reflectionStatus === "saved" ? (
            <p className="mt-2 text-xs text-emerald-700">
              Reflection saved{reflectionSavedAt ? ` at ${reflectionSavedAt}` : ""}.
            </p>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Opportunity Tracker</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Saved Opportunity Pipeline</h3>

        {savedOpportunityRows.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No saved opportunities yet. Save your top matches from Opportunities.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {savedOpportunityRows.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.opportunity.title}</p>
                    <p className="text-xs text-slate-500">Deadline: {formatDate(item.opportunity.deadline)}</p>
                  </div>
                  <a
                    href={`/api/opportunities/open?id=${encodeURIComponent(item.opportunity.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    Open Link
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(event) => updateSavedStatus(item.id, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSavedItem(item.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
