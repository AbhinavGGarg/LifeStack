function normalizeText(value) {
  return String(value || "").trim();
}

function fallbackReply(message, user) {
  const text = normalizeText(message).toLowerCase();
  const name = normalizeText(user?.profile?.name) || "there";
  const goals = normalizeText(user?.profile?.goals);
  const interests = Array.isArray(user?.profile?.interests)
    ? user.profile.interests.filter(Boolean).slice(0, 3)
    : [];

  if (!text) {
    return `Hey ${name}, tell me what you want to work on and I will break it into the next 3 action steps.`;
  }

  if (text.includes("procrast") || text.includes("overwhelm")) {
    return `You are not behind, ${name}. Pick one 20-minute task, start a focus session, and message me when it's done.`;
  }

  if (text.includes("opportunit") || text.includes("internship") || text.includes("scholarship")) {
    return "Open Opportunities, save 3 strong matches, and move your top one to Applying before tonight.";
  }

  if (text.includes("college") || text.includes("major")) {
    return "Use Profile to refine your intended major, then review your trajectory and opportunities for that path.";
  }

  if (text.includes("study") || text.includes("task") || text.includes("plan")) {
    return "Try this sequence: one quick win task, one high-priority block, then one application task.";
  }

  if (goals) {
    return `Based on your goal "${goals}", your next move is one focused task right now and one deadline-based task tonight.`;
  }

  if (interests.length > 0) {
    return `Use your ${interests.join(", ")} interests to pick one relevant opportunity and one skill-building task today.`;
  }

  return `I can help you plan tasks, pick opportunities, and stay consistent, ${name}. Tell me your top goal this week.`;
}

export async function getNovaReply({ message, history = [], user = null }) {
  const fallback = fallbackReply(message, user);
  const apiKey = process.env.FEATHERLESS_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const baseUrl = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
  const model =
    process.env.FEATHERLESS_NOVA_MODEL ||
    "meta-llama/Meta-Llama-3.1-8B-Instruct";

  const name = normalizeText(user?.profile?.name) || "Student";
  const grade = normalizeText(user?.profile?.grade) || "unknown grade";
  const goals = normalizeText(user?.profile?.goals) || "not set";
  const interests = Array.isArray(user?.profile?.interests)
    ? user.profile.interests.filter(Boolean).join(", ")
    : "";

  const recentHistory = Array.isArray(history)
    ? history
        .slice(-4)
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
        "You are NOVA, a student execution coach inside LifeStack.",
        "Keep responses concise and actionable.",
        "Use at most 2 short sentences.",
        "Always end with one concrete next action.",
        "Tone: supportive, direct, no fluff.",
      ].join(" "),
    },
    {
      role: "system",
      content: `Student profile: name=${name}, grade=${grade}, interests=${interests || "none"}, goals=${goals}.`,
    },
    ...recentHistory,
    { role: "user", content: normalizeText(message) },
  ];

  let timeoutId;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 110,
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
    return text || fallback;
  } catch {
    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
