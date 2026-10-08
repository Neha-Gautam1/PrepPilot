import { prisma } from '../../lib/prisma';

const HEATMAP_DAYS = 90;

async function getTopLevelSkillProfiles(userId: string) {
  return prisma.skillProfile.findMany({
    where: {
      userId,
      topic: { parentId: null }, // top-level subjects only
    },
    include: { topic: { select: { id: true, name: true, slug: true } } },
  });
}

export async function getReadinessScore(userId: string) {
  const profiles = await getTopLevelSkillProfiles(userId);

  if (profiles.length === 0) {
    return { score: 0, subjectsCovered: 0 };
  }

  const avg = profiles.reduce((sum, p) => sum + p.masteryScore, 0) / profiles.length;

  return {
    score: Math.round(avg * 100),
    subjectsCovered: profiles.length,
  };
}

export async function getWeakTopics(userId: string, limit = 5) {
  const profiles = await getTopLevelSkillProfiles(userId);

  return profiles
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, limit)
    .map((p) => ({
      topicId: p.topic.id,
      name: p.topic.name,
      slug: p.topic.slug,
      masteryScore: p.masteryScore,
    }));
}

export async function getPreparationBalance(userId: string) {
  // Count attempts per top-level subject by joining Activity -> Topic -> ancestor chain.
  // Since Attempt links to a leaf Question/Topic, we roll counts up the same way analysis does.
  const [topLevelTopics, activities] = await Promise.all([
    prisma.topic.findMany({ where: { parentId: null } }),
    prisma.activity.findMany({
      where: { userId },
      select: { topicId: true },
    }),
  ]);

  const allTopics = await prisma.topic.findMany({ select: { id: true, parentId: true } });
  const parentOf = new Map(allTopics.map((t) => [t.id, t.parentId]));

  function findTopLevelAncestor(topicId: string): string {
    let current = topicId;
    while (parentOf.get(current)) {
      current = parentOf.get(current)!;
    }
    return current;
  }

  const countByTopLevel = new Map<string, number>();
  for (const activity of activities) {
    const topLevelId = findTopLevelAncestor(activity.topicId);
    countByTopLevel.set(topLevelId, (countByTopLevel.get(topLevelId) ?? 0) + 1);
  }

  const totalActivities = activities.length;

  return topLevelTopics.map((t) => {
    const count = countByTopLevel.get(t.id) ?? 0;
    return {
      topicId: t.id,
      name: t.name,
      slug: t.slug,
      activityCount: count,
      percentage: totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0,
    };
  });
}

export async function getActivityHeatmap(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - HEATMAP_DAYS);

  const activities = await prisma.activity.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const countByDate = new Map<string, number>();
  for (const a of activities) {
    const dateKey = a.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1);
  }

  return Array.from(countByDate.entries()).map(([date, count]) => ({ date, count }));
}

export async function getDashboardSummary(userId: string) {
  const [readiness, weakTopics, balance, heatmap] = await Promise.all([
    getReadinessScore(userId),
    getWeakTopics(userId),
    getPreparationBalance(userId),
    getActivityHeatmap(userId),
  ]);

  return { readiness, weakTopics, balance, heatmap };
}