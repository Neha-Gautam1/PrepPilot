import { Request, Response } from 'express';
import { getAllTopics, getQuestionsByTopic, getSqlExercisesByTopic, getDsaProblemsByTopic } from './topics.service';

export async function listTopics(_req: Request, res: Response) {
  const topics = await getAllTopics();
  return res.status(200).json(topics);
}

export async function listQuestionsForTopic(req: Request, res: Response) {
  const { id } = req.params;
  const questions = await getQuestionsByTopic(id);

  // Strip correctOptionId + explanation so students can't see the answer via API.
  const sanitized = questions.map(({ correctOptionId, explanation, ...rest }) => rest);

  return res.status(200).json(sanitized);
}

export async function listSqlExercisesForTopic(req: Request, res: Response) {
  const { id } = req.params;
  const exercises = await getSqlExercisesByTopic(id);
  const sanitized = exercises.map(({ canonicalQuery, expectedResultJson, ...rest }) => rest);
  return res.status(200).json(sanitized);
}

export async function listDsaProblemsForTopic(req: Request, res: Response) {
  const { id } = req.params;
  const problems = await getDsaProblemsByTopic(id);
  const sanitized = problems.map(({ testCases, ...rest }) => rest);
  return res.status(200).json(sanitized);
}