"use client";

import { useProductApp } from "@/components/ProductAppProvider";

const STATUS_OPTIONS = ["saved", "applying", "applied"];

function formatDate(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrackerPage() {
  const { savedOpportunityRows, updateSavedStatus, removeSavedItem } = useProductApp();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Tracker</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Saved Opportunity Pipeline</h2>
        <p className="mt-1 text-sm text-slate-300">
          Move opportunities through your workflow: saved, applying, and applied.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        {savedOpportunityRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
            No saved opportunities yet. Visit the Opportunities page and save your top matches.
          </p>
        ) : (
          <div className="space-y-3">
            {savedOpportunityRows.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.opportunity.title}</p>
                    <p className="text-xs text-slate-400">Deadline: {formatDate(item.opportunity.deadline)}</p>
                  </div>
                  <a
                    href={`/api/opportunities/open?id=${encodeURIComponent(item.opportunity.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  >
                    Open Link
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(event) => updateSavedStatus(item.id, event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-300/40 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSavedItem(item.id)}
                    className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-2 py-1.5 text-xs text-rose-200 transition hover:bg-rose-300/20"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
