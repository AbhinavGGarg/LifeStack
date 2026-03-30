"use client";

import { useMemo, useState } from "react";
import OpportunityCard from "@/components/OpportunityCard";
import { useProductApp } from "@/components/ProductAppProvider";

function daysUntil(deadline) {
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const msInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((parsed.getTime() - Date.now()) / msInDay);
}

export default function OpportunitiesPage() {
  const { matchedOpportunities, insights, savedItems, saveOpportunity } = useProductApp();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");

  const categories = useMemo(() => {
    const uniques = Array.from(new Set(matchedOpportunities.map((item) => item.category)));
    return ["all", ...uniques];
  }, [matchedOpportunities]);

  const filtered = useMemo(() => {
    return matchedOpportunities.filter((opportunity) => {
      if (categoryFilter !== "all" && opportunity.category !== categoryFilter) {
        return false;
      }

      const remainingDays = daysUntil(opportunity.deadline);

      if (deadlineFilter === "30" && (remainingDays < 0 || remainingDays > 30)) {
        return false;
      }

      if (deadlineFilter === "60" && (remainingDays < 0 || remainingDays > 60)) {
        return false;
      }

      if (deadlineFilter === "upcoming" && remainingDays < 0) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, deadlineFilter, matchedOpportunities]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Opportunities</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Discover and Prioritize</h2>
        <p className="mt-1 text-sm text-slate-300">
          Matches are ranked by your interests and deadline urgency.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Type</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-300/40 focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Deadline</span>
            <select
              value={deadlineFilter}
              onChange={(event) => setDeadlineFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-300/40 focus:outline-none"
            >
              <option value="all">all</option>
              <option value="30">next 30 days</option>
              <option value="60">next 60 days</option>
              <option value="upcoming">all upcoming</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Matched Opportunities</h3>
          <p className="text-xs text-slate-400">{filtered.length} results</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((opportunity) => {
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
  );
}
