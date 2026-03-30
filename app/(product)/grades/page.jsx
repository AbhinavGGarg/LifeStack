"use client";

import GradeTracker from "@/components/GradeTracker";
import { useProductApp } from "@/components/ProductAppProvider";

export default function GradesPage() {
  const { studentProfile } = useProductApp();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Grades</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Academic Performance Hub</h2>
        <p className="mt-1 text-sm text-slate-600">
          Keep grades separate from task execution. Import your classes from CSV and track progress by course.
        </p>
      </section>

      <GradeTracker key={studentProfile?.id || "student"} userId={studentProfile?.id} />
    </div>
  );
}
