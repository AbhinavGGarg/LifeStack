"use client";

import { useCallback, useMemo, useRef, useState } from "react";

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getSpeechRecognition() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function speakText(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function NovaAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey, I’m Nova. Tell me what you need help with and I’ll give you your next best move.",
      time: formatTime(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported] = useState(Boolean(getSpeechRecognition()));
  const recognitionRef = useRef(null);

  const historyForApi = useMemo(() => {
    return messages.slice(-8).map((item) => ({
      role: item.role,
      content: item.content,
    }));
  }, [messages]);

  const askNova = useCallback(
    async (content) => {
      const trimmed = String(content || "").trim();
      if (!trimmed || processing) {
        return;
      }

      const userMessage = { role: "user", content: trimmed, time: formatTime() };
      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      setProcessing(true);

      try {
        const response = await fetch("/api/nova", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: [...historyForApi, { role: "user", content: trimmed }],
          }),
        });

        const payload = await response.json();
        const reply =
          String(payload?.reply || "").trim() ||
          "I’m here with you. Give me your main goal and I’ll break it down fast.";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, time: formatTime() },
        ]);

        if (voiceEnabled) {
          speakText(reply);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I hit a connection issue. Try again and I’ll keep helping.",
            time: formatTime(),
          },
        ]);
      } finally {
        setProcessing(false);
      }
    },
    [historyForApi, processing, voiceEnabled]
  );

  function startListening() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition || listening) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setDraft(transcript.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    askNova(draft);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_14%,rgba(14,165,233,0.2),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.14),transparent_28%),#f2f6fb] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_35px_95px_-60px_rgba(15,23,42,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-600/80">LifeStack Voice</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">NOVA</h1>
              <p className="mt-1 text-sm text-slate-600">Next-step voice coach for students</p>
            </div>
            <a
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Back to Dashboard
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_35px_95px_-60px_rgba(15,23,42,0.6)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-800">Conversation</p>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(event) => setVoiceEnabled(event.target.checked)}
                  className="h-4 w-4 accent-sky-500"
                />
                Speak responses
              </label>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                  listening
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {listening ? "Listening" : "Idle"}
              </span>
            </div>
          </div>

          <div className="h-[48vh] min-h-[320px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "border border-sky-100 bg-white text-slate-800"
                    : "ml-auto bg-sky-500 text-white"
                }`}
              >
                <p>{message.content}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    message.role === "assistant" ? "text-slate-400" : "text-sky-100"
                  }`}
                >
                  {message.time}
                </p>
              </article>
            ))}

            {processing ? (
              <div className="max-w-[92%] rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-500">
                Nova is thinking...
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Ask Nova anything about planning, school, opportunities, or next actions..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={processing || !draft.trim()}
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>

              {speechSupported ? (
                listening ? (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Stop Mic
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startListening}
                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Start Mic
                  </button>
                )
              ) : (
                <p className="self-center text-xs text-amber-700">
                  Voice input is not supported in this browser.
                </p>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
