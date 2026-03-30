function formatDeadline(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "No deadline";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCategory(category) {
  return String(category || "")
    .replace(/-/g, " ")
    .trim();
}

export default function OpportunityCard({
  opportunity,
  insight,
  isSaved,
  onSave,
}) {
  const openHref = `/api/opportunities/open?id=${encodeURIComponent(opportunity.id)}`;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] uppercase tracking-widest text-sky-700">
            {formatCategory(opportunity.category)}
          </span>
          <h3 className="mt-2 text-base font-semibold text-slate-900">{opportunity.title}</h3>
        </div>
        <span className="text-xs text-slate-500">{formatDeadline(opportunity.deadline)}</span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-slate-600">{opportunity.description}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {opportunity.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
          >
            #{tag}
          </span>
        ))}
      </div>

      {Array.isArray(opportunity.majorMatchingTags) && opportunity.majorMatchingTags.length > 0 ? (
        <p className="mb-3 inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
          Major fit: {opportunity.majorMatchingTags.slice(0, 3).map((tag) => `#${tag}`).join(" ")}
        </p>
      ) : null}

      {opportunity.recommendedAction ? (
        <p className="mb-3 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
          Recommended: {opportunity.recommendedAction}
        </p>
      ) : null}

      <p className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
        Match score: {opportunity.matchScore}
      </p>

      <p className="mb-4 text-xs text-slate-500">{insight || "Finding a personalized recommendation..."}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaved}
          className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSaved ? "Saved" : "Save"}
        </button>

        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
        >
          Open Link
        </a>
      </div>
    </article>
  );
}
