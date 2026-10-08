import { z } from 'zod';

export const startInterviewSchema = z.object({
  type: z.enum(['TECHNICAL', 'HR']),
  topicId: z.string().uuid().optional(),
}).refine(
  (data) => data.type === 'HR' || !!data.topicId,
  { message: 'topicId is required for TECHNICAL interviews' }
);

export const answerInterviewSchema = z.object({
  sessionToken: z.string().uuid(),
  answer: z.string().min(1).max(3000),
});

export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type AnswerInterviewInput = z.infer<typeof answerInterviewSchema>;

export interface QaPair {
  question: string;
  answer: string;
}

export interface InMemorySession {
  userId: string;
  type: 'TECHNICAL' | 'HR';
  topicId: string | null;
  topicName: string | null;
  qaPairs: QaPair[];
  currentQuestion: string;
}