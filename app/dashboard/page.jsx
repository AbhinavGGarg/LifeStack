"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import OpportunityCard from "@/components/OpportunityCard";
import TaskList from "@/components/TaskList";
import { opportunities } from "@/lib/data";
import { matchOpportunities } from "@/lib/matchingAlgorithm";

const STATUS_OPTIONS = ["saved", "applying", "applied"];

function formatDate(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [insights, setInsights] = useState({});

  const studentProfile = useMemo(() => {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.profile.name,
      grade: user.profile.grade,
      interests: user.profile.interests,
      goals: user.profile.goals,
    };
  }, [user]);

  const matched = useMemo(() => {
    if (!studentProfile) {
      return [];
    }

    return matchOpportunities(studentProfile, opportunities);
  }, [studentProfile]);

  const shownOpportunities = useMemo(() => matched.slice(0, 8), [matched]);

  const opportunityMap = useMemo(() => {
    return opportunities.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, []);

  const matchedMap = useMemo(() => {
    return matched.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [matched]);

  const savedOpportunityRows = useMemo(() => {
    return savedItems
      .map((item) => {
        const matchedItem = matchedMap[item.opportunityId];
        const base = matchedItem || opportunityMap[item.opportunityId];

        if (!base) {
          return null;
        }

        return {
          ...item,
          opportunity: base,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [savedItems, matchedMap, opportunityMap]);

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

        if (active) {
          setUser(data.user);
        }
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

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    const tasksKey = `lifestack:${studentProfile.id}:tasks`;
    const savedKey = `lifestack:${studentProfile.id}:saved`;

    const storedTasks = localStorage.getItem(tasksKey);
    const storedSaved = localStorage.getItem(savedKey);

    setTasks(storedTasks ? JSON.parse(storedTasks) : []);
    setSavedItems(storedSaved ? JSON.parse(storedSaved) : []);
  }, [studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    const tasksKey = `lifestack:${studentProfile.id}:tasks`;
    localStorage.setItem(tasksKey, JSON.stringify(tasks));
  }, [tasks, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    const savedKey = `lifestack:${studentProfile.id}:saved`;
    localStorage.setItem(savedKey, JSON.stringify(savedItems));
  }, [savedItems, studentProfile]);

  useEffect(() => {
    if (!studentProfile || shownOpportunities.length === 0) {
      return;
    }

    const pending = shownOpportunities.filter((item) => !insights[item.id]);

    if (pending.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadInsights() {
      const responses = await Promise.all(
        pending.map(async (opportunity) => {
          try {
            const response = await fetch("/api/recommendation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user: {
                  interests: studentProfile.interests,
                  goals: studentProfile.goals,
                },
                opportunity,
              }),
            });

            const payload = await response.json();
            return [opportunity.id, payload?.recommendation || "Great fit for your profile."];
          } catch {
            return [opportunity.id, "This opportunity aligns with your profile and can move your goals forward."];
          }
        })
      );

      if (!cancelled) {
        setInsights((previous) => {
          const next = { ...previous };
          responses.forEach(([id, message]) => {
            next[id] = message;
          });
          return next;
        });
      }
    }

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, [shownOpportunities, studentProfile, insights]);

  function addTask(title) {
    setTasks((previous) => [
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]);
  }

  function toggleTask(taskId) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  }

  function deleteTask(taskId) {
    setTasks((previous) => previous.filter((task) => task.id !== taskId));
  }

  function saveOpportunity(opportunityId) {
    setSavedItems((previous) => {
      const exists = previous.some((item) => item.opportunityId === opportunityId);
      if (exists) {
        return previous;
      }

      return [
        {
          id: crypto.randomUUID(),
          opportunityId,
          status: "saved",
          savedAt: new Date().toISOString(),
        },
        ...previous,
      ];
    });
  }

  function updateSavedStatus(itemId, status) {
    setSavedItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
            }
          : item
      )
    );
  }

  function removeSavedItem(itemId) {
    setSavedItems((previous) => previous.filter((item) => item.id !== itemId));
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p className="animate-pulse text-sm tracking-wide">Loading your LifeStack...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(45,212,191,0.16),transparent_26%),#020617] pb-10">
      <Navbar user={user} onLogout={handleLogout} isLoggingOut={loggingOut} />

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 pt-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <TaskList
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_80px_-40px_rgba(45,212,191,0.8)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-300/70">Opportunities For You</p>
                <h2 className="text-xl font-semibold text-white">Best next moves</h2>
              </div>
              <p className="text-xs text-slate-400">Top {shownOpportunities.length} matches</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {shownOpportunities.map((opportunity) => {
                const isSaved = savedItems.some((item) => item.opportunityId === opportunity.id);

                return (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    insight={insights[opportunity.id]}
                    isSaved={isSaved}
                    onSave={() => saveOpportunity(opportunity.id)}
                  />
                );
              })}
            </div>
          </section>
        </div>

        <section className="h-fit rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_80px_-45px_rgba(56,189,248,0.8)]">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Saved Opportunities</p>
            <h2 className="text-xl font-semibold text-white">Application tracker</h2>
          </div>

          <div className="space-y-3">
            {savedOpportunityRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                Save opportunities to track your application pipeline.
              </p>
            ) : null}

            {savedOpportunityRows.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.opportunity.title}</p>
                    <p className="text-xs text-slate-400">Deadline: {formatDate(item.opportunity.deadline)}</p>
                  </div>
                  <a
                    href={item.opportunity.link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  >
                    Open Link
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(event) => updateSavedStatus(item.id, event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-300/40 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSavedItem(item.id)}
                    className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-2 py-1.5 text-xs text-rose-200 transition hover:bg-rose-300/20"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
