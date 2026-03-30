"use client";

import { useEffect, useMemo, useState } from "react";

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
  const storageKey = `lifestack:${userId}:courses`;

  const [courses, setCourses] = useState(() => {
    if (typeof window === "undefined" || !userId) {
      return [];
    }

    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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

    localStorage.setItem(storageKey, JSON.stringify(courses));
  }, [courses, storageKey, userId]);

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
