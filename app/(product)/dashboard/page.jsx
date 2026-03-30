"use client";

import TaskList from "@/components/TaskList";
import { useProductApp } from "@/components/ProductAppProvider";
import Link from "next/link";

export default function DashboardPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useProductApp();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Today&apos;s Focus</h2>
        <p className="mt-1 text-sm text-slate-300">
          Keep execution tight. Use this space for daily tasks and execution momentum.
        </p>
      </section>

      <TaskList
        tasks={tasks}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
      />

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300/70">Opportunities</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Browse Matches in Dedicated View</h3>
        <p className="mt-1 text-sm text-slate-300">
          All discovery and filtering now lives in the Opportunities tab for a cleaner workflow.
        </p>
        <Link
          href="/opportunities"
          className="mt-4 inline-flex rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/20"
        >
          Open Opportunities
        </Link>
      </section>
    </div>
  );
}
