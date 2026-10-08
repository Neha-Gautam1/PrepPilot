import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { AiProvider, AiProviderError } from '../ai/aiProvider';
import { InMemorySession } from './interview.types';

const QUESTIONS_PER_SESSION = 3;

const sessions = new Map<string, InMemorySession>();

export class SessionNotFoundError extends Error {}

function extractQuestion(raw: string): string {
  return raw.trim();
}

async function generateQuestion(
  provider: AiProvider,
  type: 'TECHNICAL' | 'HR',
  topicName: string | null,
  previousQuestions: string[]
): Promise<string> {
  const avoidList = previousQuestions.length
    ? `\n\nDo not repeat or closely resemble these already-asked questions:\n${previousQuestions.map((q) => `- ${q}`).join('\n')}`
    : '';

  const prompt =
    type === 'TECHNICAL'
      ? `You are conducting a technical interview for a computer science student on the topic of "${topicName}".

Ask ONE open-ended technical interview question appropriate for a placement interview. Do not ask a multiple-choice or yes/no question. Do not provide the answer. Return ONLY the question text, nothing else.${avoidList}`
      : `You are conducting an HR/behavioral interview for a computer science student applying for a software engineering placement.

Ask ONE open-ended behavioral or situational interview question (e.g. teamwork, conflict resolution, handling failure, career goals). Return ONLY the question text, nothing else.${avoidList}`;

  const response = await provider.complete(prompt);
  return extractQuestion(response);
}

export async function startInterview(
  provider: AiProvider,
  userId: string,
  type: 'TECHNICAL' | 'HR',
  topicId?: string
) {
  let topicName: string | null = null;

  if (type === 'TECHNICAL') {
    if (!topicId) throw new Error('topicId is required for TECHNICAL interviews');
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) throw new Error('Topic not found');
    topicName = topic.name;
  }

  const question = await generateQuestion(provider, type, topicName, []);
  const sessionToken = crypto.randomUUID();

  sessions.set(sessionToken, {
    userId,
    type,
    topicId: topicId ?? null,
    topicName,
    qaPairs: [],
    currentQuestion: question,
  });

  return { sessionToken, question, questionNumber: 1, totalQuestions: QUESTIONS_PER_SESSION };
}

async function scoreSession(
  provider: AiProvider,
  type: 'TECHNICAL' | 'HR',
  topicName: string | null,
  qaPairs: { question: string; answer: string }[]
) {
  const transcriptText = qaPairs
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  const subject = type === 'TECHNICAL' ? `on "${topicName}"` : 'a behavioral/HR interview';

  const dimensionNote =
    type === 'TECHNICAL'
      ? '- Technical Accuracy: correctness of the technical content in their answers'
      : '- Technical Accuracy: here, score how substantive and relevant their examples were (use this dimension for "depth of examples" since all three fields must be present)';

  const prompt = `You are an experienced interviewer evaluating a completed ${type === 'TECHNICAL' ? 'technical' : 'HR/behavioral'} interview ${subject}.

Transcript:
${transcriptText}

Score the candidate on three dimensions, each 0-100:
${dimensionNote}
- Communication: clarity and structure of how they explained themselves
- Completeness: whether their answers were sufficiently thorough

Then give 2-3 sentences of overall feedback.

Respond in EXACTLY this format, nothing else:
TECHNICAL_ACCURACY: <number>
COMMUNICATION: <number>
COMPLETENESS: <number>
FEEDBACK: <text>`;

  const response = await provider.complete(prompt);

  const technicalMatch = response.match(/TECHNICAL_ACCURACY:\s*(\d+)/i);
  const communicationMatch = response.match(/COMMUNICATION:\s*(\d+)/i);
  const completenessMatch = response.match(/COMPLETENESS:\s*(\d+)/i);
  const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]+)/i);

  if (!technicalMatch || !communicationMatch || !completenessMatch || !feedbackMatch) {
    throw new AiProviderError('Could not parse scoring response from AI');
  }

  return {
    technicalAccuracy: Math.min(100, Math.max(0, parseInt(technicalMatch[1], 10))),
    communication: Math.min(100, Math.max(0, parseInt(communicationMatch[1], 10))),
    completeness: Math.min(100, Math.max(0, parseInt(completenessMatch[1], 10))),
    overallFeedback: feedbackMatch[1].trim(),
  };
}

export async function submitAnswer(provider: AiProvider, sessionToken: string, answer: string) {
  const session = sessions.get(sessionToken);
  if (!session) throw new SessionNotFoundError('Interview session not found or expired');

  session.qaPairs.push({ question: session.currentQuestion, answer });

  if (session.qaPairs.length < QUESTIONS_PER_SESSION) {
    const previousQuestions = session.qaPairs.map((qa) => qa.question);
    const nextQuestion = await generateQuestion(provider, session.type, session.topicName, previousQuestions);
    session.currentQuestion = nextQuestion;

    return {
      done: false as const,
      question: nextQuestion,
      questionNumber: session.qaPairs.length + 1,
      totalQuestions: QUESTIONS_PER_SESSION,
    };
  }

  const scores = await scoreSession(provider, session.type, session.topicName, session.qaPairs);

  const saved = await prisma.mockInterviewSession.create({
    data: {
      userId: session.userId,
      type: session.type,
      topicId: session.topicId,
      transcript: session.qaPairs as any,
      technicalAccuracy: scores.technicalAccuracy,
      communication: scores.communication,
      completeness: scores.completeness,
      overallFeedback: scores.overallFeedback,
    },
  });

  sessions.delete(sessionToken);

  return {
    done: true as const,
    sessionId: saved.id,
    technicalAccuracy: scores.technicalAccuracy,
    communication: scores.communication,
    completeness: scores.completeness,
    overallFeedback: scores.overallFeedback,
  };
}

export async function getSessionsForUser(userId: string) {
  const sessions = await prisma.mockInterviewSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { topic: { select: { name: true } } },
  });

  return sessions.map((s) => ({
    id: s.id,
    type: s.type,
    topicName: s.topic?.name ?? null,
    technicalAccuracy: s.technicalAccuracy,
    communication: s.communication,
    completeness: s.completeness,
    overallFeedback: s.overallFeedback,
    createdAt: s.createdAt,
  }));
}