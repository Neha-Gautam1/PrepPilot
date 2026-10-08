import { prisma } from "../../lib/prisma";

export async function getAllTopics() {
  return prisma.topic.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getQuestionsByTopic(topicId: string) {
  return prisma.question.findMany({
    where: { topicId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getSqlExercisesByTopic(topicId: string) {
  return prisma.sqlExercise.findMany({
    where: { topicId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getDsaProblemsByTopic(topicId: string) {
  return prisma.dsaProblem.findMany({
    where: { topicId },
    orderBy: { createdAt: 'asc' },
  });
}