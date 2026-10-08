import { z } from 'zod';

export const submitMcqAttemptSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().min(1),
  timeTakenMs: z.number().int().positive(),
});

export type SubmitMcqAttemptInput = z.infer<typeof submitMcqAttemptSchema>;

export const submitSqlAttemptSchema = z.object({
  sqlExerciseId: z.string().uuid(),
  query: z.string().min(1).max(2000),
  timeTakenMs: z.number().int().positive(),
});

export type SubmitSqlAttemptInput = z.infer<typeof submitSqlAttemptSchema>;

export const submitDsaAttemptSchema = z.object({
  dsaProblemId: z.string().uuid(),
  code: z.string().min(1).max(5000),
  timeTakenMs: z.number().int().positive(),
  hintsUsed: z.number().int().min(0).default(0),
  language: z.enum(['javascript', 'python', 'cpp', 'java']).default('javascript'),
});

export type SubmitDsaAttemptInput = z.infer<typeof submitDsaAttemptSchema>;