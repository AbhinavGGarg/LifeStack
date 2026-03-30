"use client";

import { useEffect, useMemo, useState } from "react";

const PRIORITY_OPTIONS = ["high", "medium", "low"];
const CATEGORY_OPTIONS = [
  "study",
  "homework",
  "deep-work",
  "application",
  "planning",
  "project",
  "general",
];

const TASK_TEMPLATES = [
  {
    label: "Study Session",
    title: "Focused study block",
    priority: "high",
    estimateMinutes: 45,
    category: "study",
  },
  {
    label: "Homework Block",
    title: "Complete homework block",
    priority: "medium",
    estimateMinutes: 35,
    category: "homework",
  },
  {
    label: "Deep Work",
    title: "Deep work sprint",
    priority: "high",
    estimateMinutes: 60,
    category: "deep-work",
  },
  {
    label: "Application Session",
    title: "Application preparation session",
    priority: "high",
    estimateMinutes: 40,
    category: "application",
  },
];

function formatDueDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function TaskList({
  tasks = [],
  goalPlans = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onLogFocusSession,
}) {
  const [draft, setDraft] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [category, setCategory] = useState("general");
  const [dueDate, setDueDate] = useState("");
  const [goalId, setGoalId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [focusTaskId, setFocusTaskId] = useState(null);
  const [focusDuration, setFocusDuration] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );

  const focusTask = useMemo(
    () => tasks.find((task) => task.id === focusTaskId) || null,
    [tasks, focusTaskId]
  );

  const smallWinTask = useMemo(() => {
    const easy = incompleteTasks.find(
      (task) => Number(task.estimateMinutes) > 0 && Number(task.estimateMinutes) <= 20
    );

    return easy || incompleteTasks[0] || null;
  }, [incompleteTasks]);

  useEffect(() => {
    if (!focusRunning || !focusTaskId) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          const completedMinutes = Math.max(1, Math.round(focusDuration));
          onLogFocusSession(focusTaskId, completedMinutes);
          setFocusRunning(false);
          setFocusTaskId(null);
          return focusDuration * 60;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusDuration, focusRunning, focusTaskId, onLogFocusSession]);

  function resetForm() {
    setDraft("");
    setPriority("medium");
    setEstimateMinutes("");
    setCategory("general");
    setDueDate("");
    setGoalId("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    onAddTask({
      title: draft.trim(),
      priority,
      estimateMinutes: estimateMinutes ? Number(estimateMinutes) : null,
      category,
      dueDate: dueDate || null,
      goalId: goalId || null,
    });

    resetForm();
  }

  function handleApplyTemplate(template) {
    setDraft(template.title);
    setPriority(template.priority);
    setEstimateMinutes(String(template.estimateMinutes));
    setCategory(template.category);
    setShowAdvanced(true);
  }

  function startFocus(taskId) {
    setFocusTaskId(taskId);
    setFocusRunning(false);
    setSecondsRemaining(focusDuration * 60);
  }

  function completeFocus(markTaskComplete = false) {
    if (!focusTaskId) {
      return;
    }

    const elapsed = focusDuration * 60 - secondsRemaining;
    const completedMinutes = Math.max(
      1,
      Math.round((elapsed > 0 ? elapsed : focusDuration * 60) / 60)
    );

    onLogFocusSession(focusTaskId, completedMinutes);

    if (markTaskComplete && focusTask && !focusTask.completed) {
      onToggleTask(focusTask.id);
    }

    setFocusRunning(false);
    setFocusTaskId(null);
    setSecondsRemaining(focusDuration * 60);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Today</p>
        <h2 className="text-xl font-semibold text-slate-900">Task Stack</h2>
      </div>

      {smallWinTask ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span className="font-medium">Small win:</span> Complete one easy task now -{" "}
          <span className="font-medium">{smallWinTask.title}</span>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Start momentum with one 15-minute task.
        </div>
      )}

      <form className="mb-4 space-y-3" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a task (ex: finish chemistry problem set)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TASK_TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => handleApplyTemplate(template)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              {template.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowAdvanced((previous) => !previous)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300"
          >
            {showAdvanced ? "Hide options" : "More options"}
          </button>
        </div>

        {showAdvanced ? (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-slate-600">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Estimated Minutes
              <input
                type="number"
                min="5"
                step="5"
                value={estimateMinutes}
                onChange={(event) => setEstimateMinutes(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="text-xs text-slate-600">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-2">
              Linked Goal
              <select
                value={goalId}
                onChange={(event) => setGoalId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              >
                <option value="">No linked goal</option>
                {goalPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </form>

      {focusTask ? (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs uppercase tracking-wide text-sky-700">Focus Mode</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{focusTask.title}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[15, 25, 45, 60].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  setFocusDuration(minutes);

                  if (!focusRunning) {
                    setSecondsRemaining(minutes * 60);
                  }
                }}
                className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                  focusDuration === minutes
                    ? "border border-sky-300 bg-white text-sky-700"
                    : "border border-transparent bg-sky-100 text-sky-700 hover:bg-sky-200"
                }`}
              >
                {minutes}m
              </button>
            ))}
          </div>

          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {formatTimer(secondsRemaining)}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!focusRunning ? (
              <button
                type="button"
                onClick={() => setFocusRunning(true)}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
              >
                Start Focus
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFocusRunning(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Pause
              </button>
            )}

            <button
              type="button"
              onClick={() => completeFocus(false)}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Complete Session
            </button>

            <button
              type="button"
              onClick={() => completeFocus(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Complete + Mark Task Done
            </button>

            <button
              type="button"
              onClick={() => {
                setFocusRunning(false);
                setFocusTaskId(null);
                setSecondsRemaining(focusDuration * 60);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No tasks yet. Add one and build momentum.
          </p>
        ) : null}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-start gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-transparent accent-sky-500"
                />
                <span className={task.completed ? "text-slate-400 line-through" : ""}>{task.title}</span>
              </label>

              <div className="flex items-center gap-1">
                {!task.completed ? (
                  <button
                    type="button"
                    onClick={() => startFocus(task.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    Focus
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] text-rose-700 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                {task.priority}
              </span>
              {task.category ? (
                <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                  {task.category}
                </span>
              ) : null}
              {task.estimateMinutes ? (
                <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                  {task.estimateMinutes} min
                </span>
              ) : null}
              {task.dueDate ? (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                  Due {formatDueDate(task.dueDate)}
                </span>
              ) : null}
              {Number(task.focusMinutes) > 0 ? (
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
                  Focus {task.focusMinutes}m
                </span>
              ) : null}
              {task.goalId ? (
                <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700">
                  Goal-linked
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
