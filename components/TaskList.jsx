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
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_70px_-40px_rgba(59,130,246,0.6)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Today</p>
        <h2 className="text-xl font-semibold text-white">Task Stack</h2>
      </div>

      <form className="mb-4 flex gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task (ex: finish chemistry problem set)"
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
            No tasks yet. Add one and build momentum.
          </p>
        ) : null}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2"
          >
            <label className="flex items-center gap-3 text-sm text-slate-100">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan-400"
              />
              <span className={task.completed ? "text-slate-500 line-through" : ""}>{task.title}</span>
            </label>

            <button
              type="button"
              onClick={() => onDeleteTask(task.id)}
              className="text-xs text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
