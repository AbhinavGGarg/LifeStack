"use client";

import TaskList from "@/components/TaskList";
import { useProductApp } from "@/components/ProductAppProvider";

export default function DashboardPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useProductApp();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Today&apos;s Focus</h2>
        <p className="mt-1 text-sm text-slate-600">
          Keep execution tight. This page is intentionally simple so you can focus on action.
        </p>
      </section>

      <TaskList
        tasks={tasks}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}
