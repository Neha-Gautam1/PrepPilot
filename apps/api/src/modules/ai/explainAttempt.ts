import { AiProvider } from './aiProvider';

export type ExplainableActivityType = 'MCQ' | 'SQL' | 'DSA';

export interface ExplainAttemptInput {
  type: ExplainableActivityType;
  prompt: string;
  submission: string;
  errorDetail?: string | null;
  correctAnswer?: string | null; // used for MCQ
}

function buildPrompt(input: ExplainAttemptInput): string {
  if (input.type === 'MCQ') {
    return `You are a patient tutor helping a computer science student preparing for placements.

The student answered this multiple-choice question incorrectly:

Question: ${input.prompt}

They selected: "${input.submission}"
The correct answer is: "${input.correctAnswer}"

In 3-4 short sentences, explain the underlying concept and why the correct answer is right. Be encouraging but direct.`;
  }

  const header =
    input.type === 'SQL'
      ? 'A student submitted this SQL query, which was incorrect:'
      : 'A student submitted this code, which failed one or more test cases:';

  const errorNote = input.errorDetail ? `\n\nIt produced this error: ${input.errorDetail}` : '';

  return `You are a patient tutor helping a computer science student preparing for placements.

${header}

Exercise: ${input.prompt}

Student's submission:
${input.submission}${errorNote}

In 3-4 short sentences, explain what's likely wrong with their approach and give one concrete hint toward fixing it. Do not give the full corrected solution. Be encouraging but direct.`;
}

export async function explainAttempt(provider: AiProvider, input: ExplainAttemptInput): Promise<string> {
  const prompt = buildPrompt(input);
  return provider.complete(prompt);
}