import { AiProvider } from './aiProvider';

export interface ReviewResumeInput {
  resumeText: string;
  jobDescription?: string;
}

function buildPrompt(input: ReviewResumeInput): string {
  const jdSection = input.jobDescription
    ? `\n\nTarget job description:\n${input.jobDescription}\n\nEvaluate the resume specifically against this job description.`
    : '\n\nNo specific job description was provided — give general feedback for a CSE placement candidate.';

  return `You are an experienced technical recruiter reviewing a resume for a computer science student applying for software engineering roles.

Resume:
${input.resumeText}${jdSection}

Provide feedback in this exact structure:

STRENGTHS:
- (2-3 bullet points)

GAPS:
- (2-3 bullet points on what's missing or weak)

SUGGESTIONS:
- (2-3 concrete, actionable improvements)

Be specific and direct. Do not be generic or overly positive — the student needs honest, actionable feedback.`;
}

export async function reviewResume(provider: AiProvider, input: ReviewResumeInput): Promise<string> {
  const prompt = buildPrompt(input);
  return provider.complete(prompt);
}