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
  const [gpaInput, setGpaInput] = useState(
    user.profile.gpa === null || user.profile.gpa === undefined
      ? ""
      : String(user.profile.gpa)
  );
  const [activityHoursInput, setActivityHoursInput] = useState(
    user.profile.activityHours === null || user.profile.activityHours === undefined
      ? ""
      : String(user.profile.activityHours)
  );
  const [extracurricularsInput, setExtracurricularsInput] = useState(
    Array.isArray(user.profile.extracurriculars)
      ? user.profile.extracurriculars.join(", ")
      : ""
  );
  const [intendedMajorInput, setIntendedMajorInput] = useState(
    user.profile.intendedMajor || ""
  );
  const [targetRoleInput, setTargetRoleInput] = useState(user.profile.targetRole || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setInterestsInput(user.profile.interests.join(", "));
    setGoalsInput(user.profile.goals);
    setGpaInput(
      user.profile.gpa === null || user.profile.gpa === undefined
        ? ""
        : String(user.profile.gpa)
    );
    setActivityHoursInput(
      user.profile.activityHours === null || user.profile.activityHours === undefined
        ? ""
        : String(user.profile.activityHours)
    );
    setExtracurricularsInput(
      Array.isArray(user.profile.extracurriculars)
        ? user.profile.extracurriculars.join(", ")
        : ""
    );
    setIntendedMajorInput(user.profile.intendedMajor || "");
    setTargetRoleInput(user.profile.targetRole || "");
  }, [
    user.profile.extracurriculars,
    user.profile.activityHours,
    user.profile.goals,
    user.profile.gpa,
    user.profile.interests,
    user.profile.intendedMajor,
    user.profile.targetRole,
  ]);

  async function handleSaveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile({
        interests: interestsInput,
        goals: goalsInput,
        gpa: gpaInput === "" ? null : Number(gpaInput),
        activityHours: activityHoursInput === "" ? null : Number(activityHoursInput),
        extracurriculars: extracurricularsInput,
        intendedMajor: intendedMajorInput,
        targetRole: targetRoleInput,
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{user.profile.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{user.email}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <h3 className="text-lg font-semibold text-slate-900">Student Context</h3>
          <p className="mt-3 text-sm text-slate-600">Grade: {user.profile.grade}</p>

          <label className="mt-4 block text-sm font-medium text-slate-800">Interests</label>
          <p className="mt-1 text-xs text-slate-500">Comma-separated, like: ai, biology, business</p>
          <input
            type="text"
            value={interestsInput}
            onChange={(event) => setInterestsInput(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-800">
              <span className="block text-sm font-medium">GPA (0.0 - 4.0)</span>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={gpaInput}
                onChange={(event) => setGpaInput(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="text-sm text-slate-800">
              <span className="block text-sm font-medium">Extracurricular Hours / Week</span>
              <input
                type="number"
                min="0"
                max="80"
                step="1"
                value={activityHoursInput}
                onChange={(event) => setActivityHoursInput(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Include clubs, volunteering, competitions, leadership, and project-building hours.
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-800">Extracurriculars</label>
          <textarea
            value={extracurricularsInput}
            onChange={(event) => setExtracurricularsInput(event.target.value)}
            rows={3}
            placeholder="Robotics Club, DECA, Hospital volunteer"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-800">
              <span className="block text-sm font-medium">Intended Major</span>
              <input
                type="text"
                value={intendedMajorInput}
                onChange={(event) => setIntendedMajorInput(event.target.value)}
                placeholder="Computer Science"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="text-sm text-slate-800">
              <span className="block text-sm font-medium">Target Career Direction</span>
              <input
                type="text"
                value={targetRoleInput}
                onChange={(event) => setTargetRoleInput(event.target.value)}
                placeholder="ML Engineer, Product Manager"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <h3 className="text-lg font-semibold text-slate-900">Current Stats</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Total Tasks: {tasks.length}</p>
            <p>Completed Tasks: {completedTaskCount}</p>
            <p>Saved Opportunities: {savedItems.length}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <h3 className="text-lg font-semibold text-slate-900">Goals</h3>
        <textarea
          value={goalsInput}
          onChange={(event) => setGoalsInput(event.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
        />

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </section>
    </div>
  );
}
