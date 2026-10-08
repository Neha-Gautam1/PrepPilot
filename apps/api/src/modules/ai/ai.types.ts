import { z } from 'zod';

export const reviewResumeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text seems too short').max(10000),
  jobDescription: z.string().max(5000).optional(),
});

export type ReviewResumeRequestInput = z.infer<typeof reviewResumeSchema>;