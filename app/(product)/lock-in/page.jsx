"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import LockInMode from "@/components/LockInMode";
import { useProductApp } from "@/components/ProductAppProvider";

export default function LockInPage() {
  const searchParams = useSearchParams();
  const { tasks, logFocusSession, toggleTask } = useProductApp();

  const initialTaskId = useMemo(() => {
    const raw = searchParams.get("task");
    return raw ? String(raw) : "";
  }, [searchParams]);

  return (
    <LockInMode
      tasks={tasks}
      initialTaskId={initialTaskId}
      onLogFocusSession={logFocusSession}
      onToggleTask={toggleTask}
    />
  );
}
