import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { explainAttempt } from './explainAttempt';
import { GroqProvider } from './groqProvider';
import { AiProviderError } from './aiProvider';
import { reviewResumeSchema } from './ai.types';
import { reviewResume } from './reviewResume';

const explainRequestSchema = z.object({
  activityId: z.string().uuid(),
});

const provider = new GroqProvider();

export async function explainWrongAttempt(req: Request, res: Response) {
  const parsed = explainRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const activity = await prisma.activity.findFirst({
    where: { id: parsed.data.activityId, userId: req.user!.id },
    include: {
      attempt: {
        include: {
          question: { select: { prompt: true, options: true, correctOptionId: true } },
          sqlExercise: { select: { prompt: true } },
          dsaProblem: { select: { prompt: true } },
        },
      },
    },
  });

  if (!activity || !activity.attempt) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  if (activity.attempt.isCorrect) {
    return res.status(400).json({ error: 'This attempt was already correct — nothing to explain' });
  }

  if (activity.type !== 'MCQ' && activity.type !== 'SQL' && activity.type !== 'DSA') {
    return res.status(400).json({ error: 'Explanations are not available for this activity type' });
  }

  let input;

  if (activity.type === 'MCQ') {
    const question = activity.attempt.question;
    if (!question) {
      return res.status(404).json({ error: 'Question not found for this attempt' });
    }
    const options = question.options as unknown as { id: string; text: string }[];
    const selectedText = options.find((o) => o.id === activity.attempt!.selectedOptionId)?.text ?? 'an option';
    const correctText = options.find((o) => o.id === question.correctOptionId)?.text ?? 'the correct option';

    input = {
      type: 'MCQ' as const,
      prompt: question.prompt,
      submission: selectedText,
      correctAnswer: correctText,
    };
  } else if (activity.type === 'SQL') {
    input = {
      type: 'SQL' as const,
      prompt: activity.attempt.sqlExercise?.prompt ?? '',
      submission: activity.attempt.submittedQuery ?? '',
      errorDetail: activity.attempt.executionError,
    };
  } else {
    input = {
      type: 'DSA' as const,
      prompt: activity.attempt.dsaProblem?.prompt ?? '',
      submission: activity.attempt.submittedCode ?? '',
      errorDetail: null,
    };
  }

  try {
    const explanation = await explainAttempt(provider, input);
    return res.status(200).json({ explanation });
  } catch (err) {
    if (err instanceof AiProviderError) {
      console.error('[AI explain] provider error:', err.message);
      return res.status(502).json({ error: 'AI explanation service is currently unavailable' });
    }
    throw err;
  }
}

export async function reviewResumeHandler(req: Request, res: Response) {
  const parsed = reviewResumeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const feedback = await reviewResume(provider, {
      resumeText: parsed.data.resumeText,
      jobDescription: parsed.data.jobDescription,
    });

    await prisma.resumeReview.create({
      data: {
        userId: req.user!.id,
        resumeText: parsed.data.resumeText,
        jobDescription: parsed.data.jobDescription,
        feedback,
      },
    });

    return res.status(200).json({ feedback });
  } catch (err) {
    if (err instanceof AiProviderError) {
      console.error('[AI review-resume] provider error:', err.message);
      return res.status(502).json({ error: 'AI review service is currently unavailable' });
    }
    throw err;
  }
}

export async function listResumeReviews(req: Request, res: Response) {
  const reviews = await prisma.resumeReview.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, feedback: true, createdAt: true, jobDescription: true },
  });
  return res.status(200).json(reviews);
}