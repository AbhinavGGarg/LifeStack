"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { opportunities } from "@/lib/data";
import { matchOpportunities } from "@/lib/matchingAlgorithm";

const AppContext = createContext(null);

function normalizeLocalData(raw, fallback = []) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function ProductAppProvider({ children }) {
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
      gpa: user.profile.gpa,
      activityHours: user.profile.activityHours,
      extracurriculars: user.profile.extracurriculars,
      intendedMajor: user.profile.intendedMajor,
      targetRole: user.profile.targetRole,
      onboardingComplete: user.profile.onboardingComplete,
    };
  }, [user]);

  const matchedOpportunities = useMemo(() => {
    if (!studentProfile) {
      return [];
    }

    return matchOpportunities(studentProfile, opportunities);
  }, [studentProfile]);

  const opportunityMap = useMemo(() => {
    return opportunities.reduce((acc, opportunity) => {
      acc[opportunity.id] = opportunity;
      return acc;
    }, {});
  }, []);

  const matchedMap = useMemo(() => {
    return matchedOpportunities.reduce((acc, opportunity) => {
      acc[opportunity.id] = opportunity;
      return acc;
    }, {});
  }, [matchedOpportunities]);

  const savedOpportunityRows = useMemo(() => {
    return savedItems
      .map((item) => {
        const matchedItem = matchedMap[item.opportunityId];
        const fallbackItem = opportunityMap[item.opportunityId];
        const opportunity = matchedItem || fallbackItem;

        if (!opportunity) {
          return null;
        }

        return {
          ...item,
          opportunity,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [matchedMap, opportunityMap, savedItems]);

  const completedTaskCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const savedStatusCounts = useMemo(() => {
    return savedItems.reduce(
      (acc, item) => {
        if (item.status in acc) {
          acc[item.status] += 1;
        }

        return acc;
      },
      {
        saved: 0,
        applying: 0,
        applied: 0,
      }
    );
  }, [savedItems]);

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

          if (data?.user?.profile?.onboardingComplete === false) {
            router.replace("/onboarding");
          }
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

    setTasks(normalizeLocalData(localStorage.getItem(tasksKey)));
    setSavedItems(normalizeLocalData(localStorage.getItem(savedKey)));
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
    if (!studentProfile || matchedOpportunities.length === 0) {
      return;
    }

    const featured = matchedOpportunities.slice(0, 12);
    const pending = featured.filter((item) => !insights[item.id]);

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
                  extracurriculars: studentProfile.extracurriculars,
                  intendedMajor: studentProfile.intendedMajor,
                  targetRole: studentProfile.targetRole,
                },
                opportunity,
              }),
            });

            const payload = await response.json();
            return [opportunity.id, payload?.recommendation || "Great fit for your profile."];
          } catch {
            return [
              opportunity.id,
              "This opportunity aligns with your profile and can move your goals forward.",
            ];
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
  }, [insights, matchedOpportunities, studentProfile]);

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
      const alreadySaved = previous.some((item) => item.opportunityId === opportunityId);

      if (alreadySaved) {
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

  async function updateProfile(updates) {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Unable to update profile.");
    }

    setUser(payload.user);
    setInsights({});
    return payload.user;
  }

  async function logout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const value = {
    user,
    loadingUser,
    loggingOut,
    studentProfile,
    tasks,
    completedTaskCount,
    savedItems,
    savedStatusCounts,
    savedOpportunityRows,
    matchedOpportunities,
    insights,
    addTask,
    toggleTask,
    deleteTask,
    saveOpportunity,
    updateSavedStatus,
    removeSavedItem,
    updateProfile,
    logout,
  };

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <p className="animate-pulse text-sm tracking-wide">Loading your LifeStack...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (user?.profile?.onboardingComplete === false) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useProductApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useProductApp must be used within ProductAppProvider");
  }

  return context;
}
