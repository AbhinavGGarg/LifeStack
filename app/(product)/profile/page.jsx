"use client";

import { useProductApp } from "@/components/ProductAppProvider";

export default function ProfilePage() {
  const { user, tasks, completedTaskCount, savedItems, logout, loggingOut } = useProductApp();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{user.profile.name}</h2>
        <p className="mt-1 text-sm text-slate-300">{user.email}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
          <h3 className="text-lg font-semibold text-white">Student Context</h3>
          <p className="mt-3 text-sm text-slate-300">Grade: {user.profile.grade}</p>
          <p className="mt-3 text-sm font-medium text-slate-200">Interests</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300"
              >
                #{interest}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
          <h3 className="text-lg font-semibold text-white">Current Stats</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Total Tasks: {tasks.length}</p>
            <p>Completed Tasks: {completedTaskCount}</p>
            <p>Saved Opportunities: {savedItems.length}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="mt-5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300/35 hover:bg-rose-300/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
        <h3 className="text-lg font-semibold text-white">Goals</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{user.profile.goals}</p>
      </section>
    </div>
  );
}
