"use client";

import { useState } from "react";

export default function TaskList({ tasks, onAddTask, onToggleTask, onDeleteTask }) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    onAddTask(draft.trim());
    setDraft("");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Today</p>
        <h2 className="text-xl font-semibold text-slate-900">Task Stack</h2>
      </div>

      <form className="mb-4 flex gap-2" onSubmit={handleSubmit}>
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
      </form>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No tasks yet. Add one and build momentum.
          </p>
        ) : null}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <label className="flex items-center gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="h-4 w-4 rounded border-slate-300 bg-transparent accent-sky-500"
              />
              <span className={task.completed ? "text-slate-400 line-through" : ""}>{task.title}</span>
            </label>

            <button
              type="button"
              onClick={() => onDeleteTask(task.id)}
              className="text-xs text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-500"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
