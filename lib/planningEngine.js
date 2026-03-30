function containsAny(source, keywords) {
  return keywords.some((keyword) => source.includes(keyword));
}

function normalizeGoalTitle(goalTitle) {
  return String(goalTitle || "").trim().toLowerCase();
}

function withIds(items) {
  return items.map((item, index) => ({
    id: `m-${index + 1}`,
    ...item,
  }));
}

export function createGoalPlanBlueprint(goalTitle) {
  const normalized = normalizeGoalTitle(goalTitle);

  if (containsAny(normalized, ["sat", "act", "test prep", "standardized"])) {
    return {
      suggestedCadence: "5 focused blocks per week",
      weeklyMilestones: withIds([
        { title: "Set a baseline score with one timed practice test" },
        { title: "Complete 4 targeted practice blocks in weak areas" },
        { title: "Review mistakes and create a correction sheet" },
        { title: "Retake one timed section and compare score movement" },
      ]),
      suggestedTasks: [
        {
          title: "45-min SAT math drill",
          priority: "high",
          estimateMinutes: 45,
          category: "study",
        },
        {
          title: "30-min reading passage sprint",
          priority: "medium",
          estimateMinutes: 30,
          category: "study",
        },
        {
          title: "Review error log and pattern notes",
          priority: "high",
          estimateMinutes: 25,
          category: "study",
        },
      ],
    };
  }

  if (containsAny(normalized, ["internship", "application", "resume", "career"])) {
    return {
      suggestedCadence: "3 execution sessions + 2 outreach actions per week",
      weeklyMilestones: withIds([
        { title: "Finalize resume and portfolio links" },
        { title: "Identify and save 10 high-fit opportunities" },
        { title: "Submit at least 3 quality applications" },
        { title: "Send follow-up or networking outreach messages" },
      ]),
      suggestedTasks: [
        {
          title: "Tailor resume for one target role",
          priority: "high",
          estimateMinutes: 35,
          category: "application",
        },
        {
          title: "Draft one internship application response set",
          priority: "high",
          estimateMinutes: 40,
          category: "application",
        },
        {
          title: "Reach out to 1 mentor/alumni on LinkedIn",
          priority: "medium",
          estimateMinutes: 20,
          category: "networking",
        },
      ],
    };
  }

  if (containsAny(normalized, ["startup", "business", "build", "saas", "product"])) {
    return {
      suggestedCadence: "Daily product progress with weekly shipping milestone",
      weeklyMilestones: withIds([
        { title: "Define one clear user problem and target user" },
        { title: "Build and ship one feature or prototype iteration" },
        { title: "Collect feedback from at least 3 real users" },
        { title: "Decide next sprint priorities based on learnings" },
      ]),
      suggestedTasks: [
        {
          title: "Run 20-min user research interview",
          priority: "high",
          estimateMinutes: 20,
          category: "startup",
        },
        {
          title: "Ship one small product improvement",
          priority: "high",
          estimateMinutes: 60,
          category: "deep-work",
        },
        {
          title: "Write weekly startup build log",
          priority: "medium",
          estimateMinutes: 25,
          category: "planning",
        },
      ],
    };
  }

  if (containsAny(normalized, ["math", "chem", "physics", "bio", "grade", "class"])) {
    return {
      suggestedCadence: "Daily focused review + weekly checkpoint",
      weeklyMilestones: withIds([
        { title: "List weak topics and plan review sequence" },
        { title: "Complete 3 focused problem sets" },
        { title: "Meet teacher/tutor or office hours for feedback" },
        { title: "Take one timed quiz simulation" },
      ]),
      suggestedTasks: [
        {
          title: "50-min focused study block",
          priority: "high",
          estimateMinutes: 50,
          category: "study",
        },
        {
          title: "Create summary notes for one weak topic",
          priority: "medium",
          estimateMinutes: 30,
          category: "study",
        },
        {
          title: "Do a timed mixed practice set",
          priority: "high",
          estimateMinutes: 35,
          category: "study",
        },
      ],
    };
  }

  return {
    suggestedCadence: "Consistent daily execution with weekly review",
    weeklyMilestones: withIds([
      { title: "Clarify objective and define weekly success metric" },
      { title: "Complete 3 high-impact action blocks" },
      { title: "Review blockers and adjust plan" },
      { title: "Ship one visible win and set next week priority" },
    ]),
    suggestedTasks: [
      {
        title: "Deep work session",
        priority: "high",
        estimateMinutes: 45,
        category: "deep-work",
      },
      {
        title: "Progress review and next-step planning",
        priority: "medium",
        estimateMinutes: 20,
        category: "planning",
      },
      {
        title: "One accountability check-in",
        priority: "medium",
        estimateMinutes: 15,
        category: "accountability",
      },
    ],
  };
}
