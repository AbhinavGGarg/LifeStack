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

export default function OpportunityCard({
  opportunity,
  insight,
  isSaved,
  onSave,
}) {
  const openHref = `/api/opportunities/open?id=${encodeURIComponent(opportunity.id)}`;

  return (
    <article className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-slate-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[10px] uppercase tracking-widest text-cyan-200">
            {opportunity.category}
          </span>
          <h3 className="mt-2 text-base font-semibold text-white">{opportunity.title}</h3>
        </div>
        <span className="text-xs text-slate-400">{formatDeadline(opportunity.deadline)}</span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-slate-300">{opportunity.description}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {opportunity.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      {opportunity.recommendedAction ? (
        <p className="mb-3 inline-flex rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-medium text-emerald-200">
          Recommended: {opportunity.recommendedAction}
        </p>
      ) : null}

      <p className="mb-4 text-xs text-slate-400">{insight || "Finding a personalized recommendation..."}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaved}
          className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {isSaved ? "Saved" : "Save"}
        </button>

        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
        >
          Open Link
        </a>
      </div>
    </article>
  );
}
