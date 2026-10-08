import { prisma } from '../../lib/prisma';
import { Difficulty } from '@prisma/client';

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

const RECENCY_GRACE_DAYS = 7;
const RECENCY_DECAY_WINDOW_DAYS = 60;
const RECENCY_FLOOR = 0.5;

function computeRecencyFactor(lastPracticedAt: Date): number {
  const daysSince = (Date.now() - lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= RECENCY_GRACE_DAYS) return 1;
  const decayProgress = (daysSince - RECENCY_GRACE_DAYS) / RECENCY_DECAY_WINDOW_DAYS;
  const factor = 1 - decayProgress;
  return Math.max(RECENCY_FLOOR, factor);
}

function buildSubtreeMap(topics: { id: string; parentId: string | null }[]): Map<string, Set<string>> {
  const childrenOf = new Map<string, string[]>();
  for (const t of topics) {
    if (t.parentId) {
      const list = childrenOf.get(t.parentId) ?? [];
      list.push(t.id);
      childrenOf.set(t.parentId, list);
    }
  }

  const subtreeCache = new Map<string, Set<string>>();

  function collect(topicId: string): Set<string> {
    if (subtreeCache.has(topicId)) return subtreeCache.get(topicId)!;
    const result = new Set<string>([topicId]);
    const children = childrenOf.get(topicId) ?? [];
    for (const childId of children) {
      for (const id of collect(childId)) {
        result.add(id);
      }
    }
    subtreeCache.set(topicId, result);
    return result;
  }

  for (const t of topics) collect(t.id);
  return subtreeCache;
}

interface RelevantAttempt {
  correctnessRatio: number; // 1 or 0 for MCQ/SQL; testsPassed/testsTotal for DSA
  difficulty: Difficulty;
  createdAt: Date;
}

export async function recomputeSkillProfiles(userId: string) {
  const [allTopics, attempts] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, parentId: true } }),
    prisma.attempt.findMany({
      where: { activity: { userId } },
      include: {
        question: { select: { topicId: true, difficulty: true } },
        sqlExercise: { select: { topicId: true, difficulty: true } },
        dsaProblem: { select: { topicId: true, difficulty: true } },
      },
    }),
  ]);

  const attemptsByLeafTopic = new Map<string, RelevantAttempt[]>();
  for (const attempt of attempts) {
    const source = attempt.question ?? attempt.sqlExercise ?? attempt.dsaProblem;
    if (!source) continue;

      const hasPartialCredit = attempt.testsTotal != null && attempt.testsTotal > 0;
    const correctnessRatio = hasPartialCredit
      ? (attempt.testsPassed ?? 0) / attempt.testsTotal!
      : attempt.isCorrect
      ? 1
      : 0;

    const topicId = source.topicId;
    const list = attemptsByLeafTopic.get(topicId) ?? [];
    list.push({
      correctnessRatio,
      difficulty: source.difficulty,
      createdAt: attempt.createdAt,
    });
    attemptsByLeafTopic.set(topicId, list);
  }

  const subtreeMap = buildSubtreeMap(allTopics);
  const results: { topicId: string; masteryScore: number; totalWeightedAttempts: number; correctWeightedAttempts: number; lastPracticedAt: Date }[] = [];

  for (const topic of allTopics) {
    const subtreeIds = subtreeMap.get(topic.id)!;
    const relevant: RelevantAttempt[] = [];
    for (const id of subtreeIds) {
      const list = attemptsByLeafTopic.get(id);
      if (list) relevant.push(...list);
    }

    if (relevant.length === 0) continue;

    let totalWeighted = 0;
    let correctWeighted = 0;
    let lastPracticedAt = relevant[0].createdAt;

       for (const a of relevant) {
      const weight = DIFFICULTY_WEIGHT[a.difficulty];
      totalWeighted += weight;
      correctWeighted += weight * a.correctnessRatio;
      if (a.createdAt > lastPracticedAt) lastPracticedAt = a.createdAt;
    }

    const weightedAccuracy = correctWeighted / totalWeighted;
    const recencyFactor = computeRecencyFactor(lastPracticedAt);
    const masteryScore = Math.max(0, Math.min(1, weightedAccuracy * recencyFactor));

    results.push({
      topicId: topic.id,
      masteryScore,
      totalWeightedAttempts: totalWeighted,
      correctWeightedAttempts: correctWeighted,
      lastPracticedAt,
    });
  }

  await Promise.all(
    results.map((r) =>
      prisma.skillProfile.upsert({
        where: { userId_topicId: { userId, topicId: r.topicId } },
        update: {
          masteryScore: r.masteryScore,
          totalWeightedAttempts: r.totalWeightedAttempts,
          correctWeightedAttempts: r.correctWeightedAttempts,
          lastPracticedAt: r.lastPracticedAt,
          computedAt: new Date(),
        },
        create: {
          userId,
          topicId: r.topicId,
          masteryScore: r.masteryScore,
          totalWeightedAttempts: r.totalWeightedAttempts,
          correctWeightedAttempts: r.correctWeightedAttempts,
          lastPracticedAt: r.lastPracticedAt,
        },
      })
    )
  );

  return results.length;
}

export async function getSkillProfilesForUser(userId: string) {
  return prisma.skillProfile.findMany({
    where: { userId },
    include: { topic: { select: { name: true, slug: true, parentId: true } } },
    orderBy: { masteryScore: 'asc' },
  });
}