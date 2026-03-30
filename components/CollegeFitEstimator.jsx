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

function average(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values) {
  if (!Array.isArray(values) || values.length < 2) {
    return 0;
  }

  const mean = average(values);
  const sumSquares = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return sumSquares / values.length;
}

function toPoints(grade) {
  const value = Number(grade);

  if (!Number.isFinite(value)) return 0;
  if (value >= 93) return 4.0;
  if (value >= 90) return 3.7;
  if (value >= 87) return 3.3;
  if (value >= 83) return 3.0;
  if (value >= 80) return 2.7;
  if (value >= 77) return 2.3;
  if (value >= 73) return 2.0;
  if (value >= 70) return 1.7;
  if (value >= 67) return 1.3;
  if (value >= 65) return 1.0;
  return 0;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function getAccuracyMode(score) {
  if (score >= 80) {
    return "High";
  }
  if (score >= 55) {
    return "Medium";
  }
  return "Low";
}

export default function CollegeFitEstimator({ studentProfile }) {
  const [collegeInput, setCollegeInput] = useState("");
  const [selectedFit, setSelectedFit] = useState(null);
  const [error, setError] = useState("");

  const gradeContext = useMemo(() => {
    if (typeof window === "undefined" || !studentProfile?.id) {
      return {
        courses: [],
        hasPortal: false,
        lastImportedAt: "",
      };
    }

    const coursesStorageKey = `lifestack:${studentProfile.id}:courses`;
    const portalStorageKey = `lifestack:${studentProfile.id}:studentvuePortal`;
    const importMetaKey = `lifestack:${studentProfile.id}:gradeImportMeta`;

    let parsedCourses = [];

    try {
      const rawCourses = JSON.parse(localStorage.getItem(coursesStorageKey) || "[]");
      parsedCourses = Array.isArray(rawCourses)
        ? rawCourses
            .map((course) => ({
              name: String(course?.name || "").trim(),
              grade: Number(course?.grade),
            }))
            .filter((course) => course.name && Number.isFinite(course.grade))
        : [];
    } catch {
      parsedCourses = [];
    }

    const portal = String(localStorage.getItem(portalStorageKey) || "").trim();
    const importedAt = String(localStorage.getItem(importMetaKey) || "").trim();

    return {
      courses: parsedCourses,
      hasPortal: Boolean(portal),
      lastImportedAt: importedAt,
    };
  }, [studentProfile?.id]);

  const gradeSignals = useMemo(() => {
    const gradeValues = gradeContext.courses
      .map((course) => Number(course.grade))
      .filter((grade) => Number.isFinite(grade));
    const courseCount = gradeValues.length;
    const hasGrades = courseCount > 0;
    const hasProfileGpa = typeof studentProfile?.gpa === "number" && Number.isFinite(studentProfile.gpa);

    const averagePercent = hasGrades ? average(gradeValues) : null;
    const derivedGpa = hasGrades ? average(gradeValues.map((grade) => toPoints(grade))) : null;
    const gradeVariance = hasGrades ? variance(gradeValues) : 0;

    let blendedGpa = hasProfileGpa ? studentProfile.gpa : null;
    let gpaSource = hasProfileGpa ? "Profile GPA" : "No GPA data";

    if (hasGrades && derivedGpa !== null && hasProfileGpa) {
      blendedGpa = round(studentProfile.gpa * 0.4 + derivedGpa * 0.6, 2);
      gpaSource = "Blended (profile + imported grades)";
    } else if (hasGrades && derivedGpa !== null) {
      blendedGpa = round(derivedGpa, 2);
      gpaSource = "Imported grades";
    }

    let accuracyScore = 25;
    if (hasProfileGpa) accuracyScore += 25;
    if (hasGrades) accuracyScore += 30;
    if (gradeContext.hasPortal) accuracyScore += 12;
    if (gradeContext.lastImportedAt) accuracyScore += 8;
    if (courseCount >= 5) accuracyScore += 10;
    accuracyScore = Math.max(0, Math.min(100, accuracyScore));

    const accuracyMode = getAccuracyMode(accuracyScore);

    let accuracyHint = "Estimator is using profile context only.";
    if (hasGrades) {
      accuracyHint = "Estimator is using your imported class performance for stronger fit scoring.";
    } else if (gradeContext.hasPortal) {
      accuracyHint = "Portal saved. Import a CSV in Grades to unlock stronger college fit accuracy.";
    }

    return {
      hasGrades,
      hasPortal: gradeContext.hasPortal,
      averagePercent,
      derivedGpa,
      blendedGpa,
      gpaSource,
      courseCount,
      gradeVariance,
      lastImportedAt: gradeContext.lastImportedAt,
      accuracyScore,
      accuracyMode,
      accuracyHint,
    };
  }, [gradeContext, studentProfile]);

  const estimatorProfile = useMemo(() => {
    if (!studentProfile) {
      return null;
    }

    return {
      ...studentProfile,
      gpa: gradeSignals.blendedGpa,
      academicSignals: {
        hasGrades: gradeSignals.hasGrades,
        hasPortal: gradeSignals.hasPortal,
        courseCount: gradeSignals.courseCount,
        gradeVariance: gradeSignals.gradeVariance,
      },
    };
  }, [studentProfile, gradeSignals]);

  const recommendations = useMemo(() => {
    if (!estimatorProfile) {
      return [];
    }

    return recommendCollegeMatches(estimatorProfile, 5, {
      academicSignals: estimatorProfile.academicSignals,
    });
  }, [estimatorProfile]);

  function handleEstimate(event) {
    event.preventDefault();

    if (!collegeInput.trim()) {
      setError("Enter a college name to estimate fit.");
      setSelectedFit(null);
      return;
    }

    if (!estimatorProfile) {
      setError("Profile data is still loading. Try again in a moment.");
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
    setSelectedFit(
      estimateCollegeFit(estimatorProfile, college, {
        academicSignals: estimatorProfile.academicSignals,
      })
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">College Fit Estimator</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">Estimate Your Admission Readiness</h3>
      <p className="mt-1 text-sm text-slate-600">
        Uses your GPA, extracurricular depth, major alignment, and grade-tracker signals.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Prediction Accuracy</p>
          <p
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              gradeSignals.accuracyMode === "High"
                ? "bg-emerald-100 text-emerald-800"
                : gradeSignals.accuracyMode === "Medium"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700"
            }`}
          >
            {gradeSignals.accuracyMode} ({gradeSignals.accuracyScore}%)
          </p>
        </div>
        <p className="mt-2 text-sm text-slate-700">{gradeSignals.accuracyHint}</p>
        <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
          <p>GPA source: {gradeSignals.gpaSource}</p>
          <p>Courses synced: {gradeSignals.courseCount}</p>
          <p>
            Last import:{" "}
            {gradeSignals.lastImportedAt
              ? new Date(gradeSignals.lastImportedAt).toLocaleDateString()
              : "Not imported yet"}
          </p>
        </div>
      </div>

      {!gradeSignals.hasGrades ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Putting in your grade link will make this more accurate. Connect StudentVUE in the
          Grades tab (or upload CSV as fallback).
        </p>
      ) : null}

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
              <p className="mt-1 text-xs text-slate-600">
                Data confidence: {selectedFit.dataConfidence.level} ({selectedFit.dataConfidence.score}%)
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
