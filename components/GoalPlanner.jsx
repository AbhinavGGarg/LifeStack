"use client";

import { useState } from "react";

const STARTER_GOALS = [
  "Get an A in math",
  "Study for SAT",
  "Build a startup project",
  "Apply for internships",
];

export default function GoalPlanner({
  goalPlans,
  onCreateGoalPlan,
  onToggleGoalMilestone,
  onAddGoalSuggestionAsTask,
  onRemoveGoalPlan,
}) {
  const [goalInput, setGoalInput] = useState("");

  function submitGoal(event) {
    event.preventDefault();

    const created = onCreateGoalPlan(goalInput);
    if (created) {
      setGoalInput("");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Planner</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">AI-Style Goal Breakdown</h3>
          <p className="mt-1 text-sm text-slate-600">
            Convert big goals into daily tasks and weekly milestones.
          </p>
        </div>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
          Mock planning engine (ready for backend AI later)
        </p>
      </div>

      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submitGoal}>
        <input
          type="text"
          value={goalInput}
          onChange={(event) => setGoalInput(event.target.value)}
          placeholder="Enter a larger goal..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Generate Plan
        </button>
      </form>

      {goalPlans.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="text-sm text-slate-600">
            No active goals yet. Pick one to generate action steps instantly.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STARTER_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setGoalInput(goal)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {goalPlans.slice(0, 3).map((plan) => {
            const doneCount = plan.weeklyMilestones.filter((item) => item.done).length;
            const progress =
              plan.weeklyMilestones.length === 0
                ? 0
                : Math.round((doneCount / plan.weeklyMilestones.length) * 100);

            return (
              <article
                key={plan.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{plan.title}</p>
                    <p className="text-xs text-slate-500">Cadence: {plan.suggestedCadence}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveGoalPlan(plan.id)}
                    className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] text-rose-700 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Goal progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                      Weekly milestones
                    </p>
                    <div className="space-y-1.5">
                      {plan.weeklyMilestones.map((milestone) => (
                        <label key={milestone.id} className="flex items-start gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={milestone.done}
                            onChange={() => onToggleGoalMilestone(plan.id, milestone.id)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-sky-500"
                          />
                          <span className={milestone.done ? "line-through text-slate-400" : ""}>
                            {milestone.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                      Suggested daily tasks
                    </p>
                    <div className="space-y-1.5">
                      {plan.suggestedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5">
                          <div>
                            <p className="text-xs font-medium text-slate-800">{task.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {task.priority} • {task.estimateMinutes || 25} min
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onAddGoalSuggestionAsTask(plan.id, task.id)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
