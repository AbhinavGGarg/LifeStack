"use client";

import { useEffect, useMemo, useState } from "react";
import { parseCoursesFromCsv } from "@/lib/gradeImport";

function toPoints(grade) {
  const value = Number(grade);

  if (!Number.isFinite(value)) return 0;
  if (value >= 97) return 4.0;
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

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function GradeTracker({ userId }) {
  const coursesStorageKey = `lifestack:${userId}:courses`;
  const portalStorageKey = `lifestack:${userId}:studentvuePortal`;
  const importMetaKey = `lifestack:${userId}:gradeImportMeta`;
  const csvUrlStorageKey = `lifestack:${userId}:gradeCsvUrl`;

  const [courses, setCourses] = useState(() => {
    if (typeof window === "undefined" || !userId) {
      return [];
    }

    try {
      const parsed = JSON.parse(localStorage.getItem(coursesStorageKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [studentVuePortal, setStudentVuePortal] = useState(() => {
    if (typeof window === "undefined" || !userId) {
      return "";
    }

    return String(localStorage.getItem(portalStorageKey) || "").trim();
  });
  const [csvUrl, setCsvUrl] = useState(() => {
    if (typeof window === "undefined" || !userId) {
      return "";
    }

    return String(localStorage.getItem(csvUrlStorageKey) || "").trim();
  });
  const [importStatus, setImportStatus] = useState("");
  const [importError, setImportError] = useState("");
  const [lastImportedAt, setLastImportedAt] = useState(() => {
    if (typeof window === "undefined" || !userId) {
      return "";
    }

    return String(localStorage.getItem(importMetaKey) || "").trim();
  });
  const [form, setForm] = useState({
    name: "",
    grade: "",
    target: "90",
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    localStorage.setItem(coursesStorageKey, JSON.stringify(courses));
  }, [courses, coursesStorageKey, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    localStorage.setItem(portalStorageKey, studentVuePortal);
  }, [portalStorageKey, studentVuePortal, userId]);

  useEffect(() => {
    if (!userId || !lastImportedAt) {
      return;
    }

    localStorage.setItem(importMetaKey, lastImportedAt);
  }, [importMetaKey, lastImportedAt, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    localStorage.setItem(csvUrlStorageKey, csvUrl);
  }, [csvUrl, csvUrlStorageKey, userId]);

  const currentAverage = useMemo(() => {
    const grades = courses
      .map((course) => Number(course.grade))
      .filter((grade) => Number.isFinite(grade));
    return average(grades);
  }, [courses]);

  const projectedGpa = useMemo(() => {
    const points = courses
      .map((course) => toPoints(course.grade))
      .filter((value) => Number.isFinite(value));
    return average(points);
  }, [courses]);

  function addCourse(event) {
    event.preventDefault();

    const name = String(form.name || "").trim();
    const grade = Number(form.grade);
    const target = Number(form.target);

    if (!name || !Number.isFinite(grade)) {
      return;
    }

    const nextCourse = {
      id: crypto.randomUUID(),
      name,
      grade: Math.max(0, Math.min(100, grade)),
      target: Number.isFinite(target) ? Math.max(0, Math.min(100, target)) : 90,
    };

    setCourses((previous) => [nextCourse, ...previous]);
    setForm({ name: "", grade: "", target: "90" });
  }

  function mergeImportedCourses(imported) {
    if (!Array.isArray(imported) || imported.length === 0) {
      return;
    }

    setCourses((previous) => {
      const byName = new Map(
        previous.map((course) => [String(course.name || "").trim().toLowerCase(), course])
      );

      imported.forEach((course) => {
        const key = String(course.name || "").trim().toLowerCase();

        if (!key) {
          return;
        }

        const existing = byName.get(key);
        byName.set(key, {
          id: existing?.id || crypto.randomUUID(),
          name: course.name,
          grade: Number(course.grade),
          target: Number(course.target),
        });
      });

      return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    });

    const timestamp = new Date().toISOString();
    setLastImportedAt(timestamp);
    setImportStatus(`Imported ${imported.length} courses successfully.`);
    setImportError("");
  }

  function importFromCsvText(csvText) {
    const parsed = parseCoursesFromCsv(csvText);

    if (parsed.length === 0) {
      setImportError(
        "No valid course rows found. Make sure CSV has course/class and grade columns."
      );
      setImportStatus("");
      return;
    }

    mergeImportedCourses(parsed);
  }

  async function handleCsvFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      importFromCsvText(text);
    } catch {
      setImportError("Unable to read CSV file.");
      setImportStatus("");
    } finally {
      event.target.value = "";
    }
  }

  async function handleCsvUrlImport() {
    if (!csvUrl.trim()) {
      setImportError("Paste a CSV export URL first.");
      setImportStatus("");
      return;
    }

    try {
      const response = await fetch(csvUrl, { method: "GET" });

      if (!response.ok) {
        throw new Error("Could not fetch CSV URL.");
      }

      const text = await response.text();
      importFromCsvText(text);
    } catch {
      setImportError(
        "Direct URL import failed. StudentVUE often blocks authenticated exports via browser CORS. Download CSV from StudentVUE and upload it below."
      );
      setImportStatus("");
    }
  }

  function removeCourse(courseId) {
    setCourses((previous) => previous.filter((course) => course.id !== courseId));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Academic Snapshot</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Grade Tracker</h3>
          <p className="mt-1 text-sm text-slate-600">
            GradeView-style tracker. Add your classes and monitor average + projected GPA.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">StudentVUE Portal</p>
          <p className="mt-1 text-xs text-slate-600">
            Add your StudentVUE link for quick access. Direct sync depends on district permissions.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="url"
              value={studentVuePortal}
              onChange={(event) => setStudentVuePortal(event.target.value)}
              placeholder="https://studentvue.yourschool.org"
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (studentVuePortal.trim()) {
                  window.open(studentVuePortal.trim(), "_blank", "noopener,noreferrer");
                }
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Open Portal
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">CSV Import</p>
          <p className="mt-1 text-xs text-slate-600">
            Upload exported grades CSV from StudentVUE, or import from a direct CSV URL.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="url"
              value={csvUrl}
              onChange={(event) => setCsvUrl(event.target.value)}
              placeholder="Optional: direct CSV export URL"
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCsvUrlImport}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Import URL
            </button>
          </div>
          {lastImportedAt ? (
            <p className="mt-2 text-xs text-slate-500">
              Last import: {new Date(lastImportedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>

      {importStatus ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {importStatus}
        </p>
      ) : null}
      {importError ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {importError}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current Average</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {courses.length === 0 ? "-" : `${currentAverage.toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Projected GPA</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {courses.length === 0 ? "-" : projectedGpa.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Courses Tracked</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{courses.length}</p>
        </div>
      </div>

      <form className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.6fr_auto]" onSubmit={addCourse}>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          placeholder="Course name (ex: AP Calculus BC)"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          max="100"
          value={form.grade}
          onChange={(event) => setForm((previous) => ({ ...previous, grade: event.target.value }))}
          placeholder="Current %"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          max="100"
          value={form.target}
          onChange={(event) => setForm((previous) => ({ ...previous, target: event.target.value }))}
          placeholder="Target %"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
        >
          Add
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {courses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            No courses yet. Add classes to track your progress.
          </p>
        ) : (
          courses.map((course) => {
            const delta = Number(course.target) - Number(course.grade);
            return (
              <div key={course.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{course.name}</p>
                  <p className="text-xs text-slate-600">
                    {course.grade}% current • {course.target}% target • GPA points {toPoints(course.grade).toFixed(1)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-xs font-medium ${delta <= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                    {delta <= 0 ? "On target" : `${delta.toFixed(0)}% to target`}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeCourse(course.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
