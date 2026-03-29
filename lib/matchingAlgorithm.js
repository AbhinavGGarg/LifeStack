const DEADLINE_SOON_DAYS = 30;

function normalizeTag(tag) {
  return String(tag || "").trim().toLowerCase();
}

function getDaysUntil(deadline) {
  const now = new Date();
  const end = new Date(deadline);

  if (Number.isNaN(end.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const msInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - now.getTime()) / msInDay);
}

export function matchOpportunities(user, opportunities) {
  const userInterests = Array.isArray(user?.interests)
    ? user.interests.map(normalizeTag).filter(Boolean)
    : [];

  return opportunities
    .map((opportunity) => {
      const opportunityTags = Array.isArray(opportunity.tags)
        ? opportunity.tags.map(normalizeTag)
        : [];

      const matchingTags = opportunityTags.filter((tag) =>
        userInterests.includes(tag)
      );

      const daysUntilDeadline = getDaysUntil(opportunity.deadline);
      const deadlineSoon = daysUntilDeadline >= 0 && daysUntilDeadline <= DEADLINE_SOON_DAYS;

      const scoreFromTags = matchingTags.length * 2;
      const scoreFromDeadline = deadlineSoon ? 1 : 0;
      const matchScore = scoreFromTags + scoreFromDeadline;

      let recommendedAction = null;
      if (daysUntilDeadline >= 0 && daysUntilDeadline <= 14) {
        recommendedAction = "Apply Soon";
      } else if (matchScore >= 4) {
        recommendedAction = "High Match";
      }

      return {
        ...opportunity,
        matchingTags,
        daysUntilDeadline,
        deadlineSoon,
        matchScore,
        recommendedAction,
      };
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
}
