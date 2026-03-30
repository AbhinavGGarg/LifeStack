"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MajorQuiz from "@/components/MajorQuiz";
import { useProductApp } from "@/components/ProductAppProvider";
import {
  MAJOR_SEARCH_OPTIONS,
  formatMajorInputValue,
  getMajorLabel,
  getMajorTrack,
  isUndecidedMajor,
  resolveMajor,
} from "@/lib/majorGuidance";
const MAJOR_DATALIST_ID = "major-options-profile";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    tasks,
    completedTaskCount,
    savedItems,
    goalPlans,
    executionScore,
    streakDays,
    totalFocusMinutes,
    focusMinutesWeek,
    preferences,
    updatePreferences,
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
    formatMajorInputValue(user.profile.intendedMajor)
  );
  const [majorRecommendationInput, setMajorRecommendationInput] = useState(
    user.profile.majorRecommendation || ""
  );
  const [targetRoleInput, setTargetRoleInput] = useState(user.profile.targetRole || "");
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");

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
    setIntendedMajorInput(formatMajorInputValue(user.profile.intendedMajor));
    setMajorRecommendationInput(user.profile.majorRecommendation || "");
    setTargetRoleInput(user.profile.targetRole || "");
  }, [
    user.profile.extracurriculars,
    user.profile.activityHours,
    user.profile.goals,
    user.profile.gpa,
    user.profile.interests,
    user.profile.intendedMajor,
    user.profile.majorRecommendation,
    user.profile.targetRole,
  ]);

  const activeMajorKey = useMemo(
    () => resolveMajor(intendedMajorInput, majorRecommendationInput),
    [intendedMajorInput, majorRecommendationInput]
  );
  const activeMajorLabel = useMemo(() => getMajorLabel(activeMajorKey), [activeMajorKey]);
  const majorTrack = useMemo(
    () => getMajorTrack(intendedMajorInput, majorRecommendationInput),
    [intendedMajorInput, majorRecommendationInput]
  );

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
        majorRecommendation:
          isUndecidedMajor(intendedMajorInput) ? majorRecommendationInput : "",
        targetRole: targetRoleInput,
      });
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmInput.trim() !== "DELETE") {
      setDeleteError("Type DELETE to confirm account deletion.");
      return;
    }

    const confirmed = window.confirm(
      "Delete your LifeStack account permanently? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete account.");
      }

      if (user?.id) {
        localStorage.removeItem(`lifestack:${user.id}:tasks`);
        localStorage.removeItem(`lifestack:${user.id}:saved`);
        localStorage.removeItem(`lifestack:${user.id}:focusSessions`);
        localStorage.removeItem(`lifestack:${user.id}:goalPlans`);
        localStorage.removeItem(`lifestack:${user.id}:reflections`);
        localStorage.removeItem(`lifestack:${user.id}:preferences`);
      }

      router.replace("/login");
    } catch (deleteAccountError) {
      setDeleteError(deleteAccountError.message || "Unable to delete account.");
    } finally {
      setDeletingAccount(false);
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
                list={MAJOR_DATALIST_ID}
                value={intendedMajorInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setIntendedMajorInput(nextValue);
                  if (!isUndecidedMajor(nextValue)) {
                    setMajorRecommendationInput("");
                  }
                }}
                placeholder="Type to search majors (e.g. Public Policy)"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
              <datalist id={MAJOR_DATALIST_ID}>
                {MAJOR_SEARCH_OPTIONS.map((majorLabel) => (
                  <option key={majorLabel} value={majorLabel} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">
                Search from many majors or type your own.
              </p>
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

          {isUndecidedMajor(intendedMajorInput) ? (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Undecided Support</p>
              <p className="text-xs text-slate-600">
                Take the major quiz and save a recommendation so LifeStack can personalize your path.
              </p>
              <MajorQuiz
                compact
                onUseRecommendation={(result) => {
                  setMajorRecommendationInput(result.major);
                  setSuccess(`Saved recommendation: ${result.label}`);
                }}
              />
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Current recommendation:{" "}
                {majorRecommendationInput
                  ? getMajorLabel(majorRecommendationInput)
                  : "Not set yet"}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Major Guidance</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{activeMajorLabel} Path</p>
            <p className="mt-1 text-xs text-slate-600">{majorTrack.description}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Suggested Classes
                </p>
                <p className="mt-1 text-xs text-slate-700">{majorTrack.classes.join(" • ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  College Targets
                </p>
                <p className="mt-1 text-xs text-slate-700">{majorTrack.colleges.join(" • ")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <h3 className="text-lg font-semibold text-slate-900">Execution Stats</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Total Tasks: {tasks.length}</p>
            <p>Completed Tasks: {completedTaskCount}</p>
            <p>Saved Opportunities: {savedItems.length}</p>
            <p>Active Goals: {goalPlans.length}</p>
            <p>Execution Score: {executionScore}</p>
            <p>Streak: {streakDays} days</p>
            <p>Focus Time (All): {Math.round(totalFocusMinutes / 60)}h</p>
            <p>Focus This Week: {focusMinutesWeek} min</p>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <h3 className="text-lg font-semibold text-slate-900">Preferences</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { key: "dailyReminder", label: "Daily reminders" },
            { key: "weeklySummary", label: "Weekly summary nudges" },
            { key: "motivationalNudges", label: "Motivational prompts" },
            { key: "compactCards", label: "Compact dashboard cards" },
          ].map((item) => (
            <label
              key={item.key}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={Boolean(preferences[item.key])}
                onChange={(event) =>
                  updatePreferences({
                    [item.key]: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 accent-sky-500"
              />
              {item.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <h3 className="text-lg font-semibold text-slate-900">Saved Opportunities Snapshot</h3>
        {savedItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No opportunities saved yet. Head to Opportunities and start your pipeline.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Total saved: {savedItems.length}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Ready to apply: {savedItems.filter((item) => item.status === "saved").length}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Applied: {savedItems.filter((item) => item.status === "applied").length}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.35)]">
        <h3 className="text-lg font-semibold text-rose-800">Danger Zone</h3>
        <p className="mt-2 text-sm text-rose-700">
          Delete your account and profile data permanently.
        </p>

        <label className="mt-3 block text-sm font-medium text-rose-800">
          Type <span className="font-semibold">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={deleteConfirmInput}
          onChange={(event) => setDeleteConfirmInput(event.target.value)}
          className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-rose-300 focus:outline-none"
        />

        {deleteError ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700">
            {deleteError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deletingAccount || deleteConfirmInput.trim() !== "DELETE"}
          className="mt-4 rounded-xl border border-rose-300 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deletingAccount ? "Deleting account..." : "Delete Account"}
        </button>
      </section>
    </div>
  );
}
