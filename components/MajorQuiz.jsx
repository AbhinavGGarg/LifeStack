"use client";

import { useMemo, useState } from "react";
import {
  MAJOR_QUIZ_QUESTIONS,
  recommendMajorFromQuizAnswers,
  getMajorTrack,
} from "@/lib/majorGuidance";

export default function MajorQuiz({
  onResult,
  onUseRecommendation,
  compact = false,
}) {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const unansweredCount = useMemo(() => {
    return MAJOR_QUIZ_QUESTIONS.filter((question) => !answers[question.id]).length;
  }, [answers]);

  function handleRecommend() {
    if (unansweredCount > 0) {
      setError("Answer all quiz questions to get a recommendation.");
      return;
    }

    setError("");
    const recommendation = recommendMajorFromQuizAnswers(answers);
    setResult(recommendation);
    onResult?.(recommendation);
  }

  const containerClass = compact
    ? "rounded-xl border border-slate-200 bg-slate-50 p-3"
    : "rounded-2xl border border-slate-200 bg-white p-5";

  return (
    <section className={containerClass}>
      <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Major Quiz</p>
      <p className="mt-1 text-sm text-slate-600">
        If you&apos;re undecided, answer these to see your likely-fit major path.
      </p>

      <div className="mt-3 space-y-3">
        {MAJOR_QUIZ_QUESTIONS.map((question) => (
          <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">{question.prompt}</p>
            <div className="mt-2 space-y-1.5">
              {question.options.map((option) => (
                <label key={option.id} className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option.id}
                    onChange={() =>
                      setAnswers((previous) => ({
                        ...previous,
                        [question.id]: option.id,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 border-slate-300 accent-sky-500"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={handleRecommend}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Get Major Recommendation
        </button>
      </div>

      {result ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-800">
            Recommended major: {result.label}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Confidence: {result.confidence}
          </p>

          <div className="mt-2 text-xs text-emerald-700">
            <p className="font-medium">Suggested classes:</p>
            <p>{getMajorTrack(result.major).classes.slice(0, 3).join(" • ")}</p>
          </div>

          {onUseRecommendation ? (
            <button
              type="button"
              onClick={() => onUseRecommendation(result)}
              className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Use This Major
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
