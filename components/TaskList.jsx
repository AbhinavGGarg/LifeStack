"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PRIORITY_OPTIONS = ["high", "medium", "low"];
const CATEGORY_OPTIONS = [
  "study",
  "homework",
  "deep-work",
  "application",
  "planning",
  "project",
  "general",
];

const TASK_TEMPLATES = [
  {
    label: "Study Session",
    title: "Focused study block",
    priority: "high",
    estimateMinutes: 45,
    category: "study",
  },
  {
    label: "Homework Block",
    title: "Complete homework block",
    priority: "medium",
    estimateMinutes: 35,
    category: "homework",
  },
  {
    label: "Deep Work",
    title: "Deep work sprint",
    priority: "high",
    estimateMinutes: 60,
    category: "deep-work",
  },
  {
    label: "Application Session",
    title: "Application preparation session",
    priority: "high",
    estimateMinutes: 40,
    category: "application",
  },
];

function formatDueDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getQualityLabel(score) {
  if (score >= 80) return "Locked In";
  if (score >= 62) return "Solid Focus";
  if (score >= 45) return "Mixed Focus";
  return "Distracted";
}

export default function TaskList({
  tasks = [],
  goalPlans = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onLogFocusSession,
}) {
  const [draft, setDraft] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [category, setCategory] = useState("general");
  const [dueDate, setDueDate] = useState("");
  const [goalId, setGoalId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [focusTaskId, setFocusTaskId] = useState(null);
  const [focusDuration, setFocusDuration] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusIntelEnabled, setFocusIntelEnabled] = useState(true);
  const [intelLive, setIntelLive] = useState({
    cameraPermission: "idle",
    cameraSupported: false,
    cameraUsed: false,
    sampleCount: 0,
    attentiveSampleCount: 0,
    tabAwayEvents: 0,
    windowBlurEvents: 0,
    idleEvents: 0,
    interactionEvents: 0,
    attentionState: "not-started",
  });

  const trackingRef = useRef({
    stream: null,
    detector: null,
    video: null,
    listenersAttached: false,
    sampleIntervalId: null,
    idleIntervalId: null,
    attentionState: "not-started",
    idleActive: false,
    lastInteractionAt: 0,
    sampleCount: 0,
    attentiveSampleCount: 0,
    tabAwayEvents: 0,
    windowBlurEvents: 0,
    idleEvents: 0,
    interactionEvents: 0,
    cameraSupported: false,
    cameraPermission: "idle",
    cameraUsed: false,
  });
  const previewVideoRef = useRef(null);

  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );

  const focusTask = useMemo(
    () => tasks.find((task) => task.id === focusTaskId) || null,
    [tasks, focusTaskId]
  );

  const smallWinTask = useMemo(() => {
    const easy = incompleteTasks.find(
      (task) => Number(task.estimateMinutes) > 0 && Number(task.estimateMinutes) <= 20
    );

    return easy || incompleteTasks[0] || null;
  }, [incompleteTasks]);

  const liveAttentionPercent = useMemo(() => {
    if (!intelLive.sampleCount) {
      return 0;
    }

    return Math.round((intelLive.attentiveSampleCount / intelLive.sampleCount) * 100);
  }, [intelLive.attentiveSampleCount, intelLive.sampleCount]);

  const liveDistractionEvents = useMemo(() => {
    return intelLive.tabAwayEvents + intelLive.windowBlurEvents + intelLive.idleEvents;
  }, [intelLive.idleEvents, intelLive.tabAwayEvents, intelLive.windowBlurEvents]);

  function resetIntelligenceState() {
    trackingRef.current = {
      ...trackingRef.current,
      attentionState: "not-started",
      idleActive: false,
      lastInteractionAt: 0,
      sampleCount: 0,
      attentiveSampleCount: 0,
      tabAwayEvents: 0,
      windowBlurEvents: 0,
      idleEvents: 0,
      interactionEvents: 0,
      cameraPermission: "idle",
      cameraUsed: false,
    };

    setIntelLive((previous) => ({
      ...previous,
      cameraPermission: "idle",
      cameraUsed: false,
      sampleCount: 0,
      attentiveSampleCount: 0,
      tabAwayEvents: 0,
      windowBlurEvents: 0,
      idleEvents: 0,
      interactionEvents: 0,
      attentionState: "not-started",
    }));
  }

  function stopIntelligenceMonitoring() {
    const tracker = trackingRef.current;

    if (tracker.sampleIntervalId) {
      clearInterval(tracker.sampleIntervalId);
      tracker.sampleIntervalId = null;
    }

    if (tracker.idleIntervalId) {
      clearInterval(tracker.idleIntervalId);
      tracker.idleIntervalId = null;
    }

    if (tracker.listenersAttached && typeof window !== "undefined") {
      const interactionHandler = tracker.interactionHandler;
      const blurHandler = tracker.blurHandler;
      const visibilityHandler = tracker.visibilityHandler;
      const focusHandler = tracker.focusHandler;

      if (interactionHandler) {
        window.removeEventListener("pointerdown", interactionHandler, true);
        window.removeEventListener("keydown", interactionHandler, true);
        window.removeEventListener("scroll", interactionHandler, true);
      }
      if (blurHandler) {
        window.removeEventListener("blur", blurHandler);
      }
      if (focusHandler) {
        window.removeEventListener("focus", focusHandler);
      }
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
      }

      tracker.listenersAttached = false;
    }

    if (tracker.stream) {
      tracker.stream.getTracks().forEach((track) => track.stop());
      tracker.stream = null;
    }

    if (tracker.video) {
      if (typeof tracker.video.pause === "function") {
        tracker.video.pause();
      }
      tracker.video.srcObject = null;
      tracker.video = tracker.video === previewVideoRef.current ? previewVideoRef.current : null;
    }
  }

  function syncLiveIntelligenceState() {
    const tracker = trackingRef.current;
    setIntelLive({
      cameraPermission: tracker.cameraPermission,
      cameraSupported: tracker.cameraSupported,
      cameraUsed: tracker.cameraUsed,
      sampleCount: tracker.sampleCount,
      attentiveSampleCount: tracker.attentiveSampleCount,
      tabAwayEvents: tracker.tabAwayEvents,
      windowBlurEvents: tracker.windowBlurEvents,
      idleEvents: tracker.idleEvents,
      interactionEvents: tracker.interactionEvents,
      attentionState: tracker.attentionState,
    });
  }

  const buildIntelligenceReport = useCallback(() => {
    const tracker = trackingRef.current;
    const sampleCount = Math.max(0, tracker.sampleCount);
    const attentiveSampleCount = Math.max(0, tracker.attentiveSampleCount);
    const attentionPercent = sampleCount
      ? (attentiveSampleCount / sampleCount) * 100
      : 0;

    const distractions =
      Math.max(0, tracker.tabAwayEvents) +
      Math.max(0, tracker.windowBlurEvents) +
      Math.max(0, tracker.idleEvents);
    const interactionBoost = Math.min(8, Math.round(tracker.interactionEvents / 6));
    const rawScore = Math.round(attentionPercent - distractions * 7 + interactionBoost);
    const qualityScore = clamp(rawScore, 0, 100);

    return {
      enabled: focusIntelEnabled,
      sampleCount,
      attentiveSampleCount,
      attentionPercent: Math.round(attentionPercent),
      tabAwayEvents: Math.max(0, tracker.tabAwayEvents),
      windowBlurEvents: Math.max(0, tracker.windowBlurEvents),
      idleEvents: Math.max(0, tracker.idleEvents),
      interactionEvents: Math.max(0, tracker.interactionEvents),
      qualityScore,
      qualityLabel: getQualityLabel(qualityScore),
      cameraUsed: Boolean(tracker.cameraUsed),
      cameraAvailable: Boolean(tracker.cameraSupported),
      method: tracker.cameraSupported ? "face-detector+behavior-signals" : "behavior-signals",
    };
  }, [focusIntelEnabled]);

  useEffect(() => {
    if (!focusRunning || !focusTaskId) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          const completedMinutes = Math.max(1, Math.round(focusDuration));
          const intelligenceReport = focusIntelEnabled ? buildIntelligenceReport() : null;
          onLogFocusSession(focusTaskId, completedMinutes, intelligenceReport);
          setFocusRunning(false);
          stopIntelligenceMonitoring();
          setFocusTaskId(null);
          return focusDuration * 60;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    buildIntelligenceReport,
    focusDuration,
    focusIntelEnabled,
    focusRunning,
    focusTaskId,
    onLogFocusSession,
  ]);

  useEffect(() => {
    if (!focusTaskId || !focusRunning || !focusIntelEnabled) {
      stopIntelligenceMonitoring();
      return;
    }

    const tracker = trackingRef.current;
    tracker.cameraSupported = typeof window !== "undefined" && "FaceDetector" in window;
    tracker.cameraPermission = "requesting";
    tracker.cameraUsed = false;
    syncLiveIntelligenceState();

    const interactionHandler = () => {
      tracker.lastInteractionAt = Date.now();
      tracker.interactionEvents += 1;
    };

    const blurHandler = () => {
      tracker.windowBlurEvents += 1;
      tracker.attentionState = "window-blur";
    };

    const focusHandler = () => {
      tracker.lastInteractionAt = Date.now();
      tracker.attentionState = "focused-window";
    };

    const visibilityHandler = () => {
      if (document.hidden) {
        tracker.tabAwayEvents += 1;
        tracker.attentionState = "tab-away";
      } else {
        tracker.attentionState = "focused-tab";
        tracker.lastInteractionAt = Date.now();
      }
    };

    tracker.interactionHandler = interactionHandler;
    tracker.blurHandler = blurHandler;
    tracker.focusHandler = focusHandler;
    tracker.visibilityHandler = visibilityHandler;

    window.addEventListener("pointerdown", interactionHandler, true);
    window.addEventListener("keydown", interactionHandler, true);
    window.addEventListener("scroll", interactionHandler, true);
    window.addEventListener("blur", blurHandler);
    window.addEventListener("focus", focusHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    tracker.listenersAttached = true;

    tracker.idleIntervalId = window.setInterval(() => {
      const idleForMs = Date.now() - tracker.lastInteractionAt;
      if (idleForMs >= 45_000) {
        if (!tracker.idleActive) {
          tracker.idleEvents += 1;
          tracker.idleActive = true;
        }
        tracker.attentionState = "idle";
      } else {
        tracker.idleActive = false;
      }
      syncLiveIntelligenceState();
    }, 3000);

    const detectFaces = async () => {
      if (document.hidden || !tracker.video || tracker.video.readyState < 2) {
        tracker.sampleCount += 1;
        tracker.attentionState = document.hidden ? "tab-away" : tracker.attentionState;
        syncLiveIntelligenceState();
        return;
      }

      try {
        if (!tracker.detector && "FaceDetector" in window) {
          tracker.detector = new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
        }

        if (tracker.detector) {
          const faces = await tracker.detector.detect(tracker.video);
          tracker.sampleCount += 1;
          if (faces.length > 0) {
            tracker.attentiveSampleCount += 1;
            tracker.attentionState = "face-detected";
          } else {
            tracker.attentionState = "face-missing";
          }
        }
      } catch {
        tracker.attentionState = "camera-error";
      }

      syncLiveIntelligenceState();
    };

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 360 },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = previewVideoRef.current || document.createElement("video");
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        await video.play().catch(() => {});

        tracker.stream = stream;
        tracker.video = video;
        tracker.cameraPermission = "granted";
        tracker.cameraUsed = true;
        syncLiveIntelligenceState();

        tracker.sampleIntervalId = window.setInterval(() => {
          detectFaces();
        }, 2000);
      } catch {
        tracker.cameraPermission = "denied";
        tracker.cameraUsed = false;
        syncLiveIntelligenceState();
      }
    })();

    return () => {
      cancelled = true;
      stopIntelligenceMonitoring();
    };
  }, [focusIntelEnabled, focusRunning, focusTaskId]);

  useEffect(() => {
    return () => {
      stopIntelligenceMonitoring();
    };
  }, []);

  function resetForm() {
    setDraft("");
    setPriority("medium");
    setEstimateMinutes("");
    setCategory("general");
    setDueDate("");
    setGoalId("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    onAddTask({
      title: draft.trim(),
      priority,
      estimateMinutes: estimateMinutes ? Number(estimateMinutes) : null,
      category,
      dueDate: dueDate || null,
      goalId: goalId || null,
    });

    resetForm();
  }

  function handleApplyTemplate(template) {
    setDraft(template.title);
    setPriority(template.priority);
    setEstimateMinutes(String(template.estimateMinutes));
    setCategory(template.category);
    setShowAdvanced(true);
  }

  function startFocus(taskId) {
    resetIntelligenceState();
    setFocusTaskId(taskId);
    setFocusRunning(false);
    setSecondsRemaining(focusDuration * 60);
  }

  function completeFocus(markTaskComplete = false) {
    if (!focusTaskId) {
      return;
    }

    const elapsed = focusDuration * 60 - secondsRemaining;
    const completedMinutes = Math.max(
      1,
      Math.round((elapsed > 0 ? elapsed : focusDuration * 60) / 60)
    );

    const intelligenceReport = focusIntelEnabled ? buildIntelligenceReport() : null;
    onLogFocusSession(focusTaskId, completedMinutes, intelligenceReport);

    if (markTaskComplete && focusTask && !focusTask.completed) {
      onToggleTask(focusTask.id);
    }

    setFocusRunning(false);
    stopIntelligenceMonitoring();
    setFocusTaskId(null);
    setSecondsRemaining(focusDuration * 60);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-600/80">Today</p>
        <h2 className="text-xl font-semibold text-slate-900">Task Stack</h2>
      </div>

      {smallWinTask ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span className="font-medium">Small win:</span> Complete one easy task now -{" "}
          <span className="font-medium">{smallWinTask.title}</span>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Start momentum with one 15-minute task.
        </div>
      )}

      <form className="mb-4 space-y-3" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a task (ex: finish chemistry problem set)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TASK_TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => handleApplyTemplate(template)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              {template.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowAdvanced((previous) => !previous)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300"
          >
            {showAdvanced ? "Hide options" : "More options"}
          </button>
        </div>

        {showAdvanced ? (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-slate-600">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Estimated Minutes
              <input
                type="number"
                min="5"
                step="5"
                value={estimateMinutes}
                onChange={(event) => setEstimateMinutes(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="text-xs text-slate-600">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              />
            </label>

            <label className="text-xs text-slate-600 sm:col-span-2 lg:col-span-2">
              Linked Goal
              <select
                value={goalId}
                onChange={(event) => setGoalId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-300 focus:outline-none"
              >
                <option value="">No linked goal</option>
                {goalPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </form>

      <div id="focus-mode" className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 scroll-mt-24">
        <p className="text-xs uppercase tracking-wide text-sky-600/80">Focus Mode</p>
        <p className="mt-1 text-sm text-slate-700">
          Lock in with a guided timer, live attention signals, and session tracking.
        </p>

        {incompleteTasks.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {incompleteTasks.slice(0, 4).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => startFocus(task.id)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
              >
                Start: {task.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Add a task first, then start Focus Mode.</p>
        )}
      </div>

      {focusTask ? (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs uppercase tracking-wide text-sky-700">Focus Mode</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{focusTask.title}</p>

          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <label className="flex items-center justify-between gap-3 text-xs text-slate-700">
              <span className="font-medium">Focus Intelligence (Beta)</span>
              <input
                type="checkbox"
                checked={focusIntelEnabled}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setFocusIntelEnabled(nextValue);
                  if (!nextValue) {
                    stopIntelligenceMonitoring();
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 accent-sky-500"
              />
            </label>

            {focusIntelEnabled ? (
              <>
                <div className="mt-2 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
                  <p>
                    Camera:{" "}
                    <span className="font-medium text-slate-800">
                      {intelLive.cameraPermission === "granted"
                        ? "On"
                        : intelLive.cameraPermission === "denied"
                          ? "Denied (behavior-only)"
                          : "Waiting"}
                    </span>
                  </p>
                  <p>
                    Attention:{" "}
                    <span className="font-medium text-slate-800">{liveAttentionPercent}%</span>
                  </p>
                  <p>
                    Distractions:{" "}
                    <span className="font-medium text-slate-800">{liveDistractionEvents}</span>
                  </p>
                  <p>
                    Interaction Events:{" "}
                    <span className="font-medium text-slate-800">{intelLive.interactionEvents}</span>
                  </p>
                </div>

                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-40 w-full object-cover [transform:scaleX(-1)]"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Live preview only during focus. Video is not stored.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500">
                Timer-only mode enabled. No behavior or camera signals will be tracked.
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[15, 25, 45, 60].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  setFocusDuration(minutes);

                  if (!focusRunning) {
                    setSecondsRemaining(minutes * 60);
                  }
                }}
                className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                  focusDuration === minutes
                    ? "border border-sky-300 bg-white text-sky-700"
                    : "border border-transparent bg-sky-100 text-sky-700 hover:bg-sky-200"
                }`}
              >
                {minutes}m
              </button>
            ))}
          </div>

          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {formatTimer(secondsRemaining)}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!focusRunning ? (
              <button
                type="button"
                onClick={() => setFocusRunning(true)}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
              >
                Start Focus
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFocusRunning(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Pause
              </button>
            )}

            <button
              type="button"
              onClick={() => completeFocus(false)}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Complete Session
            </button>

            <button
              type="button"
              onClick={() => completeFocus(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Complete + Mark Task Done
            </button>

            <button
              type="button"
              onClick={() => {
                setFocusRunning(false);
                stopIntelligenceMonitoring();
                setFocusTaskId(null);
                setSecondsRemaining(focusDuration * 60);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No tasks yet. Add one and build momentum.
          </p>
        ) : null}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-start gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-transparent accent-sky-500"
                />
                <span className={task.completed ? "text-slate-400 line-through" : ""}>{task.title}</span>
              </label>

              <div className="flex items-center gap-1">
                {!task.completed ? (
                  <button
                    type="button"
                    onClick={() => startFocus(task.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    Focus
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] text-rose-700 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                {task.priority}
              </span>
              {task.category ? (
                <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                  {task.category}
                </span>
              ) : null}
              {task.estimateMinutes ? (
                <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                  {task.estimateMinutes} min
                </span>
              ) : null}
              {task.dueDate ? (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                  Due {formatDueDate(task.dueDate)}
                </span>
              ) : null}
              {Number(task.focusMinutes) > 0 ? (
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
                  Focus {task.focusMinutes}m
                </span>
              ) : null}
              {task.goalId ? (
                <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700">
                  Goal-linked
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
