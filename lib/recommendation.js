function buildFallbackRecommendation(user, opportunity) {
  const interests = Array.isArray(user?.interests)
    ? user.interests.map((item) => String(item).toLowerCase())
    : [];

  const tags = Array.isArray(opportunity?.tags)
    ? opportunity.tags.map((item) => String(item).toLowerCase())
    : [];

  const matched = tags.filter((tag) => interests.includes(tag));

  if (matched.length > 0) {
    return `Based on your interest in ${matched.slice(0, 2).join(" and ")}, this ${opportunity.category} is a strong fit.`;
  }

  return `This ${opportunity.category} can help you build momentum toward your goal: ${user?.goals || "long-term career growth"}.`;
}

export async function getOpportunityRecommendation(user, opportunity) {
  const fallback = buildFallbackRecommendation(user, opportunity);
  const apiKey = process.env.FEATHERLESS_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const baseUrl = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
  const model =
    process.env.FEATHERLESS_MODEL ||
    "meta-llama/Meta-Llama-3.1-8B-Instruct";

  const prompt = [
    "You are helping a student decide if they should apply for an opportunity.",
    "Write one short sentence (max 20 words), practical and motivating.",
    `Student interests: ${Array.isArray(user?.interests) ? user.interests.join(", ") : ""}`,
    `Student goal: ${user?.goals || ""}`,
    `Opportunity: ${opportunity?.title}`,
    `Category: ${opportunity?.category}`,
    `Tags: ${Array.isArray(opportunity?.tags) ? opportunity.tags.join(", ") : ""}`,
  ].join("\n");

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 60,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return fallback;
    }

    return text;
  } catch {
    return fallback;
  }
}
