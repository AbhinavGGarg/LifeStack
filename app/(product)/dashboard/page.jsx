"use client";

import { useMemo } from "react";
import OpportunityCard from "@/components/OpportunityCard";
import TaskList from "@/components/TaskList";
import { useProductApp } from "@/components/ProductAppProvider";

export default function DashboardPage() {
  const {
    tasks,
    insights,
    savedItems,
    matchedOpportunities,
    addTask,
    toggleTask,
    deleteTask,
    saveOpportunity,
  } = useProductApp();

  const featuredOpportunities = useMemo(
    () => matchedOpportunities.slice(0, 3),
    [matchedOpportunities]
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Today&apos;s Focus</h2>
        <p className="mt-1 text-sm text-slate-300">
          Keep execution tight. Complete tasks and prioritize your strongest 3 opportunities.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <TaskList
          tasks={tasks}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
        />

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal-300/70">Featured Opportunities</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Top 3 matches</h3>
            </div>
            <p className="text-xs text-slate-400">{featuredOpportunities.length} shown</p>
          </div>

          <div className="space-y-4">
            {featuredOpportunities.map((opportunity) => {
              const isSaved = savedItems.some((item) => item.opportunityId === opportunity.id);

              return (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  insight={insights[opportunity.id]}
                  isSaved={isSaved}
                  onSave={() => saveOpportunity(opportunity.id)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
