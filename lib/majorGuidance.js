const RAW_MAJOR_OPTIONS = [
  ["computer-science", "Computer Science"],
  ["software-engineering", "Software Engineering"],
  ["data-science", "Data Science"],
  ["artificial-intelligence", "Artificial Intelligence"],
  ["machine-learning", "Machine Learning"],
  ["cybersecurity", "Cybersecurity"],
  ["information-systems", "Information Systems"],
  ["information-technology", "Information Technology"],
  ["computer-engineering", "Computer Engineering"],
  ["business", "Business"],
  ["business-administration", "Business Administration"],
  ["finance", "Finance"],
  ["accounting", "Accounting"],
  ["marketing", "Marketing"],
  ["entrepreneurship", "Entrepreneurship"],
  ["management", "Management"],
  ["supply-chain", "Supply Chain Management"],
  ["economics", "Economics"],
  ["biology", "Biology / Pre-Med"],
  ["biochemistry", "Biochemistry"],
  ["neuroscience", "Neuroscience"],
  ["public-health", "Public Health"],
  ["nursing", "Nursing"],
  ["environmental-science", "Environmental Science"],
  ["engineering", "Engineering"],
  ["mechanical-engineering", "Mechanical Engineering"],
  ["electrical-engineering", "Electrical Engineering"],
  ["civil-engineering", "Civil Engineering"],
  ["chemical-engineering", "Chemical Engineering"],
  ["aerospace-engineering", "Aerospace Engineering"],
  ["industrial-engineering", "Industrial Engineering"],
  ["biomedical-engineering", "Biomedical Engineering"],
  ["materials-engineering", "Materials Engineering"],
  ["psychology", "Psychology"],
  ["cognitive-science", "Cognitive Science"],
  ["sociology", "Sociology"],
  ["anthropology", "Anthropology"],
  ["human-development", "Human Development"],
  ["design", "Design / UX"],
  ["ux-design", "UX Design"],
  ["ui-design", "UI Design"],
  ["graphic-design", "Graphic Design"],
  ["product-design", "Product Design"],
  ["architecture", "Architecture"],
  ["political-science", "Political Science"],
  ["international-relations", "International Relations"],
  ["public-policy", "Public Policy"],
  ["history", "History"],
  ["philosophy", "Philosophy"],
  ["law-prelaw", "Law / Pre-Law"],
  ["criminal-justice", "Criminal Justice"],
  ["mathematics", "Mathematics"],
  ["statistics", "Statistics"],
  ["physics", "Physics"],
  ["chemistry", "Chemistry"],
  ["english", "English"],
  ["communications", "Communications"],
  ["journalism", "Journalism"],
  ["education", "Education"],
  ["health-sciences", "Health Sciences"],
  ["undecided", "I don't know yet (Undecided)"],
];

export const MAJOR_OPTIONS = RAW_MAJOR_OPTIONS.map(([value, label]) => ({ value, label }));

export const MAJOR_SEARCH_OPTIONS = Array.from(
  new Set(MAJOR_OPTIONS.map((option) => option.label))
).sort((a, b) => a.localeCompare(b));

const TRACK_ALIASES = {
  "computer-science": [
    "computer science",
    "cs",
    "software engineering",
    "data science",
    "artificial intelligence",
    "ai",
    "machine learning",
    "cybersecurity",
    "information systems",
    "information technology",
    "computer engineering",
    "informatics",
  ],
  business: [
    "business",
    "business administration",
    "management",
    "entrepreneurship",
    "finance",
    "accounting",
    "marketing",
    "supply chain",
    "operations",
    "real estate",
  ],
  biology: [
    "biology",
    "pre med",
    "premed",
    "biochemistry",
    "neuroscience",
    "public health",
    "health sciences",
    "nursing",
    "medicine",
    "biotech",
    "environmental science",
    "chemistry",
  ],
  engineering: [
    "engineering",
    "mechanical engineering",
    "electrical engineering",
    "civil engineering",
    "chemical engineering",
    "aerospace engineering",
    "industrial engineering",
    "biomedical engineering",
    "materials engineering",
    "robotics",
    "physics",
  ],
  economics: [
    "economics",
    "applied economics",
    "statistics",
    "math",
    "mathematics",
    "quantitative",
    "actuarial",
    "analytics",
    "finance economics",
  ],
  psychology: [
    "psychology",
    "cognitive science",
    "sociology",
    "anthropology",
    "human development",
    "behavioral science",
    "social work",
    "mental health",
  ],
  design: [
    "design",
    "ux",
    "ui",
    "ux design",
    "ui design",
    "graphic design",
    "product design",
    "architecture",
    "creative media",
    "animation",
    "game design",
  ],
  "political-science": [
    "political science",
    "international relations",
    "public policy",
    "government",
    "history",
    "philosophy",
    "law",
    "pre law",
    "criminal justice",
    "public affairs",
  ],
};

export const MAJOR_TRACKS = {
  "computer-science": {
    label: "Computer Science",
    description: "Build strong coding fundamentals and product shipping velocity.",
    classes: ["AP Computer Science A", "Calculus", "Data Structures", "Intro to AI"],
    colleges: ["Carnegie Mellon", "MIT", "Stanford", "Georgia Tech"],
    opportunityTags: ["coding", "ai", "software", "web", "machine-learning", "systems"],
  },
  business: {
    label: "Business",
    description: "Develop strategy, finance, and leadership through real projects.",
    classes: ["Microeconomics", "Accounting Basics", "Marketing", "Entrepreneurship"],
    colleges: ["UPenn (Wharton)", "NYU Stern", "UT Austin McCombs", "USC Marshall"],
    opportunityTags: ["business", "finance", "marketing", "entrepreneurship", "startup"],
  },
  biology: {
    label: "Biology / Pre-Med",
    description: "Build lab, research, and scientific communication depth.",
    classes: ["AP Biology", "Chemistry", "Statistics", "Research Methods"],
    colleges: ["Johns Hopkins", "Duke", "UC San Diego", "UCLA"],
    opportunityTags: ["biology", "medicine", "research", "science", "chemistry", "biotech"],
  },
  engineering: {
    label: "Engineering",
    description: "Focus on math rigor and hands-on building challenges.",
    classes: ["AP Physics", "Calculus", "CAD / Design", "Engineering Design"],
    colleges: ["Purdue", "Georgia Tech", "UIUC", "Texas A&M"],
    opportunityTags: ["engineering", "robotics", "physics", "coding", "innovation"],
  },
  economics: {
    label: "Economics",
    description: "Develop analytical reasoning for policy, markets, and strategy.",
    classes: ["AP Macro", "AP Micro", "Statistics", "Data Analysis"],
    colleges: ["UChicago", "Northwestern", "Columbia", "UC Berkeley"],
    opportunityTags: ["economics", "finance", "policy", "data", "business"],
  },
  psychology: {
    label: "Psychology",
    description: "Build behavioral science understanding and research habits.",
    classes: ["AP Psychology", "Statistics", "Research Methods", "Behavioral Science"],
    colleges: ["UCLA", "UMich", "UC Berkeley", "Yale"],
    opportunityTags: ["psychology", "research", "health", "community", "policy"],
  },
  design: {
    label: "Design / UX",
    description: "Develop visual, product, and user-centered design skills.",
    classes: ["Design Thinking", "Visual Communication", "Product Design", "Human Factors"],
    colleges: ["RISD", "Parsons", "Carnegie Mellon", "SCAD"],
    opportunityTags: ["design", "ux", "product", "web", "creative"],
  },
  "political-science": {
    label: "Political Science",
    description: "Build policy analysis, writing, and civic leadership depth.",
    classes: ["AP Government", "Debate", "Comparative Politics", "Public Policy"],
    colleges: ["Georgetown", "Princeton", "GWU", "UVA"],
    opportunityTags: ["policy", "leadership", "community", "nonprofit", "social-impact"],
  },
};

export const MAJOR_QUIZ_QUESTIONS = [
  {
    id: "work_style",
    prompt: "Which type of work sounds most energizing?",
    options: [
      {
        id: "build_tools",
        label: "Building software/tools that people use",
        weights: { "computer-science": 3, engineering: 2, design: 1 },
      },
      {
        id: "lead_teams",
        label: "Leading teams and launching ideas",
        weights: { business: 3, economics: 2, "political-science": 1 },
      },
      {
        id: "science_research",
        label: "Researching science and health problems",
        weights: { biology: 3, psychology: 2, engineering: 1 },
      },
      {
        id: "human_behavior",
        label: "Understanding behavior and helping people",
        weights: { psychology: 3, "political-science": 2, biology: 1 },
      },
    ],
  },
  {
    id: "favorite_subject",
    prompt: "Which school subject do you enjoy most right now?",
    options: [
      {
        id: "math_cs",
        label: "Math / coding",
        weights: { "computer-science": 3, engineering: 3, economics: 1 },
      },
      {
        id: "science_lab",
        label: "Biology / chemistry labs",
        weights: { biology: 3, engineering: 1, psychology: 1 },
      },
      {
        id: "social_business",
        label: "Business / economics / social studies",
        weights: { business: 2, economics: 3, "political-science": 2 },
      },
      {
        id: "creative_design",
        label: "Art / design / media",
        weights: { design: 3, business: 1, "computer-science": 1 },
      },
    ],
  },
  {
    id: "impact_goal",
    prompt: "What kind of long-term impact do you want to make?",
    options: [
      {
        id: "ship_products",
        label: "Build products used by millions",
        weights: { "computer-science": 3, business: 2, design: 2 },
      },
      {
        id: "improve_health",
        label: "Improve health/science outcomes",
        weights: { biology: 3, psychology: 2, engineering: 1 },
      },
      {
        id: "shape_policy",
        label: "Shape policy and institutions",
        weights: { "political-science": 3, economics: 2, psychology: 1 },
      },
      {
        id: "invent_solutions",
        label: "Invent physical or technical solutions",
        weights: { engineering: 3, "computer-science": 2, biology: 1 },
      },
    ],
  },
  {
    id: "project_type",
    prompt: "What project type would you choose this weekend?",
    options: [
      {
        id: "hack_project",
        label: "Hackathon or coding build",
        weights: { "computer-science": 3, engineering: 2, design: 1 },
      },
      {
        id: "startup_pitch",
        label: "Startup pitch/business challenge",
        weights: { business: 3, economics: 2, design: 1 },
      },
      {
        id: "research_project",
        label: "Research paper or lab concept",
        weights: { biology: 3, psychology: 2, "political-science": 1 },
      },
      {
        id: "campaign_project",
        label: "Community or policy initiative",
        weights: { "political-science": 3, psychology: 2, business: 1 },
      },
    ],
  },
];

const DEFAULT_TRACK = {
  label: "Undecided",
  description: "Explore broadly while building execution habits and evidence from projects.",
  classes: ["Statistics", "Public Speaking", "Intro to Programming", "Research Methods"],
  colleges: ["Look for strong exploratory first-year programs", "Prioritize schools with major flexibility"],
  opportunityTags: ["leadership", "research", "startup", "coding", "community"],
};

function toTitleCase(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeMajorText(value) {
  return normalizeMajorValue(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMajorValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function isUndecidedMajor(value) {
  const normalized = normalizeMajorText(value);

  if (!normalized) {
    return false;
  }

  return (
    normalized === "undecided" ||
    normalized.includes("dont know") ||
    normalized.includes("do not know") ||
    normalized.includes("not sure") ||
    normalized.includes("exploring")
  );
}

export function inferMajorFromInput(value) {
  const raw = String(value || "").trim();
  const normalizedValue = normalizeMajorValue(raw);
  const normalizedText = normalizeMajorText(raw);

  if (!normalizedText) {
    return {
      major: "undecided",
      confidence: "low",
      matchedAlias: "",
      score: 0,
    };
  }

  if (isUndecidedMajor(raw)) {
    return {
      major: "undecided",
      confidence: "low",
      matchedAlias: "undecided",
      score: 0,
    };
  }

  if (MAJOR_TRACKS[normalizedValue]) {
    return {
      major: normalizedValue,
      confidence: "high",
      matchedAlias: normalizedValue,
      score: 10,
    };
  }

  const scores = {};
  const matchedAliases = {};
  const textTokens = normalizedText.split(" ").filter(Boolean);

  Object.entries(TRACK_ALIASES).forEach(([track, aliases]) => {
    aliases.forEach((alias) => {
      const normalizedAlias = normalizeMajorText(alias);
      if (!normalizedAlias) {
        return;
      }

      let score = 0;

      if (normalizedText === normalizedAlias) {
        score += 8;
      } else if (normalizedText.includes(normalizedAlias)) {
        score += 5;
      } else if (normalizedAlias.includes(normalizedText) && normalizedText.length >= 4) {
        score += 4;
      }

      const aliasTokens = normalizedAlias.split(" ").filter(Boolean);
      const overlap = aliasTokens.filter(
        (token) => token.length > 2 && textTokens.includes(token)
      ).length;
      score += overlap;

      if (score <= 0) {
        return;
      }

      scores[track] = (scores[track] || 0) + score;

      if (!matchedAliases[track] || score > matchedAliases[track].score) {
        matchedAliases[track] = {
          alias,
          score,
        };
      }
    });
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    return {
      major: "undecided",
      confidence: "low",
      matchedAlias: "",
      score: 0,
    };
  }

  const [bestMajor, bestScore] = ranked[0];
  const secondScore = ranked[1]?.[1] || 0;
  const delta = bestScore - secondScore;
  const confidence = bestScore >= 8 || delta >= 3 ? "high" : delta >= 1 ? "medium" : "low";

  return {
    major: bestMajor,
    confidence,
    matchedAlias: matchedAliases[bestMajor]?.alias || "",
    score: bestScore,
  };
}

export function resolveMajor(intendedMajor, majorRecommendation) {
  const preferred = normalizeMajorValue(intendedMajor);
  const fallback = normalizeMajorValue(majorRecommendation);

  if (preferred && preferred !== "undecided") {
    if (MAJOR_TRACKS[preferred]) {
      return preferred;
    }

    const inferredPreferred = inferMajorFromInput(intendedMajor);
    if (inferredPreferred.major !== "undecided") {
      return inferredPreferred.major;
    }
  }

  if (fallback && fallback !== "undecided") {
    if (MAJOR_TRACKS[fallback]) {
      return fallback;
    }

    const inferredFallback = inferMajorFromInput(majorRecommendation);
    if (inferredFallback.major !== "undecided") {
      return inferredFallback.major;
    }
  }

  return "undecided";
}

export function getMajorTrack(intendedMajor, majorRecommendation) {
  const majorKey = resolveMajor(intendedMajor, majorRecommendation);
  return MAJOR_TRACKS[majorKey] || DEFAULT_TRACK;
}

export function getMajorLabel(majorValue) {
  const key = normalizeMajorValue(majorValue);

  if (!key) {
    return "Undecided";
  }

  const optionByValue = MAJOR_OPTIONS.find((item) => item.value === key);
  if (optionByValue) {
    return optionByValue.label;
  }

  const inferred = inferMajorFromInput(majorValue);
  if (inferred.major && inferred.major !== "undecided") {
    return MAJOR_TRACKS[inferred.major]?.label || toTitleCase(String(majorValue));
  }

  return toTitleCase(normalizeMajorText(majorValue)) || "Undecided";
}

export function formatMajorInputValue(value) {
  const key = normalizeMajorValue(value);
  if (!key) {
    return "";
  }

  const option = MAJOR_OPTIONS.find((item) => item.value === key);
  if (option) {
    return option.label;
  }

  if (isUndecidedMajor(value)) {
    return "I don't know yet (Undecided)";
  }

  return String(value || "").trim();
}

export function recommendMajorFromQuizAnswers(answers = {}) {
  const scores = {};

  MAJOR_QUIZ_QUESTIONS.forEach((question) => {
    const selectedOptionId = answers[question.id];
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    if (!selectedOption) {
      return;
    }

    Object.entries(selectedOption.weights || {}).forEach(([major, weight]) => {
      scores[major] = (scores[major] || 0) + Number(weight || 0);
    });
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    return {
      major: "undecided",
      label: "Undecided",
      confidence: "low",
      scores,
    };
  }

  const [bestMajor, bestScore] = ranked[0];
  const secondScore = ranked[1]?.[1] || 0;
  const delta = bestScore - secondScore;

  const confidence = delta >= 3 ? "high" : delta >= 1 ? "medium" : "low";

  return {
    major: bestMajor,
    label: getMajorLabel(bestMajor),
    confidence,
    scores,
  };
}
