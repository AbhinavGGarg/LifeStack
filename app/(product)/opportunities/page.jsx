"use client";

import { useMemo, useState } from "react";
import OpportunityCard from "@/components/OpportunityCard";
import { useProductApp } from "@/components/ProductAppProvider";
import { isUndecidedMajor } from "@/lib/majorGuidance";

function daysUntil(deadline) {
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const msInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((parsed.getTime() - Date.now()) / msInDay);
}

function formatCategory(category) {
  return String(category || "")
    .replace(/-/g, " ")
    .trim();
}

export default function OpportunitiesPage() {
  const {
    studentProfile,
    majorPath,
    matchedOpportunities,
    insights,
    savedItems,
    saveOpportunity,
  } = useProductApp();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [savedOnly, setSavedOnly] = useState(false);

  const categories = useMemo(() => {
    const uniques = Array.from(new Set(matchedOpportunities.map((item) => item.category)));
    return ["all", ...uniques];
  }, [matchedOpportunities]);

  const savedSet = useMemo(
    () => new Set(savedItems.map((item) => item.opportunityId)),
    [savedItems]
  );

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const result = matchedOpportunities.filter((opportunity) => {
      if (categoryFilter !== "all" && opportunity.category !== categoryFilter) {
        return false;
      }

      const remainingDays = daysUntil(opportunity.deadline);

      if (deadlineFilter === "14" && (remainingDays < 0 || remainingDays > 14)) {
        return false;
      }

      if (deadlineFilter === "30" && (remainingDays < 0 || remainingDays > 30)) {
        return false;
      }

      if (deadlineFilter === "60" && (remainingDays < 0 || remainingDays > 60)) {
        return false;
      }

      if (deadlineFilter === "upcoming" && remainingDays < 0) {
        return false;
      }

      if (
        normalizedSearch &&
        !`${opportunity.title} ${opportunity.description} ${(opportunity.tags || []).join(" ")}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (savedOnly && !savedSet.has(opportunity.id)) {
        return false;
      }

      return true;
    });

    if (sortBy === "deadline") {
      return [...result].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    }

    if (sortBy === "newest") {
      return [...result].sort(
        (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
      );
    }

    return [...result].sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [
    categoryFilter,
    deadlineFilter,
    matchedOpportunities,
    savedOnly,
    savedSet,
    searchQuery,
    sortBy,
  ]);

  const recommendations = useMemo(() => {
    return matchedOpportunities
      .filter((opportunity) => !savedSet.has(opportunity.id))
      .slice(0, 3);
  }, [matchedOpportunities, savedSet]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Opportunities</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Discover and Prioritize</h2>
        <p className="mt-1 text-sm text-slate-600">
          Find high-fit opportunities and push them from discovery to application.
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <label className="text-sm text-slate-700 lg:col-span-2">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search internship, scholarship, hackathon..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            />
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Type</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Deadline</span>
            <select
              value={deadlineFilter}
              onChange={(event) => setDeadlineFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            >
              <option value="all">all</option>
              <option value="14">next 14 days</option>
              <option value="30">next 30 days</option>
              <option value="60">next 60 days</option>
              <option value="upcoming">all upcoming</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <label className="text-sm text-slate-700">
            <span className="mb-2 block text-xs uppercase tracking-wide text-slate-500">Sort By</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            >
              <option value="match">best match</option>
              <option value="deadline">soonest deadline</option>
              <option value="newest">latest deadline</option>
            </select>
          </label>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(event) => setSavedOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-sky-500"
              />
              Show saved only
            </label>
          </div>

          <div className="flex items-end text-sm text-slate-600">{filtered.length} results</div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.25)]">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-700/80">Major-Aligned Feed</p>
        <h3 className="mt-2 text-lg font-semibold text-indigo-950">
          Personalized for {majorPath?.label || "your current profile"}
        </h3>
        <p className="mt-1 text-sm text-indigo-900/80">
          {majorPath?.description ||
            "Set your intended major to prioritize opportunities that fit your direction."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(majorPath?.opportunityTags || []).slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-indigo-200 bg-white px-2 py-1 text-xs text-indigo-700"
            >
              #{tag}
            </span>
          ))}
        </div>
        {isUndecidedMajor(studentProfile?.intendedMajor) &&
        !studentProfile?.majorRecommendation ? (
          <p className="mt-3 text-xs text-indigo-800">
            You&apos;re undecided right now. Take the major quiz in Profile to improve recommendation quality.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recommended For You</h3>
          <p className="text-xs text-slate-500">High fit + actionable this week</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {recommendations.map((opportunity) => (
            <div key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{formatCategory(opportunity.category)}</p>
              <p className="text-sm font-semibold text-slate-900">{opportunity.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                Deadline in {Math.max(0, opportunity.daysUntilDeadline)} days
              </p>
              <button
                type="button"
                onClick={() => saveOpportunity(opportunity.id)}
                className="mt-3 rounded-lg border border-sky-300 bg-white px-2 py-1 text-xs text-sky-700 transition hover:bg-sky-50"
              >
                Save to Tracker
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Opportunity Feed</h3>
          <p className="text-xs text-slate-500">Internships, hackathons, scholarships, and more</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((opportunity) => {
            const isSaved = savedSet.has(opportunity.id);

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
