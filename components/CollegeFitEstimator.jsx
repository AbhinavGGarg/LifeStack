"use client";

import { useMemo, useState } from "react";
import { collegeBenchmarks } from "@/lib/collegeData";
import { estimateCollegeFit, getCollegeByName, recommendCollegeMatches } from "@/lib/collegeFit";

function ProgressRow({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-sky-500 transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

export default function CollegeFitEstimator({ studentProfile }) {
  const [collegeInput, setCollegeInput] = useState("");
  const [selectedFit, setSelectedFit] = useState(null);
  const [error, setError] = useState("");

  const recommendations = useMemo(() => {
    if (!studentProfile) {
      return [];
    }

    return recommendCollegeMatches(studentProfile, 5);
  }, [studentProfile]);

  function handleEstimate(event) {
    event.preventDefault();

    if (!collegeInput.trim()) {
      setError("Enter a college name to estimate fit.");
      setSelectedFit(null);
      return;
    }

    const college = getCollegeByName(collegeInput);

    if (!college) {
      setError("College not found in current dataset yet. Try one from the suggestions list.");
      setSelectedFit(null);
      return;
    }

    setError("");
    setSelectedFit(estimateCollegeFit(studentProfile, college));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">College Fit Estimator</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">Estimate Your Admission Readiness</h3>
      <p className="mt-1 text-sm text-slate-600">
        Uses your GPA, extracurricular depth, and profile alignment against college benchmarks.
      </p>

      <form className="mt-4 flex flex-wrap gap-2" onSubmit={handleEstimate}>
        <input
          type="text"
          value={collegeInput}
          onChange={(event) => setCollegeInput(event.target.value)}
          list="college-benchmarks"
          placeholder="Type a college name (ex: Stanford University)"
          className="min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
        />
        <datalist id="college-benchmarks">
          {collegeBenchmarks.map((college) => (
            <option key={college.id} value={college.name} />
          ))}
        </datalist>
        <button
          type="submit"
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
        >
          Estimate Fit
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {selectedFit ? (
        <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{selectedFit.college.name}</p>
              <p className="mt-1 text-xs text-slate-600">
                Acceptance rate: ~{selectedFit.college.acceptanceRate}% • Competitive GPA: {selectedFit.college.gpaCompetitive.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-semibold text-sky-800">
              {selectedFit.fitScore}/100 • {selectedFit.band}
            </div>
          </div>

          <p className="text-sm text-slate-700">{selectedFit.summary}</p>

          <div className="space-y-3">
            <ProgressRow label="GPA Readiness" value={selectedFit.breakdown.gpa} />
            <ProgressRow label="Extracurricular Depth" value={selectedFit.breakdown.ec} />
            <ProgressRow label="Profile Alignment" value={selectedFit.breakdown.alignment} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How To Improve</p>
            <div className="mt-2 space-y-2">
              {selectedFit.suggestions.map((tip) => (
                <p key={tip} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Colleges For Current Profile</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((entry) => (
            <button
              key={entry.college.id}
              type="button"
              onClick={() => {
                setCollegeInput(entry.college.name);
                setSelectedFit(entry);
                setError("");
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
            >
              <p className="text-sm font-medium text-slate-900">{entry.college.name}</p>
              <p className="text-xs text-slate-600">{entry.fitScore}/100 • {entry.band}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        This is an estimate for planning, not an official admission probability.
      </p>
    </section>
  );
}
