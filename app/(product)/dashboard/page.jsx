"use client";

import GoalPlanner from "@/components/GoalPlanner";
import TaskList from "@/components/TaskList";
import GradeTracker from "@/components/GradeTracker";
import { useProductApp } from "@/components/ProductAppProvider";
import { isUndecidedMajor } from "@/lib/majorGuidance";

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const {
    studentProfile,
    majorPath,
    tasks,
    matchedOpportunities,
    goalPlans,
    addTask,
    toggleTask,
    deleteTask,
    logFocusSession,
    createGoalPlan,
    toggleGoalMilestone,
    addGoalSuggestionAsTask,
    removeGoalPlan,
    todayPlanTasks,
    topPriorityTask,
    dailyProgressPercent,
    completedTodayCount,
    streakDays,
    focusMinutesToday,
    executionScore,
  } = useProductApp();

  const incompleteCount = tasks.filter((task) => !task.completed).length;
  const smallWin = tasks.find(
    (task) =>
      !task.completed &&
      Number(task.estimateMinutes) > 0 &&
      Number(task.estimateMinutes) <= 20
  );
  const majorAlignedCount = matchedOpportunities.filter(
    (opportunity) => Array.isArray(opportunity.majorMatchingTags) && opportunity.majorMatchingTags.length > 0
  ).length;
  const nearTermMajorFits = matchedOpportunities.filter(
    (opportunity) =>
      Array.isArray(opportunity.majorMatchingTags) &&
      opportunity.majorMatchingTags.length > 0 &&
      opportunity.daysUntilDeadline >= 0 &&
      opportunity.daysUntilDeadline <= 45
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Today&apos;s Focus</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Build Momentum Through Action</h2>
        <p className="mt-1 text-sm text-slate-600">
          One high-quality day compounds. Focus on the next right action and keep the streak alive.
        </p>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span>Daily progress</span>
            <span>{dailyProgressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Completed Today"
            value={completedTodayCount}
            hint="Tasks checked off today"
          />
          <StatCard label="Streak" value={`${streakDays}d`} hint="Consecutive active days" />
          <StatCard
            label="Focus Time"
            value={`${focusMinutesToday}m`}
            hint="Intentional deep work today"
          />
          <StatCard
            label="Execution Score"
            value={executionScore}
            hint="Overall consistency + follow-through"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Top Priority</p>
          {topPriorityTask ? (
            <div className="mt-2">
              <h3 className="text-lg font-semibold text-slate-900">{topPriorityTask.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                Priority: {topPriorityTask.priority} • Estimated:{" "}
                {topPriorityTask.estimateMinutes || 25} min
              </p>
              {topPriorityTask.dueDate ? (
                <p className="mt-1 text-xs text-amber-700">Due: {topPriorityTask.dueDate}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">No due date set yet</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              No active tasks yet. Add one priority task to set direction for today.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Today&apos;s Plan</p>
          {todayPlanTasks.length > 0 ? (
            <div className="mt-2 space-y-2">
              {todayPlanTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.priority} • {task.category} • {task.estimateMinutes || 25} min
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Your plan is empty. Start with one easy task, then one high-impact task.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-800">
          {smallWin
            ? `Small win suggestion: finish "${smallWin.title}" now to build momentum.`
            : incompleteCount > 0
              ? "Small win suggestion: pick the shortest task and finish it in one uninterrupted sprint."
              : "Small win suggestion: add one 15-minute action and complete it immediately."}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Major Path Guidance</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Current direction: {majorPath?.label || "Undecided"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {majorPath?.description ||
            "Set your intended major (or quiz recommendation) to personalize classes, colleges, and opportunities."}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Suggested Classes</p>
            <p className="mt-1 text-sm text-slate-700">
              {majorPath?.classes?.slice(0, 3).join(" • ") || "Add a major to unlock class guidance."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Potential Colleges</p>
            <p className="mt-1 text-sm text-slate-700">
              {majorPath?.colleges?.slice(0, 3).join(" • ") || "College suggestions appear after major setup."}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Opportunity Alignment</p>
            <p className="mt-1 text-sm text-slate-700">
              {majorAlignedCount} major-fit opportunities, {nearTermMajorFits} due in the next 45 days.
            </p>
          </div>
        </div>

        {isUndecidedMajor(studentProfile?.intendedMajor) &&
        !studentProfile?.majorRecommendation ? (
          <p className="mt-3 text-xs text-amber-700">
            You&apos;re currently undecided. Take the major quiz in Profile to unlock sharper recommendations.
          </p>
        ) : null}
      </section>

      <GoalPlanner
        goalPlans={goalPlans}
        onCreateGoalPlan={createGoalPlan}
        onToggleGoalMilestone={toggleGoalMilestone}
        onAddGoalSuggestionAsTask={addGoalSuggestionAsTask}
        onRemoveGoalPlan={removeGoalPlan}
      />

      <GradeTracker key={studentProfile?.id || "student"} userId={studentProfile?.id} />

      <TaskList
        tasks={tasks}
        goalPlans={goalPlans}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onLogFocusSession={logFocusSession}
      />
    </div>
  );
}
