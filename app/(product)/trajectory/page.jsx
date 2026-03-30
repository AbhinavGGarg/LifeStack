"use client";

import { useMemo } from "react";
import LineTrendChart from "@/components/LineTrendChart";
import CollegeFitEstimator from "@/components/CollegeFitEstimator";
import { useProductApp } from "@/components/ProductAppProvider";
import { isUndecidedMajor } from "@/lib/majorGuidance";

function ProgressBar({ value, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-300 ${tones[tone] || tones.sky}`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

export default function TrajectoryPage() {
  const {
    studentProfile,
    majorPath,
    goalPlans,
    executionScore,
    streakDays,
    consistencyDelta,
    completedTaskCount,
    focusMinutesWeek,
    activityTimeline,
    savedStatusCounts,
  } = useProductApp();

  const trajectory = useMemo(() => {
    const recent = activityTimeline.slice(-56);
    const weeklySeries = [];

    for (let index = 0; index < 8; index += 1) {
      const chunk = recent.slice(index * 7, index * 7 + 7);
      const avg =
        chunk.length === 0
          ? 0
          : Math.round(chunk.reduce((sum, day) => sum + day.activityScore, 0) / chunk.length);

      const labelDate = chunk[chunk.length - 1]?.dateKey;
      weeklySeries.push({
        label: labelDate ? labelDate.slice(5) : `W${index + 1}`,
        value: avg,
      });
    }

    const goalProgress = goalPlans.map((goal) => {
      const done = goal.weeklyMilestones.filter((milestone) => milestone.done).length;
      const progress =
        goal.weeklyMilestones.length === 0
          ? 0
          : Math.round((done / goal.weeklyMilestones.length) * 100);

      return {
        id: goal.id,
        title: goal.title,
        progress,
        done,
        total: goal.weeklyMilestones.length,
      };
    });

    const averageGoalProgress =
      goalProgress.length === 0
        ? 0
        : Math.round(
            goalProgress.reduce((sum, goal) => sum + goal.progress, 0) / goalProgress.length
          );

    const pipelineStrength = Math.min(
      100,
      savedStatusCounts.saved * 12 +
        savedStatusCounts.applying * 22 +
        savedStatusCounts.applied * 35
    );

    const gpaScore =
      typeof studentProfile?.gpa === "number" && Number.isFinite(studentProfile.gpa)
        ? Math.round((studentProfile.gpa / 4) * 100)
        : 0;

    const trajectoryScore = Math.round(
      executionScore * 0.45 + averageGoalProgress * 0.2 + pipelineStrength * 0.2 + gpaScore * 0.15
    );

    let status = "On Track";
    if (trajectoryScore < 45) {
      status = "At Risk";
    } else if (trajectoryScore < 70) {
      status = "Behind";
    }

    let projection =
      "If you continue at this pace, your profile will strengthen steadily over the next 4-8 weeks.";
    if (status === "Behind") {
      projection =
        "If you continue at this pace, you may underperform on major goals unless weekly execution improves.";
    }
    if (status === "At Risk") {
      projection =
        "If you continue at this pace, key goals are likely to slip. Prioritize consistency and smaller daily wins immediately.";
    }

    const actions = [];
    if (streakDays < 3) {
      actions.push("Rebuild consistency: complete at least one priority task daily for 7 days.");
    }
    if (focusMinutesWeek < 120) {
      actions.push("Increase deep work volume: add two 45-minute focus sessions this week.");
    }
    if (averageGoalProgress < 50 && goalPlans.length > 0) {
      actions.push("Move one goal milestone to done within the next 48 hours.");
    }
    if (savedStatusCounts.applied < 2) {
      actions.push("Push pipeline action: move two opportunities from saved to applying.");
    }
    if (isUndecidedMajor(studentProfile?.intendedMajor) && !studentProfile?.majorRecommendation) {
      actions.push("Take the major quiz in Profile so Trajectory can optimize recommendations.");
    }
    if (actions.length === 0) {
      actions.push("Maintain current pace and protect your streak with one high-impact task today.");
    }

    return {
      weeklySeries,
      goalProgress,
      averageGoalProgress,
      pipelineStrength,
      gpaScore,
      trajectoryScore,
      status,
      projection,
      actions,
    };
  }, [
    activityTimeline,
    executionScore,
    focusMinutesWeek,
    goalPlans,
    savedStatusCounts,
    streakDays,
    studentProfile,
  ]);

  const statusTone =
    trajectory.status === "On Track"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : trajectory.status === "Behind"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Trajectory</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Long-Term Direction</h2>
            <p className="mt-1 text-sm text-slate-600">
              See if your current behavior supports your long-term student goals.
            </p>
          </div>
          <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusTone}`}>
            Status: {trajectory.status}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trajectory Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{trajectory.trajectoryScore}/100</p>
          <p className="mt-2 text-sm text-slate-600">{trajectory.projection}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Execution Inputs</p>
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Execution Score</span>
                <span>{executionScore}%</span>
              </div>
              <ProgressBar value={executionScore} tone="sky" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Goal Progress</span>
                <span>{trajectory.averageGoalProgress}%</span>
              </div>
              <ProgressBar value={trajectory.averageGoalProgress} tone="emerald" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Opportunity Pipeline</span>
                <span>{trajectory.pipelineStrength}%</span>
              </div>
              <ProgressBar value={trajectory.pipelineStrength} tone="amber" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signals</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Current streak: {streakDays} days</p>
            <p>Completed tasks: {completedTaskCount}</p>
            <p>Focus minutes this week: {focusMinutesWeek}</p>
            <p>Consistency delta: {consistencyDelta >= 0 ? "+" : ""}{consistencyDelta}% vs last week</p>
          </div>
        </section>
      </div>

      <LineTrendChart
        data={trajectory.weeklySeries}
        label="Execution Trend (Last 8 Weeks)"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Goal Progress</p>
          {trajectory.goalProgress.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              No active goals yet. Create one in Dashboard to see long-term projection quality improve.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {trajectory.goalProgress.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{goal.title}</span>
                    <span>{goal.done}/{goal.total}</span>
                  </div>
                  <ProgressBar value={goal.progress} tone="sky" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Suggested Actions</p>
          <div className="mt-3 space-y-2">
            {trajectory.actions.map((action) => (
              <div key={action} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {action}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Major Projection Lens</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Path focus: {majorPath?.label || "Undecided"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {majorPath?.description ||
            "Set your major profile to improve the long-term path signals shown here."}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Classes To Prioritize</p>
            <p className="mt-1 text-sm text-slate-700">
              {majorPath?.classes?.slice(0, 4).join(" • ") || "No class guidance yet."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">College Direction</p>
            <p className="mt-1 text-sm text-slate-700">
              {majorPath?.colleges?.slice(0, 4).join(" • ") || "No college guidance yet."}
            </p>
          </div>
        </div>
      </section>

      <CollegeFitEstimator studentProfile={studentProfile} />
    </div>
  );
}
