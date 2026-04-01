"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export default function LockInMode({
  tasks = [],
  initialTaskId = "",
  onLogFocusSession,
  onToggleTask,
}) {
  const incompleteTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || "");
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

  const previewVideoRef = useRef(null);
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
    samplingInProgress: false,
  });

  const selectedTask = useMemo(
    () => {
      const fallbackTaskId =
        initialTaskId && incompleteTasks.some((task) => task.id === initialTaskId)
          ? initialTaskId
          : incompleteTasks[0]?.id || "";
      const currentTaskId =
        selectedTaskId && incompleteTasks.some((task) => task.id === selectedTaskId)
          ? selectedTaskId
          : fallbackTaskId;

      return tasks.find((task) => task.id === currentTaskId) || null;
    },
    [tasks, selectedTaskId, incompleteTasks, initialTaskId]
  );
  const currentTaskId = selectedTask?.id || "";

  const liveAttentionPercent = useMemo(() => {
    if (!intelLive.sampleCount) {
      return 0;
    }

    return Math.round((intelLive.attentiveSampleCount / intelLive.sampleCount) * 100);
  }, [intelLive.attentiveSampleCount, intelLive.sampleCount]);

  const liveDistractionEvents = useMemo(() => {
    return intelLive.tabAwayEvents + intelLive.windowBlurEvents + intelLive.idleEvents;
  }, [intelLive.idleEvents, intelLive.tabAwayEvents, intelLive.windowBlurEvents]);

  const liveMeasurementMode = useMemo(() => {
    const hasCameraEvidence =
      intelLive.cameraPermission === "granted" && intelLive.cameraSupported && intelLive.sampleCount >= 8;
    return hasCameraEvidence ? "camera+behavior" : "behavior-only";
  }, [intelLive.cameraPermission, intelLive.cameraSupported, intelLive.sampleCount]);

  const liveConfidence = useMemo(() => {
    if (
      intelLive.cameraPermission === "granted" &&
      intelLive.cameraSupported &&
      intelLive.sampleCount >= 25
    ) {
      return "high";
    }

    if (
      intelLive.cameraPermission === "granted" &&
      intelLive.cameraSupported &&
      intelLive.sampleCount >= 8
    ) {
      return "medium";
    }

    return "low";
  }, [intelLive.cameraPermission, intelLive.cameraSupported, intelLive.sampleCount]);

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
      if (blurHandler) window.removeEventListener("blur", blurHandler);
      if (focusHandler) window.removeEventListener("focus", focusHandler);
      if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);

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

    tracker.samplingInProgress = false;
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
    const interactionBoost = Math.min(10, Math.round(tracker.interactionEvents / 5));
    const behaviorScore = clamp(100 - distractions * 9 + interactionBoost, 0, 100);
    const hasCameraEvidence = Boolean(tracker.cameraUsed && tracker.cameraSupported && sampleCount >= 8);
    const rawScore = hasCameraEvidence
      ? Math.round(attentionPercent * 0.8 + behaviorScore * 0.2)
      : behaviorScore;
    const qualityScore = clamp(rawScore, 0, 100);
    const qualityConfidence = hasCameraEvidence
      ? sampleCount >= 25
        ? "high"
        : "medium"
      : "low";
    const measurementMode = hasCameraEvidence ? "camera+behavior" : "behavior-only";
    const evidenceSummary = hasCameraEvidence
      ? `Measured across ${sampleCount} camera samples.`
      : "Estimated from tab focus, idle, and interaction signals only.";

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
      qualityLabel:
        qualityConfidence === "low"
          ? `Estimated ${getQualityLabel(qualityScore)}`
          : getQualityLabel(qualityScore),
      qualityConfidence,
      measurementMode,
      evidenceSummary,
      cameraUsed: Boolean(tracker.cameraUsed),
      cameraAvailable: Boolean(tracker.cameraSupported),
      method: hasCameraEvidence ? "face-detector+behavior-signals" : "behavior-signals",
    };
  }, [focusIntelEnabled]);

  function finishSession(markTaskComplete = false) {
    if (!currentTaskId) {
      return;
    }

    const elapsed = focusDuration * 60 - secondsRemaining;
    const completedMinutes = Math.max(
      1,
      Math.round((elapsed > 0 ? elapsed : focusDuration * 60) / 60)
    );

    const intelligenceReport = focusIntelEnabled ? buildIntelligenceReport() : null;
    onLogFocusSession(currentTaskId, completedMinutes, intelligenceReport);

    if (markTaskComplete && selectedTask && !selectedTask.completed) {
      onToggleTask(selectedTask.id);
    }

    setFocusRunning(false);
    stopIntelligenceMonitoring();
    setSecondsRemaining(focusDuration * 60);
  }

  useEffect(() => {
    if (!focusRunning || !currentTaskId) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          const completedMinutes = Math.max(1, Math.round(focusDuration));
          const intelligenceReport = focusIntelEnabled ? buildIntelligenceReport() : null;
          onLogFocusSession(currentTaskId, completedMinutes, intelligenceReport);
          setFocusRunning(false);
          stopIntelligenceMonitoring();
          return focusDuration * 60;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    buildIntelligenceReport,
    currentTaskId,
    focusDuration,
    focusIntelEnabled,
    focusRunning,
    onLogFocusSession,
  ]);

  useEffect(() => {
    if (!currentTaskId || !focusRunning || !focusIntelEnabled) {
      stopIntelligenceMonitoring();
      return;
    }

    const tracker = trackingRef.current;
    tracker.cameraSupported = typeof window !== "undefined" && "FaceDetector" in window;
    tracker.cameraPermission = "requesting";
    tracker.cameraUsed = false;
    tracker.sampleCount = 0;
    tracker.attentiveSampleCount = 0;
    tracker.tabAwayEvents = 0;
    tracker.windowBlurEvents = 0;
    tracker.idleEvents = 0;
    tracker.interactionEvents = 0;
    tracker.lastInteractionAt = Date.now();
    tracker.samplingInProgress = false;
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
      if (tracker.samplingInProgress) {
        return;
      }

      if (document.hidden || !tracker.video || tracker.video.readyState < 2) {
        syncLiveIntelligenceState();
        return;
      }

      tracker.samplingInProgress = true;
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
      } finally {
        tracker.samplingInProgress = false;
      }

      syncLiveIntelligenceState();
    };

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
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
        }, 1800);
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
  }, [currentTaskId, focusIntelEnabled, focusRunning]);

  useEffect(() => {
    return () => stopIntelligenceMonitoring();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-600/80">Lock In Mode</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Full-Screen Focus Monitor</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick a task, start the timer, and monitor attention with a large live camera feed.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="h-[56vh] min-h-[360px] w-full object-cover [transform:scaleX(-1)]"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Live preview is used only for session monitoring. Video is not stored.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.45)]">
          <label className="block text-xs uppercase tracking-wide text-slate-500">
            Current Task
            <select
              value={currentTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-300 focus:outline-none"
            >
              {incompleteTasks.length === 0 ? (
                <option value="">No active tasks</option>
              ) : (
                incompleteTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Timer</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
              {formatTimer(secondsRemaining)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[15, 25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setFocusDuration(minutes);
                    if (!focusRunning) setSecondsRemaining(minutes * 60);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    focusDuration === minutes
                      ? "border border-sky-300 bg-white text-sky-700"
                      : "border border-transparent bg-sky-100 text-sky-700 hover:bg-sky-200"
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium">Focus Intelligence Monitoring</span>
            <input
              type="checkbox"
              checked={focusIntelEnabled}
              onChange={(event) => setFocusIntelEnabled(event.target.checked)}
              className="h-4 w-4 accent-sky-500"
            />
          </label>

          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
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
              Attention: <span className="font-medium text-slate-800">{liveAttentionPercent}%</span>
            </p>
            <p>
              Attention State:{" "}
              <span className="font-medium capitalize text-slate-800">{intelLive.attentionState}</span>
            </p>
            <p>
              Distractions:{" "}
              <span className="font-medium text-slate-800">{liveDistractionEvents}</span>
            </p>
            <p>
              Interactions:{" "}
              <span className="font-medium text-slate-800">{intelLive.interactionEvents}</span>
            </p>
            <p>
              Confidence: <span className="font-medium capitalize text-slate-800">{liveConfidence}</span>
            </p>
            <p className="sm:col-span-2">
              Measurement mode:{" "}
              <span className="font-medium text-slate-800">{liveMeasurementMode}</span>
            </p>
            <p className="sm:col-span-2 text-[11px] text-slate-500">
              Highest accuracy requires camera permission + staying on this tab with your face in frame.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!focusRunning ? (
              <button
                type="button"
                disabled={!currentTaskId}
                onClick={() => setFocusRunning(true)}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Start Lock In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFocusRunning(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Pause
              </button>
            )}

            <button
              type="button"
              disabled={!currentTaskId}
              onClick={() => finishSession(false)}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Complete Session
            </button>

            <button
              type="button"
              disabled={!currentTaskId}
              onClick={() => finishSession(true)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Complete + Mark Done
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
