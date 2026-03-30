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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Tracker</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Saved Opportunity Pipeline</h2>
        <p className="mt-1 text-sm text-slate-600">
          Move opportunities through your workflow: saved, applying, and applied.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        {savedOpportunityRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No saved opportunities yet. Visit the Opportunities page and save your top matches.
          </p>
        ) : (
          <div className="space-y-3">
            {savedOpportunityRows.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.opportunity.title}</p>
                    <p className="text-xs text-slate-500">Deadline: {formatDate(item.opportunity.deadline)}</p>
                  </div>
                  <a
                    href={`/api/opportunities/open?id=${encodeURIComponent(item.opportunity.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    Open Link
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(event) => updateSavedStatus(item.id, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
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
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 transition hover:bg-rose-100"
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
