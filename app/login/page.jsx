"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const gradeOptions = ["9", "10", "11", "12", "college"];

const initialForm = {
  email: "",
  password: "",
  name: "",
  grade: "11",
};

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(
    () => (isSignup ? "Create your LifeStack account" : "Welcome back to LifeStack"),
    [isSignup]
  );

  function handleChange(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignup
        ? {
            email: form.email,
            password: form.password,
            name: form.name,
            grade: form.grade,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Authentication failed.");
      }

      if (isSignup || data?.user?.profile?.onboardingComplete === false) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_90%_90%,rgba(20,184,166,0.14),transparent_35%),#f4f7fb] px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_45px_100px_-55px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <p className="mb-1 text-xs uppercase tracking-[0.22em] text-sky-600/80">LifeStack</p>
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">{title}</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup ? (
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Password</label>
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            />
          </div>

          {isSignup ? (
            <>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Grade</label>
                <select
                  value={form.grade}
                  onChange={(event) => handleChange("grade", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

            </>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignup((prev) => !prev);
            setError("");
          }}
          className="mt-4 text-sm text-sky-700 transition hover:text-sky-800"
        >
          {isSignup ? "Already have an account? Login" : "New user? Create an account"}
        </button>
      </div>
    </main>
  );
}
