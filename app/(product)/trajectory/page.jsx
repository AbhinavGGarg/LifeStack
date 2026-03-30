"use client";

import { useMemo } from "react";
import { useProductApp } from "@/components/ProductAppProvider";

function ProgressBar({ value, tone = "cyan" }) {
  const classes = {
    cyan: "bg-sky-400",
    teal: "bg-teal-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-300 ${classes[tone] || classes.cyan}`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

export default function TrajectoryPage() {
  const {
    studentProfile,
    tasks,
    completedTaskCount,
    savedItems,
    savedStatusCounts,
  } = useProductApp();

  const trajectory = useMemo(() => {
    const taskCompletionRate =
      tasks.length === 0 ? 0 : Math.round((completedTaskCount / tasks.length) * 100);

    const opportunityPipelineScore = Math.min(
      100,
      savedStatusCounts.saved * 16 +
        savedStatusCounts.applying * 24 +
        savedStatusCounts.applied * 36
    );

    const gpa = typeof studentProfile?.gpa === "number" ? studentProfile.gpa : null;
    const gpaScore = gpa === null ? 0 : Math.round((gpa / 4) * 100);

    const activityHours =
      typeof studentProfile?.activityHours === "number" ? studentProfile.activityHours : null;
    const activityScore =
      activityHours === null ? 0 : Math.min(100, Math.round((activityHours / 20) * 100));

    const hasGpa = gpa !== null;
    const hasActivityHours = activityHours !== null;
    const hasEnoughInputs = hasGpa && hasActivityHours;

    const momentumScore = Math.round(
      taskCompletionRate * 0.35 +
        opportunityPipelineScore * 0.3 +
        gpaScore * 0.25 +
        activityScore * 0.1
    );

    let currentPathMessage = "You need more extracurricular depth and stronger execution consistency.";
    if (momentumScore >= 75) {
      currentPathMessage = "You are on a strong track.";
    } else if (momentumScore >= 50) {
      currentPathMessage = "You are building momentum. Keep your pipeline and academics aligned.";
    }

    let projectedOutcome =
      "Projected outcome: moderate competitiveness. Improve application volume and profile strength for better odds.";
    if (momentumScore >= 80) {
      projectedOutcome =
        "Projected outcome: strong competitiveness for selective internships and programs if momentum is maintained.";
    } else if (momentumScore >= 60) {
      projectedOutcome =
        "Projected outcome: improving competitiveness. Prioritize high-fit applications and consistent task completion.";
    }

    const confidence = hasEnoughInputs ? "High" : "Low";

    return {
      taskCompletionRate,
      opportunityPipelineScore,
      gpaScore,
      activityScore,
      momentumScore,
      currentPathMessage,
      projectedOutcome,
      hasGpa,
      hasActivityHours,
      confidence,
    };
  }, [completedTaskCount, savedStatusCounts, studentProfile, tasks.length]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Trajectory</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Trajectory Model</h2>
        <p className="mt-1 text-sm text-slate-600">
          Inputs used: task completion, saved pipeline status, GPA, and extracurricular hours per week.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600/80">Your Current Path</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{trajectory.currentPathMessage}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {savedItems.length} saved opportunities, {completedTaskCount} completed tasks, confidence:{" "}
            {trajectory.confidence}.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                <span>Task Execution</span>
                <span>{trajectory.taskCompletionRate}%</span>
              </div>
              <ProgressBar value={trajectory.taskCompletionRate} tone="cyan" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                <span>Opportunity Pipeline</span>
                <span>{trajectory.opportunityPipelineScore}%</span>
              </div>
              <ProgressBar value={trajectory.opportunityPipelineScore} tone="teal" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                <span>Academic Signal (GPA)</span>
                <span>{trajectory.hasGpa ? `${trajectory.gpaScore}%` : "Missing input"}</span>
              </div>
              <ProgressBar value={trajectory.gpaScore} tone="amber" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                <span>Extracurricular Depth (hours/week)</span>
                <span>{trajectory.hasActivityHours ? `${trajectory.activityScore}%` : "Missing input"}</span>
              </div>
              <ProgressBar value={trajectory.activityScore} tone="amber" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600/80">Projected Outcome</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Trajectory Score: {trajectory.momentumScore}/100
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{trajectory.projectedOutcome}</p>

          {trajectory.confidence === "Low" ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Add GPA and weekly activity hours in your Profile tab for more reliable projections.
            </p>
          ) : null}

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
              <span>Overall Strength</span>
              <span>{trajectory.momentumScore}%</span>
            </div>
            <ProgressBar value={trajectory.momentumScore} tone="emerald" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-600">
              Saved: {savedStatusCounts.saved}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-600">
              Applying: {savedStatusCounts.applying}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-600">
              Applied: {savedStatusCounts.applied}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
