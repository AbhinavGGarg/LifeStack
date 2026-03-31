"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const quickActions = [
  {
    id: "signup",
    label: "Create Account",
    hint: "Start your LifeStack setup",
    type: "route",
    value: "/login?mode=signup",
  },
  {
    id: "login",
    label: "Log In",
    hint: "Return to your dashboard",
    type: "route",
    value: "/login",
  },
  {
    id: "features",
    label: "View Features",
    hint: "See what makes LifeStack different",
    type: "anchor",
    value: "features",
  },
  {
    id: "loop",
    label: "See Core Loop",
    hint: "Discover -> Save -> Track -> Apply",
    type: "anchor",
    value: "how-it-works",
  },
  {
    id: "trajectory",
    label: "Trajectory Preview",
    hint: "How progress and momentum are tracked",
    type: "anchor",
    value: "trajectory-preview",
  },
];

function isTypingTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    Boolean(target.isContentEditable)
  );
}

export default function LandingCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "/") {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const filteredActions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return quickActions;
    }

    return quickActions.filter((action) => {
      return (
        action.label.toLowerCase().includes(normalized) ||
        action.hint.toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  function runAction(action) {
    if (!action) return;

    if (action.type === "route") {
      router.push(action.value);
      setOpen(false);
      return;
    }

    const element = document.getElementById(action.value);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 py-20 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_35px_120px_-45px_rgba(15,23,42,0.5)]">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search actions (try: signup, features, loop)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300"
        />

        <div className="mt-2 max-h-[320px] space-y-1 overflow-auto">
          {filteredActions.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              No action found for that search.
            </p>
          ) : (
            filteredActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => runAction(action)}
                className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-600">{action.hint}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
