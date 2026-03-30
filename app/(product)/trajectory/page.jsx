"use client";

import { useMemo } from "react";
import { useProductApp } from "@/components/ProductAppProvider";

function ProgressBar({ value, tone = "cyan" }) {
  const classes = {
    cyan: "bg-cyan-300",
    teal: "bg-teal-300",
    emerald: "bg-emerald-300",
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-300 ${classes[tone] || classes.cyan}`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

export default function TrajectoryPage() {
  const { tasks, completedTaskCount, savedItems, savedStatusCounts } = useProductApp();

  const trajectory = useMemo(() => {
    const taskCompletionRate =
      tasks.length === 0 ? 0 : Math.round((completedTaskCount / tasks.length) * 100);
    const opportunityPipelineScore = Math.min(
      100,
      savedStatusCounts.saved * 18 +
        savedStatusCounts.applying * 26 +
        savedStatusCounts.applied * 34
    );
    const momentumScore = Math.round(taskCompletionRate * 0.45 + opportunityPipelineScore * 0.55);

    let currentPathMessage = "You need more extracurricular depth.";
    if (momentumScore >= 70) {
      currentPathMessage = "You are on a strong track.";
    } else if (momentumScore >= 45) {
      currentPathMessage = "You are building momentum. Keep consistency high.";
    }

    let projectedOutcome =
      "Projected outcome: early-stage profile. Focus on finishing tasks and adding targeted opportunities.";
    if (momentumScore >= 80) {
      projectedOutcome =
        "Projected outcome: competitive profile with strong odds for selective applications this cycle.";
    } else if (momentumScore >= 55) {
      projectedOutcome =
        "Projected outcome: solid trajectory. You are likely to see better application response rates soon.";
    }

    return {
      taskCompletionRate,
      opportunityPipelineScore,
      momentumScore,
      currentPathMessage,
      projectedOutcome,
    };
  }, [completedTaskCount, savedStatusCounts, tasks.length]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Trajectory</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Your Direction Over Time</h2>
        <p className="mt-1 text-sm text-slate-300">
          This uses your completed tasks and saved opportunity pipeline to estimate current momentum.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300/75">Your Current Path</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{trajectory.currentPathMessage}</h3>
          <p className="mt-2 text-sm text-slate-300">
            You currently have {savedItems.length} saved opportunities and {completedTaskCount} completed tasks.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                <span>Task Discipline</span>
                <span>{trajectory.taskCompletionRate}%</span>
              </div>
              <ProgressBar value={trajectory.taskCompletionRate} tone="cyan" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                <span>Opportunity Pipeline</span>
                <span>{trajectory.opportunityPipelineScore}%</span>
              </div>
              <ProgressBar value={trajectory.opportunityPipelineScore} tone="teal" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Projected Outcome</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Momentum Score: {trajectory.momentumScore}/100</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{trajectory.projectedOutcome}</p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
              <span>Overall Trajectory Strength</span>
              <span>{trajectory.momentumScore}%</span>
            </div>
            <ProgressBar value={trajectory.momentumScore} tone="emerald" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-slate-300">
              Saved: {savedStatusCounts.saved}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-slate-300">
              Applying: {savedStatusCounts.applying}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-slate-300">
              Applied: {savedStatusCounts.applied}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
