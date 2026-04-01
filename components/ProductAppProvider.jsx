"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { opportunities } from "@/lib/data";
import { matchOpportunities } from "@/lib/matchingAlgorithm";
import { createGoalPlanBlueprint } from "@/lib/planningEngine";
import { getMajorTrack, resolveMajor } from "@/lib/majorGuidance";

const AppContext = createContext(null);

const PRIORITIES = ["high", "medium", "low"];
const DEFAULT_PREFERENCES = {
  dailyReminder: true,
  weeklySummary: true,
  motivationalNudges: true,
  compactCards: false,
};

function normalizeLocalData(raw, fallback = []) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeLocalObject(raw, fallback = {}) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function toDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTask(task) {
  const createdAt = task?.createdAt && !Number.isNaN(new Date(task.createdAt).getTime())
    ? task.createdAt
    : new Date().toISOString();

  const completed = Boolean(task?.completed);
  const completedAt =
    task?.completedAt && !Number.isNaN(new Date(task.completedAt).getTime())
      ? task.completedAt
      : completed
        ? createdAt
        : null;

  const priority = PRIORITIES.includes(task?.priority) ? task.priority : "medium";
  const estimate = Number(task?.estimateMinutes);
  const estimateMinutes = Number.isFinite(estimate) && estimate > 0 ? Math.round(estimate) : null;

  return {
    id: task?.id || crypto.randomUUID(),
    title: String(task?.title || "").trim(),
    completed,
    createdAt,
    completedAt,
    priority,
    estimateMinutes,
    category: String(task?.category || "general").trim().toLowerCase(),
    goalId: task?.goalId ? String(task.goalId) : null,
    dueDate: toDateKey(task?.dueDate),
    template: task?.template ? String(task.template) : null,
    focusMinutes:
      Number.isFinite(Number(task?.focusMinutes)) && Number(task.focusMinutes) > 0
        ? Math.round(Number(task.focusMinutes))
        : 0,
  };
}

function normalizeGoalPlan(plan) {
  const weeklyMilestones = Array.isArray(plan?.weeklyMilestones)
    ? plan.weeklyMilestones.map((milestone, index) => ({
        id: milestone?.id || `m-${index + 1}`,
        title: String(milestone?.title || "").trim(),
        done: Boolean(milestone?.done),
      }))
    : [];

  const suggestedTasks = Array.isArray(plan?.suggestedTasks)
    ? plan.suggestedTasks.map((task, index) => ({
        id: task?.id || `s-${index + 1}`,
        title: String(task?.title || "").trim(),
        priority: PRIORITIES.includes(task?.priority) ? task.priority : "medium",
        estimateMinutes:
          Number.isFinite(Number(task?.estimateMinutes)) && Number(task.estimateMinutes) > 0
            ? Math.round(Number(task.estimateMinutes))
            : null,
        category: String(task?.category || "general").trim().toLowerCase(),
      }))
    : [];

  const completedMilestones = weeklyMilestones.filter((milestone) => milestone.done).length;
  const status =
    completedMilestones === weeklyMilestones.length && weeklyMilestones.length > 0
      ? "done"
      : "active";

  return {
    id: plan?.id || crypto.randomUUID(),
    title: String(plan?.title || "").trim(),
    createdAt:
      plan?.createdAt && !Number.isNaN(new Date(plan.createdAt).getTime())
        ? plan.createdAt
        : new Date().toISOString(),
    suggestedCadence: String(plan?.suggestedCadence || "Consistent daily execution"),
    weeklyMilestones,
    suggestedTasks,
    status,
  };
}

function normalizeFocusSession(session) {
  const completedAt =
    session?.completedAt && !Number.isNaN(new Date(session.completedAt).getTime())
      ? session.completedAt
      : new Date().toISOString();

  const minutes = Number(session?.minutes);
  const intelligenceRaw =
    session?.intelligence && typeof session.intelligence === "object"
      ? session.intelligence
      : null;

  const sampleCount = Number(intelligenceRaw?.sampleCount);
  const attentiveSampleCount = Number(intelligenceRaw?.attentiveSampleCount);
  const attentionPercent = Number(intelligenceRaw?.attentionPercent);
  const tabAwayEvents = Number(intelligenceRaw?.tabAwayEvents);
  const windowBlurEvents = Number(intelligenceRaw?.windowBlurEvents);
  const idleEvents = Number(intelligenceRaw?.idleEvents);
  const interactionEvents = Number(intelligenceRaw?.interactionEvents);
  const qualityScore = Number(intelligenceRaw?.qualityScore);
  const qualityConfidence = String(intelligenceRaw?.qualityConfidence || "low")
    .trim()
    .toLowerCase();
  const measurementMode = String(intelligenceRaw?.measurementMode || "behavior-only")
    .trim()
    .toLowerCase();
  const evidenceSummary = String(intelligenceRaw?.evidenceSummary || "")
    .trim();

  return {
    id: session?.id || crypto.randomUUID(),
    taskId: session?.taskId ? String(session.taskId) : null,
    taskTitle: String(session?.taskTitle || "Focus Session"),
    minutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0,
    completedAt,
    dateKey: toDateKey(session?.dateKey || completedAt),
    intelligence: {
      enabled: Boolean(intelligenceRaw?.enabled),
      sampleCount: Number.isFinite(sampleCount) && sampleCount >= 0 ? Math.round(sampleCount) : 0,
      attentiveSampleCount:
        Number.isFinite(attentiveSampleCount) && attentiveSampleCount >= 0
          ? Math.round(attentiveSampleCount)
          : 0,
      attentionPercent:
        Number.isFinite(attentionPercent) && attentionPercent >= 0
          ? Math.max(0, Math.min(100, Math.round(attentionPercent)))
          : 0,
      tabAwayEvents:
        Number.isFinite(tabAwayEvents) && tabAwayEvents >= 0
          ? Math.round(tabAwayEvents)
          : 0,
      windowBlurEvents:
        Number.isFinite(windowBlurEvents) && windowBlurEvents >= 0
          ? Math.round(windowBlurEvents)
          : 0,
      idleEvents: Number.isFinite(idleEvents) && idleEvents >= 0 ? Math.round(idleEvents) : 0,
      interactionEvents:
        Number.isFinite(interactionEvents) && interactionEvents >= 0
          ? Math.round(interactionEvents)
          : 0,
      qualityScore:
        Number.isFinite(qualityScore) && qualityScore >= 0
          ? Math.max(0, Math.min(100, Math.round(qualityScore)))
          : 0,
      qualityLabel:
        String(intelligenceRaw?.qualityLabel || "").trim() || "Not scored",
      qualityConfidence: ["low", "medium", "high"].includes(qualityConfidence)
        ? qualityConfidence
        : "low",
      measurementMode:
        measurementMode === "camera+behavior" ? "camera+behavior" : "behavior-only",
      evidenceSummary:
        evidenceSummary || "Estimated from available focus signals.",
      cameraUsed: Boolean(intelligenceRaw?.cameraUsed),
      cameraAvailable: Boolean(intelligenceRaw?.cameraAvailable),
      method: String(intelligenceRaw?.method || "none"),
    },
  };
}

function normalizeReflection(reflection) {
  return {
    id: reflection?.id || crypto.randomUUID(),
    dateKey: toDateKey(reflection?.dateKey || reflection?.updatedAt || new Date()),
    text: String(reflection?.text || "").trim(),
    updatedAt:
      reflection?.updatedAt && !Number.isNaN(new Date(reflection.updatedAt).getTime())
        ? reflection.updatedAt
        : new Date().toISOString(),
  };
}

function normalizeGradesSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const courses = Array.isArray(snapshot.courses)
    ? snapshot.courses
        .map((course, index) => {
          const name = String(course?.name || "").trim();
          const period = course?.period ? String(course.period).trim() : null;
          const teacher = course?.teacher ? String(course.teacher).trim() : null;
          const letterGrade = course?.letterGrade ? String(course.letterGrade).trim() : null;
          const percent = Number(course?.percent);

          if (!name) {
            return null;
          }

          return {
            id: course?.id || `${name}-${period || index}`,
            name,
            period: period || null,
            teacher: teacher || null,
            letterGrade: letterGrade || null,
            percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null,
          };
        })
        .filter(Boolean)
    : [];

  const courseCount = courses.length;
  const numericCourseCount = courses.filter((course) => Number.isFinite(course.percent)).length;
  const averagePercent =
    numericCourseCount > 0
      ? Math.round(
          (courses.reduce((sum, course) => sum + (Number(course.percent) || 0), 0) /
            numericCourseCount) *
            100
        ) / 100
      : null;

  return {
    source: String(snapshot?.source || "studentvue"),
    serviceUrl: snapshot?.serviceUrl ? String(snapshot.serviceUrl) : null,
    syncedAt:
      snapshot?.syncedAt && !Number.isNaN(new Date(snapshot.syncedAt).getTime())
        ? snapshot.syncedAt
        : new Date().toISOString(),
    courses,
    summary: {
      courseCount,
      numericCourseCount,
      averagePercent,
    },
  };
}

function buildActivityMap(tasks, focusSessions) {
  const map = {};

  tasks.forEach((task) => {
    if (!task.completed || !task.completedAt) {
      return;
    }

    const dateKey = toDateKey(task.completedAt);
    if (!dateKey) {
      return;
    }

    if (!map[dateKey]) {
      map[dateKey] = { completedTasks: 0, focusMinutes: 0 };
    }

    map[dateKey].completedTasks += 1;
  });

  focusSessions.forEach((session) => {
    const dateKey = toDateKey(session.dateKey || session.completedAt);
    if (!dateKey) {
      return;
    }

    if (!map[dateKey]) {
      map[dateKey] = { completedTasks: 0, focusMinutes: 0 };
    }

    map[dateKey].focusMinutes += Math.max(0, Number(session.minutes) || 0);
  });

  return map;
}

function buildActivityTimeline(activityMap, days) {
  const timeline = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const dateKey = toDateKey(date);
    const entry = activityMap[dateKey] || { completedTasks: 0, focusMinutes: 0 };

    const activityScore = Math.min(
      100,
      entry.completedTasks * 24 + Math.min(52, Math.round(entry.focusMinutes * 1.2))
    );

    timeline.push({
      dateKey,
      completedTasks: entry.completedTasks,
      focusMinutes: entry.focusMinutes,
      activityScore,
    });
  }

  return timeline;
}

function calculateStreakDays(activityMap) {
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const dateKey = toDateKey(date);
    const entry = activityMap[dateKey];

    if (entry && (entry.completedTasks > 0 || entry.focusMinutes > 0)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getPriorityRank(priority) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

export function ProductAppProvider({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [insights, setInsights] = useState({});
  const [focusSessions, setFocusSessions] = useState([]);
  const [goalPlans, setGoalPlans] = useState([]);
  const [dailyReflections, setDailyReflections] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [gradesSnapshot, setGradesSnapshot] = useState(null);

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
      majorRecommendation: user.profile.majorRecommendation,
      targetRole: user.profile.targetRole,
      onboardingComplete: user.profile.onboardingComplete,
    };
  }, [user]);

  const majorPath = useMemo(() => {
    if (!studentProfile) {
      return null;
    }

    const resolvedMajor = resolveMajor(
      studentProfile.intendedMajor,
      studentProfile.majorRecommendation
    );

    return {
      key: resolvedMajor,
      ...getMajorTrack(studentProfile.intendedMajor, studentProfile.majorRecommendation),
    };
  }, [studentProfile]);

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

  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const activityMap = useMemo(
    () => buildActivityMap(tasks, focusSessions),
    [tasks, focusSessions]
  );

  const activityTimeline = useMemo(
    () => buildActivityTimeline(activityMap, 120),
    [activityMap]
  );

  const completedTodayCount = useMemo(
    () => tasks.filter((task) => task.completedAt && toDateKey(task.completedAt) === todayKey).length,
    [tasks, todayKey]
  );

  const focusMinutesToday = useMemo(() => {
    return focusSessions.reduce((sum, session) => {
      return session.dateKey === todayKey ? sum + session.minutes : sum;
    }, 0);
  }, [focusSessions, todayKey]);

  const focusMinutesWeek = useMemo(() => {
    return activityTimeline.slice(-7).reduce((sum, day) => sum + day.focusMinutes, 0);
  }, [activityTimeline]);

  const totalFocusMinutes = useMemo(() => {
    return focusSessions.reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
  }, [focusSessions]);

  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }

    return Math.round((completedTaskCount / tasks.length) * 100);
  }, [completedTaskCount, tasks.length]);

  const streakDays = useMemo(() => calculateStreakDays(activityMap), [activityMap]);

  const todayPlanTasks = useMemo(() => {
    const dated = incompleteTasks.filter(
      (task) => task.dueDate === todayKey || toDateKey(task.createdAt) === todayKey
    );

    if (dated.length > 0) {
      return dated.slice(0, 5);
    }

    return incompleteTasks.slice(0, 5);
  }, [incompleteTasks, todayKey]);

  const topPriorityTask = useMemo(() => {
    if (incompleteTasks.length === 0) {
      return null;
    }

    return [...incompleteTasks].sort((a, b) => {
      const priorityDelta = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0];
  }, [incompleteTasks]);

  const dailyProgressPercent = useMemo(() => {
    const dailyTarget = Math.max(1, Math.min(5, todayPlanTasks.length + completedTodayCount || 3));
    return Math.min(100, Math.round((completedTodayCount / dailyTarget) * 100));
  }, [completedTodayCount, todayPlanTasks.length]);

  const executionScore = useMemo(() => {
    const base = taskCompletionRate * 0.45;
    const streakScore = Math.min(22, streakDays * 4);
    const focusScore = Math.min(18, (focusMinutesWeek / 180) * 18);
    const pipelineScore = Math.min(
      10,
      savedStatusCounts.applied * 4 + savedStatusCounts.applying * 2 + savedStatusCounts.saved * 0.5
    );
    const dailyMomentum = Math.min(10, completedTodayCount * 2.5);

    return Math.round(Math.min(100, base + streakScore + focusScore + pipelineScore + dailyMomentum));
  }, [
    completedTodayCount,
    focusMinutesWeek,
    savedStatusCounts.applied,
    savedStatusCounts.applying,
    savedStatusCounts.saved,
    streakDays,
    taskCompletionRate,
  ]);

  const consistencyDelta = useMemo(() => {
    const recent = activityTimeline.slice(-7).reduce((sum, day) => sum + day.activityScore, 0);
    const previous = activityTimeline
      .slice(-14, -7)
      .reduce((sum, day) => sum + day.activityScore, 0);

    if (previous === 0) {
      return recent > 0 ? 100 : 0;
    }

    return Math.round(((recent - previous) / previous) * 100);
  }, [activityTimeline]);

  const reflectionToday = useMemo(() => {
    return (
      dailyReflections.find((reflection) => reflection.dateKey === todayKey)?.text || ""
    );
  }, [dailyReflections, todayKey]);

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

    const prefix = `lifestack:${studentProfile.id}`;
    const tasksKey = `${prefix}:tasks`;
    const savedKey = `${prefix}:saved`;
    const focusKey = `${prefix}:focusSessions`;
    const goalsKey = `${prefix}:goalPlans`;
    const reflectionsKey = `${prefix}:reflections`;
    const preferencesKey = `${prefix}:preferences`;
    const gradesKey = `${prefix}:grades`;
    let parsedGrades = null;

    try {
      parsedGrades = JSON.parse(localStorage.getItem(gradesKey) || "null");
    } catch {
      parsedGrades = null;
    }

    setTasks(normalizeLocalData(localStorage.getItem(tasksKey)).map(normalizeTask).filter((task) => task.title));
    setSavedItems(normalizeLocalData(localStorage.getItem(savedKey)));
    setFocusSessions(
      normalizeLocalData(localStorage.getItem(focusKey))
        .map(normalizeFocusSession)
        .filter((session) => session.minutes > 0)
    );
    setGoalPlans(
      normalizeLocalData(localStorage.getItem(goalsKey))
        .map(normalizeGoalPlan)
        .filter((plan) => plan.title)
    );
    setDailyReflections(
      normalizeLocalData(localStorage.getItem(reflectionsKey))
        .map(normalizeReflection)
        .filter((entry) => entry.dateKey)
        .slice(0, 45)
    );
    setPreferences({
      ...DEFAULT_PREFERENCES,
      ...normalizeLocalObject(localStorage.getItem(preferencesKey)),
    });
    setGradesSnapshot(normalizeGradesSnapshot(parsedGrades));
  }, [studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(`lifestack:${studentProfile.id}:tasks`, JSON.stringify(tasks));
  }, [tasks, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(`lifestack:${studentProfile.id}:saved`, JSON.stringify(savedItems));
  }, [savedItems, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(
      `lifestack:${studentProfile.id}:focusSessions`,
      JSON.stringify(focusSessions)
    );
  }, [focusSessions, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(`lifestack:${studentProfile.id}:goalPlans`, JSON.stringify(goalPlans));
  }, [goalPlans, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(
      `lifestack:${studentProfile.id}:reflections`,
      JSON.stringify(dailyReflections)
    );
  }, [dailyReflections, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(
      `lifestack:${studentProfile.id}:preferences`,
      JSON.stringify(preferences)
    );
  }, [preferences, studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      return;
    }

    localStorage.setItem(
      `lifestack:${studentProfile.id}:grades`,
      JSON.stringify(gradesSnapshot || null)
    );
  }, [gradesSnapshot, studentProfile]);

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
                  majorRecommendation: studentProfile.majorRecommendation,
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

  function addTask(input) {
    const data = typeof input === "string" ? { title: input } : { ...(input || {}) };
    const title = String(data.title || "").trim();

    if (!title) {
      return null;
    }

    const estimate = Number(data.estimateMinutes);

    const nextTask = normalizeTask({
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      priority: PRIORITIES.includes(data.priority) ? data.priority : "medium",
      estimateMinutes: Number.isFinite(estimate) && estimate > 0 ? estimate : null,
      category: String(data.category || "general").trim().toLowerCase(),
      goalId: data.goalId || null,
      dueDate: data.dueDate || null,
      template: data.template || null,
      focusMinutes: 0,
    });

    setTasks((previous) => [nextTask, ...previous]);
    return nextTask.id;
  }

  function updateTask(taskId, updates) {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        return normalizeTask({
          ...task,
          ...updates,
          id: task.id,
        });
      })
    );
  }

  function toggleTask(taskId) {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextCompleted = !task.completed;

        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        };
      })
    );
  }

  function deleteTask(taskId) {
    setTasks((previous) => previous.filter((task) => task.id !== taskId));
  }

  function logFocusSession(taskId, minutes, intelligence = null) {
    const normalizedMinutes = Math.max(1, Math.round(Number(minutes) || 0));

    if (!normalizedMinutes) {
      return null;
    }

    const linkedTask = tasks.find((task) => task.id === taskId);
    const session = normalizeFocusSession({
      id: crypto.randomUUID(),
      taskId: taskId || null,
      taskTitle: linkedTask?.title || "Focus Session",
      minutes: normalizedMinutes,
      completedAt: new Date().toISOString(),
      intelligence: intelligence || undefined,
    });

    setFocusSessions((previous) => [session, ...previous].slice(0, 500));

    if (taskId) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? {
                ...task,
                focusMinutes: (Number(task.focusMinutes) || 0) + normalizedMinutes,
              }
            : task
        )
      );
    }

    return session;
  }

  function createGoalPlan(goalTitle) {
    const title = String(goalTitle || "").trim();

    if (!title) {
      return null;
    }

    const blueprint = createGoalPlanBlueprint(title);

    const plan = normalizeGoalPlan({
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
      suggestedCadence: blueprint.suggestedCadence,
      weeklyMilestones: blueprint.weeklyMilestones.map((milestone) => ({
        ...milestone,
        done: false,
      })),
      suggestedTasks: blueprint.suggestedTasks.map((task) => ({
        ...task,
        id: crypto.randomUUID(),
      })),
      status: "active",
    });

    setGoalPlans((previous) => [plan, ...previous]);
    return plan;
  }

  function toggleGoalMilestone(goalId, milestoneId) {
    setGoalPlans((previous) =>
      previous.map((plan) => {
        if (plan.id !== goalId) {
          return plan;
        }

        const weeklyMilestones = plan.weeklyMilestones.map((milestone) =>
          milestone.id === milestoneId
            ? {
                ...milestone,
                done: !milestone.done,
              }
            : milestone
        );

        const allDone = weeklyMilestones.length > 0 && weeklyMilestones.every((item) => item.done);

        return {
          ...plan,
          weeklyMilestones,
          status: allDone ? "done" : "active",
        };
      })
    );
  }

  function removeGoalPlan(goalId) {
    setGoalPlans((previous) => previous.filter((plan) => plan.id !== goalId));
  }

  function addGoalSuggestionAsTask(goalId, suggestionId) {
    const plan = goalPlans.find((entry) => entry.id === goalId);

    if (!plan) {
      return null;
    }

    const suggestion = plan.suggestedTasks.find((task) => task.id === suggestionId);

    if (!suggestion) {
      return null;
    }

    return addTask({
      ...suggestion,
      goalId,
      template: "goal-planner",
    });
  }

  function saveDailyReflection(text) {
    const cleaned = String(text || "").trim();

    setDailyReflections((previous) => {
      const today = toDateKey(new Date());
      const remaining = previous.filter((entry) => entry.dateKey !== today);

      if (!cleaned) {
        return remaining;
      }

      return [
        normalizeReflection({
          id: crypto.randomUUID(),
          dateKey: today,
          text: cleaned,
          updatedAt: new Date().toISOString(),
        }),
        ...remaining,
      ].slice(0, 45);
    });
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

  function updatePreferences(nextValues) {
    setPreferences((previous) => ({
      ...previous,
      ...(nextValues || {}),
    }));
  }

  function saveGradesSnapshot(snapshot) {
    setGradesSnapshot(normalizeGradesSnapshot(snapshot));
  }

  function clearGradesSnapshot() {
    setGradesSnapshot(null);
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
    incompleteTasks,
    completedTaskCount,
    taskCompletionRate,
    savedItems,
    savedStatusCounts,
    savedOpportunityRows,
    matchedOpportunities,
    majorPath,
    insights,
    focusSessions,
    totalFocusMinutes,
    focusMinutesToday,
    focusMinutesWeek,
    goalPlans,
    dailyReflections,
    reflectionToday,
    preferences,
    gradesSnapshot,
    activityTimeline,
    todayPlanTasks,
    topPriorityTask,
    dailyProgressPercent,
    completedTodayCount,
    streakDays,
    executionScore,
    consistencyDelta,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    logFocusSession,
    createGoalPlan,
    toggleGoalMilestone,
    removeGoalPlan,
    addGoalSuggestionAsTask,
    saveDailyReflection,
    saveOpportunity,
    updateSavedStatus,
    removeSavedItem,
    updatePreferences,
    saveGradesSnapshot,
    clearGradesSnapshot,
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
