function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeForCompare(value) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, " ");
}

function extractTopic(message) {
  const text = normalizeText(message);
  if (!text) return "your goal";
  const firstChunk = text.split(/[?.!\n]/)[0];
  return normalizeText(firstChunk).slice(0, 80) || "your goal";
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
    gradeCourseCount:
      Number.isFinite(Number(context?.gradeCourseCount)) && Number(context.gradeCourseCount) >= 0
        ? Math.round(Number(context.gradeCourseCount))
        : 0,
    gradeAveragePercent:
      Number.isFinite(Number(context?.gradeAveragePercent))
        ? Math.max(0, Math.min(100, Number(context.gradeAveragePercent)))
        : null,
  };
}

function getLastAssistantMessage(history = []) {
  if (!Array.isArray(history)) {
    return "";
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item?.role === "assistant" && normalizeText(item?.content)) {
      return normalizeText(item.content);
    }
  }

  return "";
}

function getLastUserMessage(history = []) {
  if (!Array.isArray(history)) {
    return "";
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item?.role === "user" && normalizeText(item?.content)) {
      return normalizeText(item.content);
    }
  }

  return "";
}

function rewriteIfRepeated({ candidateReply, message, context, history }) {
  const candidate = normalizeText(candidateReply);
  const previousAssistant = getLastAssistantMessage(history);

  if (!candidate) {
    return candidate;
  }

  if (normalizeForCompare(candidate) !== normalizeForCompare(previousAssistant)) {
    return candidate;
  }

  const ctx = normalizeContext(context);
  const topic = extractTopic(message);
  const nextTask = ctx.topTasks[0] || "one focused task";

  return `Different angle on "${topic}": do ${nextTask} for 25 minutes, then spend 15 minutes on your next deadline. Start now and send me your result.`;
}

function buildFallbackResponse(message, user, context = {}) {
  const text = normalizeText(message).toLowerCase();
  const name = normalizeText(user?.profile?.name) || "there";
  const goals = normalizeText(user?.profile?.goals);
  const interests = Array.isArray(user?.profile?.interests)
    ? user.profile.interests.filter(Boolean).slice(0, 3)
    : [];
  const ctx = normalizeContext(context);
  const topic = extractTopic(message);
  const mentionsHomework =
    text.includes("homework") || text.includes("assignment") || text.includes("due");
  const mentionsExam =
    text.includes("test") ||
    text.includes("exam") ||
    text.includes("quiz") ||
    text.includes("midterm") ||
    text.includes("final");
  const mentionsOpportunity =
    text.includes("internship") ||
    text.includes("scholarship") ||
    text.includes("opportunit") ||
    text.includes("hackathon");
  const mentionsFriendOrRelationship =
    text.includes("friend") ||
    text.includes("fake") ||
    text.includes("drama") ||
    text.includes("relationship");
  const mentionsProcrastination =
    text.includes("procrast") || text.includes("overwhelm") || text.includes("behind");
  const mentionsScheduling =
    text.includes("when should i start") ||
    text.includes("when should i") ||
    text.includes("how should i start") ||
    text.includes("schedule") ||
    text.includes("plan");

  if (!text) {
    return {
      reply: `Hey ${name}, tell me your biggest blocker and I’ll give you one focused next move.`,
      actions: [
        { type: "prompt", label: "Plan my day", prompt: "Help me plan today in 3 steps." },
        { type: "prompt", label: "Beat procrastination", prompt: "I keep procrastinating. What should I do first?" },
      ],
    };
  }

  if (text.includes("ap calculus") || mentionsExam) {
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

  if (mentionsHomework && mentionsScheduling) {
    const gradeHint = Number.isFinite(ctx.gradeAveragePercent)
      ? ` Your current pulled average is ${ctx.gradeAveragePercent}%, so start early.`
      : "";
    return {
      reply:
        `Start today with a 25-minute setup block, then do one 40-minute work block tomorrow so you are not rushing near the deadline.${gradeHint}`,
      actions: [
        {
          type: "task",
          label: "Add: Homework setup block",
          task: { title: "Homework setup and outline", priority: "high", estimateMinutes: 25, category: "homework" },
        },
        {
          type: "task",
          label: "Add: Homework deep work block",
          task: { title: "Homework deep work block", priority: "high", estimateMinutes: 40, category: "homework" },
        },
        { type: "route", label: "Open Lock In", href: "/lock-in" },
      ],
    };
  }

  if (mentionsProcrastination) {
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

  if (mentionsOpportunity) {
    return {
      reply: `You currently have ${ctx.savedOpportunities} saved opportunities. Save 2 more strong fits and move one to Applying tonight.`,
      actions: [
        { type: "route", label: "Open Opportunities", href: "/opportunities" },
        { type: "route", label: "Open Tracker", href: "/tracker" },
      ],
    };
  }

  if (mentionsFriendOrRelationship) {
    return {
      reply:
        "Be direct once and calm: tell them what felt fake using one clear example. If behavior stays the same, step back and protect your energy.",
      actions: [
        {
          type: "prompt",
          label: "Draft what to say",
          prompt: "Help me write a calm 2-sentence message to a friend who feels fake.",
        },
      ],
    };
  }

  if (goals) {
    return {
      reply: `To move "${goals}" forward, complete one high-priority block now, then one deadline-linked step tonight.`,
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
      reply: `Your "${topic}" question fits your ${interests.join(", ")} path. Do one practice task and one opportunity action today.`,
      actions: [{ type: "route", label: "Open Dashboard", href: "/dashboard" }],
    };
  }

  return {
    reply: `For "${topic}", give me your deadline and I’ll map exact next steps. For now, do one 25-minute focused block tonight.`,
    actions: [
      { type: "prompt", label: "Get exact plan", prompt: `Help me plan "${topic}" with a deadline and 3 clear steps.` },
      { type: "route", label: "Open Lock In", href: "/lock-in" },
    ],
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
  const previousAssistant = getLastAssistantMessage(recentHistory);
  const previousUser = getLastUserMessage(recentHistory);

  const messages = [
    {
      role: "system",
      content: [
        "You are NOVA, a student execution coach in LifeStack.",
        "Directly answer the user's exact question first.",
        "Then give one concrete next action.",
        "Max 3 short sentences total.",
        "No generic filler.",
        "Do not repeat the same opening sentence used in your previous reply.",
      ].join(" "),
    },
    {
      role: "system",
      content: [
        `Profile: name=${name}, grade=${grade}, gpa=${gpa}, goals=${goals}, interests=${interests || "none"}, extracurriculars=${extracurriculars || "none"}, intendedMajor=${intendedMajor}, majorRecommendation=${majorRecommendation}, targetRole=${targetRole}.`,
        `Live context: topTasks=${ctx.topTasks.join(" | ") || "none"}, savedOpportunities=${ctx.savedOpportunities}, focusMinutesToday=${ctx.focusMinutesToday}, executionScore=${ctx.executionScore}, gradeCourseCount=${ctx.gradeCourseCount}, gradeAveragePercent=${ctx.gradeAveragePercent ?? "unknown"}.`,
        previousAssistant ? `Previous assistant reply to avoid repeating: ${previousAssistant}` : "",
        previousUser ? `Previous user message: ${previousUser}` : "",
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

    const refinedReply = rewriteIfRepeated({
      candidateReply: text,
      message,
      context,
      history: recentHistory,
    });

    return {
      reply: refinedReply,
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
