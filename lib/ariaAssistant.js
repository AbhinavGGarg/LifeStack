function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeContext(context = {}) {
  return {
    topTasks: Array.isArray(context?.topTasks)
      ? context.topTasks.map((item) => normalizeText(item)).filter(Boolean).slice(0, 4)
      : [],
    savedOpportunities:
      Number.isFinite(Number(context?.savedOpportunities)) && Number(context.savedOpportunities) >= 0
        ? Math.round(Number(context.savedOpportunities))
        : 0,
    focusMinutesToday:
      Number.isFinite(Number(context?.focusMinutesToday)) && Number(context.focusMinutesToday) >= 0
        ? Math.round(Number(context.focusMinutesToday))
        : 0,
    executionScore:
      Number.isFinite(Number(context?.executionScore)) && Number(context.executionScore) >= 0
        ? Math.round(Number(context.executionScore))
        : 0,
  };
}

function buildFallbackResponse(message, user, context = {}) {
  const text = normalizeText(message).toLowerCase();
  const name = normalizeText(user?.profile?.name) || "there";
  const goals = normalizeText(user?.profile?.goals);
  const interests = Array.isArray(user?.profile?.interests)
    ? user.profile.interests.filter(Boolean).slice(0, 3)
    : [];
  const ctx = normalizeContext(context);

  if (!text) {
    return {
      reply: `Hey ${name}, tell me your biggest blocker and I’ll give you one focused next move.`,
      actions: [
        { type: "prompt", label: "Plan my day", prompt: "Help me plan today in 3 steps." },
        { type: "prompt", label: "Beat procrastination", prompt: "I keep procrastinating. What should I do first?" },
      ],
    };
  }

  if (text.includes("ap calculus") || text.includes("test") || text.includes("exam")) {
    return {
      reply:
        "Run one 25-minute lock-in sprint on high-yield problems, then do a 10-minute formula recap. Start Lock In now.",
      actions: [
        {
          type: "task",
          label: "Add: 25m AP Calc sprint",
          task: { title: "AP Calculus high-yield problem sprint", priority: "high", estimateMinutes: 25, category: "study" },
        },
        { type: "route", label: "Open Lock In", href: "/lock-in" },
      ],
    };
  }

  if (text.includes("procrast") || text.includes("overwhelm")) {
    return {
      reply: `You are not behind, ${name}. Pick one 20-minute task and finish it before anything else.`,
      actions: [
        {
          type: "task",
          label: "Add: 20m quick win",
          task: { title: "20-minute quick win sprint", priority: "high", estimateMinutes: 20, category: "study" },
        },
        { type: "route", label: "Open Lock In", href: "/lock-in" },
      ],
    };
  }

  if (text.includes("opportunit") || text.includes("internship") || text.includes("scholarship")) {
    return {
      reply: `You currently have ${ctx.savedOpportunities} saved opportunities. Save 2 more strong fits and move one to Applying tonight.`,
      actions: [
        { type: "route", label: "Open Opportunities", href: "/opportunities" },
        { type: "route", label: "Open Tracker", href: "/tracker" },
      ],
    };
  }

  if (goals) {
    return {
      reply: `Based on your goal "${goals}", do one focused task now and one deadline task tonight.`,
      actions: [
        {
          type: "task",
          label: "Add: Goal progress block",
          task: { title: "Goal progress deep work block", priority: "high", estimateMinutes: 35, category: "deep-work" },
        },
      ],
    };
  }

  if (interests.length > 0) {
    return {
      reply: `Use your ${interests.join(", ")} interests for one skill task and one opportunity action today.`,
      actions: [{ type: "route", label: "Open Dashboard", href: "/dashboard" }],
    };
  }

  return {
    reply: `I can help you execute this week, ${name}. Tell me your top goal and I’ll give your next concrete move.`,
    actions: [{ type: "prompt", label: "Set this week goals", prompt: "Help me set my top 3 goals for this week." }],
  };
}

function buildFastActions(message = "") {
  const text = normalizeText(message).toLowerCase();

  if (text.includes("exam") || text.includes("test") || text.includes("study")) {
    return [
      {
        type: "task",
        label: "Add: 30m study sprint",
        task: { title: "30-minute study sprint", priority: "high", estimateMinutes: 30, category: "study" },
      },
      { type: "route", label: "Open Lock In", href: "/lock-in" },
    ];
  }

  if (text.includes("internship") || text.includes("scholarship") || text.includes("hackathon")) {
    return [{ type: "route", label: "Open Opportunities", href: "/opportunities" }];
  }

  return [{ type: "route", label: "Open Dashboard", href: "/dashboard" }];
}

export async function getNovaReply({ message, history = [], user = null, context = {} }) {
  const fallback = buildFallbackResponse(message, user, context);
  const apiKey = process.env.FEATHERLESS_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const baseUrl = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
  const model = process.env.FEATHERLESS_NOVA_MODEL || process.env.FEATHERLESS_MODEL || "meta-llama/Meta-Llama-3.1-8B-Instruct";

  const name = normalizeText(user?.profile?.name) || "Student";
  const grade = normalizeText(user?.profile?.grade) || "unknown grade";
  const goals = normalizeText(user?.profile?.goals) || "not set";
  const intendedMajor = normalizeText(user?.profile?.intendedMajor) || "not set";
  const majorRecommendation = normalizeText(user?.profile?.majorRecommendation) || "not set";
  const targetRole = normalizeText(user?.profile?.targetRole) || "not set";
  const interests = Array.isArray(user?.profile?.interests)
    ? user.profile.interests.filter(Boolean).join(", ")
    : "";
  const extracurriculars = Array.isArray(user?.profile?.extracurriculars)
    ? user.profile.extracurriculars.filter(Boolean).join(", ")
    : "";
  const gpa =
    Number.isFinite(Number(user?.profile?.gpa)) && Number(user.profile.gpa) > 0
      ? Number(user.profile.gpa).toFixed(2)
      : "not set";
  const ctx = normalizeContext(context);

  const recentHistory = Array.isArray(history)
    ? history
        .slice(-5)
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: normalizeText(item.content),
        }))
        .filter((item) => item.content)
    : [];

  const messages = [
    {
      role: "system",
      content: [
        "You are NOVA, a student execution coach in LifeStack.",
        "Directly answer the user's exact question first.",
        "Then give one concrete next action.",
        "Max 3 short sentences total.",
        "No generic filler.",
      ].join(" "),
    },
    {
      role: "system",
      content: [
        `Profile: name=${name}, grade=${grade}, gpa=${gpa}, goals=${goals}, interests=${interests || "none"}, extracurriculars=${extracurriculars || "none"}, intendedMajor=${intendedMajor}, majorRecommendation=${majorRecommendation}, targetRole=${targetRole}.`,
        `Live context: topTasks=${ctx.topTasks.join(" | ") || "none"}, savedOpportunities=${ctx.savedOpportunities}, focusMinutesToday=${ctx.focusMinutesToday}, executionScore=${ctx.executionScore}.`,
      ].join(" "),
    },
    ...recentHistory,
    { role: "user", content: normalizeText(message) },
  ];

  let timeoutId;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 8500);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 120,
        messages,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const text = normalizeText(payload?.choices?.[0]?.message?.content);

    if (!text) {
      return fallback;
    }

    return {
      reply: text,
      actions: buildFastActions(message),
    };
  } catch {
    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
