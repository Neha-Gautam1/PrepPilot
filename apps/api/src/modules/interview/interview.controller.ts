import { Request, Response } from 'express';
import { startInterviewSchema, answerInterviewSchema } from './interview.types';
import { startInterview, submitAnswer, SessionNotFoundError } from './interview.service';
import { GroqProvider } from '../ai/groqProvider';
import { AiProviderError } from '../ai/aiProvider';
import { getSessionsForUser } from './interview.service';

const provider = new GroqProvider();

export async function start(req: Request, res: Response) {
  const parsed = startInterviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await startInterview(provider, req.user!.id, parsed.data.type, parsed.data.topicId);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof AiProviderError) {
      return res.status(502).json({ error: 'AI interview service is currently unavailable' });
    }
    if (err.message === 'Topic not found' || err.message.includes('topicId is required')) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
}

export async function answer(req: Request, res: Response) {
  const parsed = answerInterviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await submitAnswer(provider, parsed.data.sessionToken, parsed.data.answer);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof AiProviderError) {
      return res.status(502).json({ error: 'AI interview service is currently unavailable' });
    }
    throw err;
  }
}

export async function listSessions(req: Request, res: Response) {
  const sessions = await getSessionsForUser(req.user!.id);
  return res.status(200).json(sessions);
}