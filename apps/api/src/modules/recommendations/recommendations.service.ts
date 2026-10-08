import { prisma } from '../../lib/prisma';

const STALE_DAYS_THRESHOLD = 10;
const LOW_MASTERY_THRESHOLD = 0.6;
const LOW_ATTEMPT_COUNT_THRESHOLD = 2;

export interface Recommendation {
  topicId: string;
  topicName: string;
  topicSlug: string;
  reason: string;
  score: number;
}

export async function getRecommendations(userId: string, limit = 3): Promise<Recommendation[]> {
  const [profiles, allLeafTopics] = await Promise.all([
    prisma.skillProfile.findMany({
      where: { userId },
      include: { topic: { select: { id: true, name: true, slug: true, parentId: true } } },
    }),
    prisma.topic.findMany({ where: { parentId: { not: null } } }),
  ]);

  const profileByTopicId = new Map(profiles.map((p) => [p.topicId, p]));
  const candidates: Recommendation[] = [];

  for (const topic of allLeafTopics) {
    const profile = profileByTopicId.get(topic.id);

    if (!profile) {
      // Never attempted at all — strong candidate, but lower priority than
      // "started but weak", since we have no evidence they even care about this area yet.
      candidates.push({
        topicId: topic.id,
        topicName: topic.name,
        topicSlug: topic.slug,
        reason: `You haven't tried ${topic.name} yet — worth exploring to see where you stand.`,
        score: 0.4,
      });
      continue;
    }

    const daysSincePracticed = profile.lastPracticedAt
      ? (Date.now() - profile.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    const isLowMastery = profile.masteryScore < LOW_MASTERY_THRESHOLD;
    const isStale = daysSincePracticed > STALE_DAYS_THRESHOLD;
    const isLowVolume = profile.totalWeightedAttempts < LOW_ATTEMPT_COUNT_THRESHOLD;

    if (!isLowMastery && !isStale && !isLowVolume) continue; // this topic is in good shape, skip it

    let score = 0;
    const reasons: string[] = [];

    if (isLowMastery) {
      score += (1 - profile.masteryScore) * 2; // weigh weakness heavily
      reasons.push(`your mastery here is ${Math.round(profile.masteryScore * 100)}%`);
    }
    if (isStale) {
      score += Math.min(daysSincePracticed / STALE_DAYS_THRESHOLD, 2);
      reasons.push(
        profile.lastPracticedAt
          ? `you haven't practiced it in ${Math.floor(daysSincePracticed)} days`
          : `you've never practiced it`
      );
    }
    if (isLowVolume) {
      score += 0.5;
      reasons.push(`you've only attempted it a couple of times`);
    }

    candidates.push({
      topicId: topic.id,
      topicName: topic.name,
      topicSlug: topic.slug,
      reason: `Recommended because ${reasons.join(' and ')}.`,
      score,
    });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}