"use client";

import { useEffect, useState } from "react";
import { useProductApp } from "@/components/ProductAppProvider";

export default function ProfilePage() {
  const {
    user,
    tasks,
    completedTaskCount,
    savedItems,
    updateProfile,
    logout,
    loggingOut,
  } = useProductApp();

  const [interestsInput, setInterestsInput] = useState(user.profile.interests.join(", "));
  const [goalsInput, setGoalsInput] = useState(user.profile.goals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setInterestsInput(user.profile.interests.join(", "));
    setGoalsInput(user.profile.goals);
  }, [user.profile.goals, user.profile.interests]);

  async function handleSaveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({
        interests: interestsInput,
        goals: goalsInput,
      });
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

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

          <label className="mt-4 block text-sm font-medium text-slate-200">Interests</label>
          <p className="mt-1 text-xs text-slate-400">Comma-separated, like: ai, biology, business</p>
          <input
            type="text"
            value={interestsInput}
            onChange={(event) => setInterestsInput(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-300/40 focus:outline-none"
          />
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
        <textarea
          value={goalsInput}
          onChange={(event) => setGoalsInput(event.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-300/40 focus:outline-none"
        />

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </section>
    </div>
  );
}
