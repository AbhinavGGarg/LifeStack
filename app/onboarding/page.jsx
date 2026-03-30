"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MajorQuiz from "@/components/MajorQuiz";
import { MAJOR_OPTIONS, getMajorLabel } from "@/lib/majorGuidance";

const initialForm = {
  gpa: "",
  activityHours: "",
  extracurriculars: "",
  intendedMajor: "",
  majorRecommendation: "",
  targetRole: "",
};

function toCsv(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.join(", ");
}

export default function OnboardingPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [quizResult, setQuizResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrateUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();
        const nextUser = data?.user;

        if (!nextUser) {
          router.replace("/login");
          return;
        }

        if (nextUser?.profile?.onboardingComplete !== false) {
          router.replace("/dashboard");
          return;
        }

        if (!active) {
          return;
        }

        setUser(nextUser);
        setForm({
          gpa:
            nextUser.profile.gpa === null || nextUser.profile.gpa === undefined
              ? ""
              : String(nextUser.profile.gpa),
          activityHours:
            nextUser.profile.activityHours === null ||
            nextUser.profile.activityHours === undefined
              ? ""
              : String(nextUser.profile.activityHours),
          extracurriculars: toCsv(nextUser.profile.extracurriculars),
          intendedMajor: nextUser.profile.intendedMajor || "",
          majorRecommendation: nextUser.profile.majorRecommendation || "",
          targetRole: nextUser.profile.targetRole || "",
        });
      } catch {
        router.replace("/login");
      } finally {
        if (active) {
          setLoadingUser(false);
        }
      }
    }

    hydrateUser();

    return () => {
      active = false;
    };
  }, [router]);

  function handleChange(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleMajorChange(value) {
    setForm((previous) => ({
      ...previous,
      intendedMajor: value,
      majorRecommendation: value === "undecided" ? previous.majorRecommendation : "",
    }));
  }

  async function handleComplete(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!form.intendedMajor) {
        throw new Error("Select your intended major.");
      }

      if (form.intendedMajor === "undecided" && !form.majorRecommendation) {
        throw new Error("Take the major quiz to get a recommendation, or choose a major.");
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpa: form.gpa === "" ? null : Number(form.gpa),
          activityHours: form.activityHours === "" ? null : Number(form.activityHours),
          extracurriculars: form.extracurriculars,
          intendedMajor: form.intendedMajor,
          majorRecommendation:
            form.intendedMajor === "undecided" ? form.majorRecommendation : "",
          targetRole: form.targetRole,
          onboardingComplete: true,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to complete onboarding.");
      }

      setStep(3);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (submitError) {
      setError(submitError.message || "Unable to complete onboarding.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="animate-pulse text-sm tracking-wide">Preparing your onboarding...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(20,184,166,0.12),transparent_35%),#f4f7fb] px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_45px_100px_-55px_rgba(15,23,42,0.35)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-sky-600/80">LifeStack Onboarding</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {step === 1
                ? `Hello ${user.profile.name}, welcome to LifeStack`
                : step === 2
                  ? "Build your student profile"
                  : `Welcome, ${user.profile.name}`}
            </h1>
          </div>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            Step {step} of 3
          </p>
        </div>

        {step === 1 ? (
          <section className="space-y-5">
            <p className="text-sm leading-relaxed text-slate-600">
              LifeStack helps you run your student journey like a system: discover opportunities,
              track progress, and take action before deadlines.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Discover</p>
                <p className="mt-1 text-sm font-medium text-slate-800">Find relevant programs</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Track</p>
                <p className="mt-1 text-sm font-medium text-slate-800">Organize tasks and status</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Apply</p>
                <p className="mt-1 text-sm font-medium text-slate-800">Move from saved to applied</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Next
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <form className="space-y-4" onSubmit={handleComplete}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">GPA</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  value={form.gpa}
                  onChange={(event) => handleChange("gpa", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
                />
              </label>

              <label className="text-sm text-slate-700">
                <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                  Extracurricular Hours / Week
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  max="80"
                  step="1"
                  value={form.activityHours}
                  onChange={(event) => handleChange("activityHours", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Current ECs (comma or line separated)
              </span>
              <textarea
                required
                value={form.extracurriculars}
                onChange={(event) => handleChange("extracurriculars", event.target.value)}
                rows={3}
                placeholder="Robotics Club, DECA, Volunteer tutoring"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Intended Major</span>
              <select
                required
                value={form.intendedMajor}
                onChange={(event) => handleMajorChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              >
                <option value="">Select your intended major</option>
                {MAJOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {form.intendedMajor === "undecided" ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">
                  Not sure yet is normal. Take this quiz to get your most likely-fit major direction.
                </p>
                <MajorQuiz
                  compact
                  onResult={(result) => setQuizResult(result)}
                  onUseRecommendation={(result) =>
                    setForm((previous) => ({
                      ...previous,
                      majorRecommendation: result.major,
                    }))
                  }
                />
                {form.majorRecommendation ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Current recommendation: {getMajorLabel(form.majorRecommendation)}
                  </p>
                ) : null}
                {quizResult && !form.majorRecommendation ? (
                  <p className="text-xs text-slate-600">
                    Recommendation ready: {quizResult.label}. Click{" "}
                    <span className="font-medium">Use This Major</span> to save it.
                  </p>
                ) : null}
              </div>
            ) : null}

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                Target Career Direction
              </span>
              <input
                type="text"
                value={form.targetRole}
                onChange={(event) => handleChange("targetRole", event.target.value)}
                placeholder="Product Manager, ML Engineer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-800">
              Welcome {user.profile.name}. Your LifeStack is ready.
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Taking you to your dashboard now.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
