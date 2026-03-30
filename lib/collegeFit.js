import { collegeBenchmarks } from "@/lib/collegeData";
import { getMajorTrack } from "@/lib/majorGuidance";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeTag(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function gpaScore(gpa, benchmark) {
  if (typeof gpa !== "number" || !Number.isFinite(gpa)) {
    return 45;
  }

  if (gpa >= benchmark.gpaCompetitive) {
    return 100;
  }

  if (gpa >= benchmark.gpaMinimum) {
    const ratio = (gpa - benchmark.gpaMinimum) / (benchmark.gpaCompetitive - benchmark.gpaMinimum || 1);
    return Math.round(60 + ratio * 40);
  }

  const deficitRatio = gpa / (benchmark.gpaMinimum || 1);
  return Math.round(clamp(deficitRatio * 60, 10, 59));
}

function ecScore(activityHours, extracurricularCount, benchmark) {
  const normalizedHours = Number.isFinite(Number(activityHours)) ? Number(activityHours) : 0;
  const normalizedCount = Number.isFinite(Number(extracurricularCount)) ? Number(extracurricularCount) : 0;

  const hoursComponent = clamp((normalizedHours / (benchmark.recommendedEcHours || 1)) * 70, 0, 70);
  const countComponent = clamp(
    (normalizedCount / (benchmark.recommendedActivityCount || 1)) * 30,
    0,
    30
  );

  return Math.round(hoursComponent + countComponent);
}

function alignmentScore(profile, benchmark) {
  const majorTrack = getMajorTrack(profile?.intendedMajor, profile?.majorRecommendation);

  const tags = new Set([
    ...(Array.isArray(profile?.interests) ? profile.interests : []),
    ...(Array.isArray(majorTrack?.opportunityTags) ? majorTrack.opportunityTags : []),
  ].map(normalizeTag).filter(Boolean));

  const requiredTags = (benchmark.focusTags || []).map(normalizeTag).filter(Boolean);
  if (requiredTags.length === 0) {
    return 50;
  }

  const matched = requiredTags.filter((tag) => tags.has(tag)).length;
  return Math.round(30 + (matched / requiredTags.length) * 70);
}

function bandFromScore(score) {
  if (score >= 82) {
    return "Strong Match";
  }
  if (score >= 68) {
    return "Possible Match";
  }
  if (score >= 52) {
    return "Reach";
  }
  return "High Reach";
}

function summaryFromScore(score, collegeName) {
  if (score >= 82) {
    return `Your current profile is competitive for ${collegeName}. Keep consistency high through this cycle.`;
  }
  if (score >= 68) {
    return `${collegeName} is realistic with stronger execution on academics and application depth.`;
  }
  if (score >= 52) {
    return `${collegeName} is a reach today. You need stronger GPA and EC momentum.`;
  }
  return `${collegeName} is currently a high reach. Build a stronger profile before applying.`;
}

function suggestionsFromBreakdown(breakdown, benchmark) {
  const suggestions = [];

  if (breakdown.gpa < 70) {
    suggestions.push(`Push GPA toward ${benchmark.gpaCompetitive.toFixed(2)} competitive range.`);
  }

  if (breakdown.ec < 70) {
    suggestions.push(
      `Increase activity depth to around ${benchmark.recommendedEcHours}+ hrs/week and ${benchmark.recommendedActivityCount}+ strong activities.`
    );
  }

  if (breakdown.alignment < 65) {
    suggestions.push(`Build projects and leadership in: ${benchmark.focusTags.slice(0, 3).join(", ")}.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Maintain your momentum and focus on essays, recommendations, and deadlines.");
  }

  return suggestions;
}

export function getCollegeByName(name) {
  const normalizedQuery = normalizeName(name);

  if (!normalizedQuery) {
    return null;
  }

  const exact = collegeBenchmarks.find((college) => normalizeName(college.name) === normalizedQuery);
  if (exact) {
    return exact;
  }

  return (
    collegeBenchmarks.find((college) => normalizeName(college.name).includes(normalizedQuery)) || null
  );
}

export function estimateCollegeFit(profile, college) {
  const extracurricularCount = Array.isArray(profile?.extracurriculars)
    ? profile.extracurriculars.length
    : 0;

  const breakdown = {
    gpa: gpaScore(profile?.gpa, college),
    ec: ecScore(profile?.activityHours, extracurricularCount, college),
    alignment: alignmentScore(profile, college),
  };

  const fitScore = Math.round(breakdown.gpa * 0.5 + breakdown.ec * 0.3 + breakdown.alignment * 0.2);

  return {
    college,
    fitScore,
    band: bandFromScore(fitScore),
    summary: summaryFromScore(fitScore, college.name),
    breakdown,
    suggestions: suggestionsFromBreakdown(breakdown, college),
  };
}

export function recommendCollegeMatches(profile, limit = 5) {
  return collegeBenchmarks
    .map((college) => estimateCollegeFit(profile, college))
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) {
        return b.fitScore - a.fitScore;
      }

      return a.college.acceptanceRate - b.college.acceptanceRate;
    })
    .slice(0, limit);
}
