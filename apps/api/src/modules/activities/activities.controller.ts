import { Request, Response } from 'express';
import { submitMcqAttemptSchema, submitSqlAttemptSchema, submitDsaAttemptSchema } from './activities.types';
import {
  submitMcqAttempt,
  submitSqlAttempt,
  submitDsaAttempt,
  getActivityHistoryForUser,
  QuestionNotFoundError,
  SqlExerciseNotFoundError,
  UnsafeQueryError,
  DsaProblemNotFoundError,
} from './activities.service';

export async function submitMcq(req: Request, res: Response) {
  const parsed = submitMcqAttemptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await submitMcqAttempt(req.user!.id, parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof QuestionNotFoundError) return res.status(404).json({ error: 'Question not found' });
    throw err;
  }
}

export async function submitSql(req: Request, res: Response) {
  const parsed = submitSqlAttemptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await submitSqlAttempt(req.user!.id, parsed.data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof SqlExerciseNotFoundError) return res.status(404).json({ error: 'SQL exercise not found' });
    if (err instanceof UnsafeQueryError) return res.status(400).json({ error: err.message });
    throw err;
  }
}

export async function submitDsa(req: Request, res: Response) {
  const parsed = submitDsaAttemptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await submitDsaAttempt(req.user!.id, parsed.data);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof DsaProblemNotFoundError) return res.status(404).json({ error: 'DSA problem not found' });
    if (err.name === 'Judge0ConfigError') {
      return res.status(503).json({ error: 'This language is not configured on the server yet (missing JUDGE0_API_KEY).' });
    }
    throw err;
  }
}

export async function getMyHistory(req: Request, res: Response) {
  const history = await getActivityHistoryForUser(req.user!.id);
  return res.status(200).json(history);
}