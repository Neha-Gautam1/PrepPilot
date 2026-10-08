import { prisma } from '../../lib/prisma';
import { SubmitMcqAttemptInput, SubmitSqlAttemptInput, SubmitDsaAttemptInput } from './activities.types';
import { recomputeSkillProfiles } from '../analysis/analysis.service';
import { validateReadOnlySelect } from './sqlSafety';
import { executeSandboxQuery, normalizeRows } from './sqlExecutor';
import { runTestCasesForLanguage, TestCase } from './codeExecutor';

export class QuestionNotFoundError extends Error {}
export class SqlExerciseNotFoundError extends Error {}
export class UnsafeQueryError extends Error {}
export class DsaProblemNotFoundError extends Error {}

export async function submitMcqAttempt(userId: string, input: SubmitMcqAttemptInput) {
  const question = await prisma.question.findUnique({ where: { id: input.questionId } });
  if (!question) throw new QuestionNotFoundError('Question not found');

  const isCorrect = question.correctOptionId === input.selectedOptionId;

  const activity = await prisma.activity.create({
    data: {
      userId,
      topicId: question.topicId,
      type: 'MCQ',
      attempt: {
        create: {
          questionId: question.id,
          selectedOptionId: input.selectedOptionId,
          isCorrect,
          timeTakenMs: input.timeTakenMs,
        },
      },
    },
    include: { attempt: true },
  });

  recomputeSkillProfiles(userId).catch((err) => {
    console.error('[recompute] failed after MCQ submission for user', userId, err);
  });

  return {
    activityId: activity.id,
    isCorrect,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  };
}

export async function submitSqlAttempt(userId: string, input: SubmitSqlAttemptInput) {
  const exercise = await prisma.sqlExercise.findUnique({ where: { id: input.sqlExerciseId } });
  if (!exercise) throw new SqlExerciseNotFoundError('SQL exercise not found');

  const validation = validateReadOnlySelect(input.query);
  if (!validation.ok) throw new UnsafeQueryError(validation.reason ?? 'Query not allowed');

  let executionError: string | null = null;
  let isCorrect = false;
  let rowCount = 0;

  try {
    const rows = await executeSandboxQuery(input.query);
    rowCount = Array.isArray(rows) ? rows.length : 0;
    const normalized = normalizeRows(rows);
    isCorrect = JSON.stringify(normalized) === JSON.stringify(exercise.expectedResultJson);
  } catch (err: any) {
    executionError = (err.message ?? 'Query execution failed').slice(0, 500);
  }

  const activity = await prisma.activity.create({
    data: {
      userId,
      topicId: exercise.topicId,
      type: 'SQL',
      attempt: {
        create: {
          sqlExerciseId: exercise.id,
          submittedQuery: input.query,
          executionError,
          isCorrect,
          timeTakenMs: input.timeTakenMs,
        },
      },
    },
    include: { attempt: true },
  });

  recomputeSkillProfiles(userId).catch((err) => {
    console.error('[recompute] failed after SQL submission for user', userId, err);
  });

  return { activityId: activity.id, isCorrect, executionError, rowCount };
}

export async function submitDsaAttempt(userId: string, input: SubmitDsaAttemptInput) {
  const problem = await prisma.dsaProblem.findUnique({ where: { id: input.dsaProblemId } });
  if (!problem) throw new DsaProblemNotFoundError('DSA problem not found');

  const testCases = problem.testCases as unknown as TestCase[];
  const results = await runTestCasesForLanguage(input.language, problem.functionName, input.code, testCases);

  const testsPassed = results.filter((r) => r.passed).length;
  const testsTotal = results.length;
  const isCorrect = testsPassed === testsTotal;

  const activity = await prisma.activity.create({
    data: {
      userId,
      topicId: problem.topicId,
      type: 'DSA',
      attempt: {
          create: {
          dsaProblemId: problem.id,
          submittedCode: input.code,
          language: input.language,
          testsPassed,
          testsTotal,
          hintsUsed: input.hintsUsed,
          isCorrect,
          timeTakenMs: input.timeTakenMs,
        },
      },
    },
    include: { attempt: true },
  });

  recomputeSkillProfiles(userId).catch((err) => {
    console.error('[recompute] failed after DSA submission for user', userId, err);
  });

  return {
    activityId: activity.id,
    isCorrect,
    testsPassed,
    testsTotal,
    results: results.map((r) => ({ passed: r.passed, error: r.error })),
  };
}

export async function getActivityHistoryForUser(userId: string, limit = 50) {
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      topic: { select: { name: true, slug: true } },
      attempt: {
        include: {
          question: { select: { prompt: true } },
          sqlExercise: { select: { prompt: true } },
          dsaProblem: { select: { prompt: true } },
        },
      },
    },
  });

  return activities.map((a) => ({
    id: a.id,
    type: a.type,
    topicName: a.topic.name,
    topicSlug: a.topic.slug,
    createdAt: a.createdAt,
    isCorrect: a.attempt?.isCorrect ?? null,
    timeTakenMs: a.attempt?.timeTakenMs ?? null,
    questionPrompt:
      a.attempt?.question?.prompt ?? a.attempt?.sqlExercise?.prompt ?? a.attempt?.dsaProblem?.prompt ?? null,
  }));
}