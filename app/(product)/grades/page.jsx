"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductApp } from "@/components/ProductAppProvider";

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GradesPage() {
  const { user, gradesSnapshot, saveGradesSnapshot, clearGradesSnapshot } = useProductApp();
  const [portalUrl, setPortalUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const storageKey = useMemo(
    () => (user?.id ? `lifestack:${user.id}:grades:connector` : null),
    [user?.id]
  );

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.portalUrl) {
        setPortalUrl(String(parsed.portalUrl));
      }
      if (parsed?.username) {
        setUsername(String(parsed.username));
      }
    } catch {
      // no-op
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        portalUrl: portalUrl.trim(),
        username: username.trim(),
      })
    );
  }, [portalUrl, storageKey, username]);

  async function handleSync(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setSyncing(true);

    try {
      const response = await fetch("/api/grades/studentvue/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalUrl: portalUrl.trim(),
          username: username.trim(),
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to sync grades.");
      }

      saveGradesSnapshot({
        ...payload.snapshot,
        source: "studentvue",
      });
      setPassword("");
      setStatus("Grades synced successfully.");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unable to sync grades.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Grades</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">StudentVUE Grade Sync</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect your StudentVUE portal to pull current classes and grade percentages into LifeStack.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <form onSubmit={handleSync} className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-600 md:col-span-2">
            StudentVUE Portal URL
            <input
              type="url"
              value={portalUrl}
              onChange={(event) => setPortalUrl(event.target.value)}
              placeholder="https://ca-pleas-psv.edupoint.com/PXP2_Login_Student.aspx"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-600">
            StudentVUE Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Student username"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
            />
          </label>

          <label className="text-xs text-slate-600">
            StudentVUE Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Student password"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={syncing || !portalUrl.trim() || !username.trim() || !password.trim()}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Syncing..." : "Pull Grades"}
            </button>
            <button
              type="button"
              onClick={clearGradesSnapshot}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Snapshot
            </button>
          </div>

          <p className="md:col-span-2 text-xs text-slate-500">
            Credentials are used only for this sync request and are not stored in LifeStack.
          </p>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {status}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Courses</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {gradesSnapshot?.summary?.courseCount || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Average %</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {Number.isFinite(gradesSnapshot?.summary?.averagePercent)
                ? `${gradesSnapshot.summary.averagePercent}%`
                : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Last Synced</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {gradesSnapshot?.syncedAt ? formatDateTime(gradesSnapshot.syncedAt) : "Not synced yet"}
            </p>
          </div>
        </div>

        {!gradesSnapshot?.courses?.length ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No grade snapshot yet. Connect StudentVUE above and click Pull Grades.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Course</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium">Teacher</th>
                  <th className="px-3 py-2 font-medium">Grade</th>
                  <th className="px-3 py-2 font-medium">Percent</th>
                </tr>
              </thead>
              <tbody>
                {gradesSnapshot.courses.map((course) => (
                  <tr key={course.id} className="border-t border-slate-200 text-slate-800">
                    <td className="px-3 py-2">{course.name}</td>
                    <td className="px-3 py-2">{course.period || "-"}</td>
                    <td className="px-3 py-2">{course.teacher || "-"}</td>
                    <td className="px-3 py-2">{course.letterGrade || "-"}</td>
                    <td className="px-3 py-2">
                      {Number.isFinite(course.percent) ? `${course.percent}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
